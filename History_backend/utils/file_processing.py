import os
import uuid
from fastapi import UploadFile, HTTPException
from PIL import Image
from io import BytesIO
import fitz
from utils.database import save_document_to_db
from typing import List
import json
from utils.request import send_request
import asyncio
from paddlex import create_pipeline
import datetime


# 初始化OCR pipeline
ocr_pipeline = create_pipeline(pipeline="OCR")
progress_tracker = {}

async def upload_file(email: str, file: UploadFile):
    CACHED_DIR = os.path.abspath("./cached")
    user_dir = os.path.join(CACHED_DIR, email)
    os.makedirs(user_dir, exist_ok=True)

    file_path = os.path.join(user_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    web_accessible_path = f"/cached/{email}/{file.filename}"
    return {"file_path": web_accessible_path}

async def get_file_list(email: str):
    CACHED_DIR = os.path.abspath("./cached")
    user_dir = os.path.join(CACHED_DIR, email)
    if not os.path.exists(user_dir):
        return {"files": []}
    files = os.listdir(user_dir)
    return {"files": files}

async def pdf_to_images(pdf_path: str, start_page: int, end_page: int):
    doc = fitz.open(pdf_path)
    images = []
    output_dir = "./images"
    os.makedirs(output_dir, exist_ok=True)
    
    for page_num in range(start_page - 1, end_page):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=500)
        img = Image.open(BytesIO(pix.tobytes("png")))
        image_path = os.path.join(output_dir, f"{os.path.splitext(os.path.basename(pdf_path))[0]}_{page_num + 1}.png")
        img.save(image_path, format="PNG")
        images.append(image_path)

    doc.close()
    return images

async def process_single_image_ocr(image):
    """处理单个图像的OCR"""
    try:
        output = ocr_pipeline.predict(image)
        for res in output:
            text = "".join(_ for _ in res["rec_text"])
        return text
    except Exception as e:
        print(f"OCR Error: {e}")
        return None

async def process_images(all_texts: str, language: str):
    """将所有OCR文本一起发送给GPT处理"""
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer sk-SkV6Leve2mXaej9lNP6VMuhugmbC2B6J6x8ASVQutg50hQt1"
        }
        
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": f"你是一位历史研究的专家，精通{language}，并且熟悉目录整理。请使用双引号而不是单引号来包裹JSON的键和值。"
                },
                {
                    "role": "user",
                    "content": [{"type": "text", "text": "格式要求：1.除了给定文本，请不要增加其他内容。2.以及目录和子目录（如附）都应当作为一条记录返回，并使用目录页码。3.目录应当尽可能完整，包含：前后的所有文本，并删除目录前的序号数字，但忽略目录中的人名，如朱德、张闻天等。4.部分目录的时间在页码之后，请你将其放置于标题后，并且不要将汉字数字改为阿拉伯数字。5.请返回dict格式，使用双引号，例如{\"页码\":\"目录文本\", \"页码\":\"目录文本\"...}。6.请删除内容中的\\n和空格。"}]
                },
                {
                    "role": "user",
                    "content": [{"type": "text", "text": f"请你精确识别目录内容，并按照格式要求返回结果：{all_texts}"}]
                }
            ],
            "top_p": 1,
            "temperature": 0,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }
        
        response = send_request(headers, payload)
        if not response or not hasattr(response, 'choices'):
            await asyncio.sleep(2)
            response = send_request(headers, payload)
            
        if response and hasattr(response, 'choices'):
            try:
                response_content = response.choices[0].message.content
                response_content = response_content.strip()
                if response_content.startswith('```') and response_content.endswith('```'):
                    response_content = response_content[3:-3].strip()
                
                response_content = response_content.replace("'", '"')
                
                if response_content.startswith('{') and response_content.endswith('}'):
                    # 处理重复页码的问题
                    json_data = json.loads(response_content)
                    
                    # 创建新的字典，只保留每个页码的第一条记录
                    processed_data = {}
                    for page_num, content in json_data.items():
                        if page_num not in processed_data:
                            processed_data[page_num] = content
                    
                    return processed_data
                return None
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print(f"Response content: {response_content}")
                return None
        
        return None
    except Exception as e:
        print(f"Processing error: {e}")
        return None

async def perform_ocr(images: List[Image.Image], language: str):
    """并发处理多个图像"""
    try:
        # 并发执行OCR
        ocr_tasks = [process_single_image_ocr(image) for image in images]
        ocr_results = await asyncio.gather(*ocr_tasks)
        
        # 过滤掉None结果并合并所有文本
        all_texts = "\n".join([text for text in ocr_results if text])
        
        if not all_texts:
            raise HTTPException(status_code=400, detail="OCR处理失败！")
        
        # 将合并后的文本发送给GPT处理
        results = await process_images(all_texts, language)
        
        if not results:
            raise HTTPException(status_code=400, detail="目录读取失败！")
        
        return results
        
    except Exception as e:
        print(f"Error in perform_ocr: {e}")
        raise HTTPException(status_code=400, detail=str(e))

async def get_catelogue(file_path, start_page, end_page, language):
    images = await pdf_to_images(file_path, start_page, end_page)
    ocr_results = await perform_ocr(images, language)
    return ocr_results

async def save_catelogue(file_path: str, ocr_results: dict):
    """
    保存目录为JSON文件
    Args:
        file_path: PDF文件路径，例如 '/cached/user@email.com/example.pdf'
        ocr_results: OCR识别结果的字典
    """
    try:
        # 提取目录和文件名
        dir_path = f".{os.path.dirname(file_path)}"  # 获取目录路径
        file_name = os.path.splitext(os.path.basename(file_path))[0]  # 获取文件名（不含扩展名）
        
        # 确保目录存在
        os.makedirs(dir_path, exist_ok=True)
        
        # 构建JSON文件路径
        json_path = os.path.join(dir_path, f"{file_name}/", f"{file_name}.json")

        # 保存为JSON文件
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(ocr_results, f, ensure_ascii=False, indent=2)
            
        return {"status": "success", "message": "目录已保存", "path": json_path}
        
    except Exception as e:
        print(f"Error saving catalogue: {e}")
        raise HTTPException(status_code=500, detail=f"保存目录失败：{str(e)}")

async def process_pdf_pages(pdf_path: str, ocr_results: dict, user_name: str, series_name: str, content_page: int, task_id: str):
    """
    处理PDF页面并保存到数据库，按页码范围创建任务
    Args:
        pdf_path: PDF文件路径
        ocr_results: OCR识别结果
        user_name: 用户名
        series_name: 系列名称
        content_page: 正文第一页在PDF中的实际页码
        task_id: 任务ID
    """
    try:
        pdf_document = fitz.open(pdf_path)
        total_pages = len(pdf_document)

        # 将页码转换为整数并排序
        page_numbers = sorted([int(page_num.replace("页码", "")) for page_num in ocr_results.keys()])
        
        # 计算页码偏移量：content_page 是 PDF 中的实际页码，对应目录中的第1页
        offset = int(content_page) - 1
        
        # 创建任务范围，应用页码偏移
        tasks = []
        for i in range(len(page_numbers)):
            # 将目录页码转换为PDF实际页码
            start_page = int(page_numbers[i]) + offset
            
            # 如果是最后一个页码，结束页就是下一个目录页码减1
            if i < len(page_numbers) - 1:
                end_page = int(page_numbers[i + 1]) + offset - 1
            else:
                end_page = start_page  # 最后一个目录项只处理单页

            # 获取当前范围的标题（使用原始目录页码）
            current_title = ocr_results[f"{page_numbers[i]}"]
            tasks.append((start_page, end_page, current_title, page_numbers[i]))  # 保存原始页码

        # 处理每个任务范围
        total_tasks = len(tasks)
        current_task = 0

        for start_page, end_page, title, original_page in tasks:
            try:
                current_task += 1
                progress_tracker[task_id] = {
                    "current": current_task,
                    "total": total_tasks,
                    "completed": False,
                    "current_range": f"处理页码 {original_page}（PDF页 {start_page}-{end_page}）"
                }

                if start_page >= total_pages or end_page >= total_pages:
                    print(f"警告: PDF页码范围 {start_page}-{end_page} 超出PDF范围，跳过此范围")
                    continue

                # 创建新的PDF文档来存储当前页
                output_pdf = fitz.open()
                output_pdf.insert_pdf(pdf_document, from_page=start_page, to_page=start_page)
                
                # 将PDF转换为字节
                pdf_bytes = output_pdf.write()
                output_pdf.close()

                # 将PDF页面转换为图像并处理
                for page_num in range(start_page, end_page + 1):
                    images = await pdf_to_images(pdf_path, page_num, page_num)
                    if not images:
                        print(f"警告: PDF页码 {page_num} 图像转换失败，跳过此页")
                        continue

                    full_text = await process_single_image_ocr(images[0])
                    if not full_text:
                        print(f"警告: PDF页码 {page_num} OCR提取失败，跳过此页")
                        continue

                    # 生成唯一UUID和时间戳
                    document_uuid = str(uuid.uuid4())
                    current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    
                    # 保存到数据库，使用当前页的PDF内容
                    await save_document_to_db(
                        document_uuid=document_uuid,
                        user_name=user_name,
                        series_name=series_name,
                        file_name=os.path.basename(pdf_path),
                        title=title,
                        start_page=original_page,
                        end_page=original_page,
                        full_text=full_text,
                        pdf_blob=pdf_bytes,  # 使用当前页的PDF内容
                        insert_date=current_time,
                        date=current_time  # 如果需要不同的日期格式，可以在这里修改
                    )

            except Exception as e:
                print(f"处理页码范围 {start_page}-{end_page} 时出错: {e}")
                continue

        # 关闭PDF文档
        pdf_document.close()
        progress_tracker[task_id]["completed"] = True
        return {"status": "success", "message": "PDF处理完成"}

    except Exception as e:
        print(f"PDF处理错误: {e}")
        if task_id in progress_tracker:
            progress_tracker[task_id]["completed"] = True
        raise HTTPException(status_code=500, detail=str(e))