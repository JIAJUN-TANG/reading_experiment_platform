import os
import uuid
from fastapi import UploadFile, HTTPException
from PIL import Image
from io import BytesIO
import fitz
from utils.database import save_document_to_db
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

async def pdf_to_images(pdf_path: str, page_num: str):
    doc = fitz.open(pdf_path)
    output_dir = "./images"
    os.makedirs(output_dir, exist_ok=True)
    
    page = doc.load_page(page_num-1)
    pix = page.get_pixmap(dpi=500)
    img = Image.open(BytesIO(pix.tobytes("png")))
    image_path = os.path.join(output_dir, f"{os.path.splitext(os.path.basename(pdf_path))[0]}_{page_num + 1}.png")
    img.save(image_path, format="PNG")

    doc.close()
    return img

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

async def perform_ocr(image, language):
    """并发处理多个图像"""
    try:
        # 并发执行OCR
        ocr_results = await process_single_image_ocr(image)
        
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
    ocr_results = {}
    for page_num in range(start_page, end_page):
        image = await pdf_to_images(file_path, page_num)
        result = await perform_ocr(image, language)
        ocr_results.update(result)
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

async def process_pdf_pages(file_path: str, ocr_results: dict, user_name: str, series_name: str, content_page: int):
    doc = fitz.open(file_path)
    
    sorted_ocr_results = sorted(ocr_results.items(), key=lambda x: int(x[0].replace("页码", "")))
    ocr_first_page = int(sorted_ocr_results[0][0].replace("页码", ""))
    page_offset = int(content_page) - ocr_first_page

    for i in range(len(sorted_ocr_results)):
        page_key, title = sorted_ocr_results[i]
        start_page = int(page_key.replace("页码", ""))
        pdf_start_page = start_page + page_offset
        
        end_page = int(sorted_ocr_results[i + 1][0].replace("页码", "")) - 1 if i + 1 < len(sorted_ocr_results) else len(doc)-page_offset
        pdf_end_page = end_page + page_offset

        split_pdf = fitz.open()
        split_pdf.insert_pdf(doc, from_page=pdf_start_page-1, to_page=pdf_end_page-1)

        split_pdf_path = f"{uuid.uuid4()}.pdf"
        split_pdf.save(split_pdf_path)
        with open(split_pdf_path, "rb") as f:
            pdf_blob = f.read()

        full_text = ""
        for page_num in range(pdf_start_page, pdf_end_page):
            image = await pdf_to_images(file_path, page_num)
            text = await process_single_image_ocr(image)
            full_text += f"<SEP>{text}<SEP>"
        document_uuid = str(uuid.uuid4())
        insert_date = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        await save_document_to_db(document_uuid, user_name, series_name, os.path.splitext(os.path.basename(file_path))[0], title, pdf_start_page-page_offset, pdf_end_page-page_offset, full_text, pdf_blob, insert_date, "")

        os.remove(split_pdf_path)
        split_pdf.close()

    doc.close()

async def process_all_pdf_pages(file_path: str, user_name: str, series_name: str, content_page: int):
    pass