import os
import uuid
from fastapi import UploadFile, HTTPException
from modelscope import AutoModel, AutoTokenizer
from PIL import Image
from io import BytesIO
import fitz
from surya.ocr import run_ocr
from surya.model.detection.model import load_model as load_det_model, load_processor as load_det_processor
from surya.model.recognition.model import load_model as load_rec_model
from surya.model.recognition.processor import load_processor as load_rec_processor
from utils.database import get_db_connection
from typing import List, Dict
import time
import json
from utils.request import send_request

det_processor, det_model = load_det_processor(), load_det_model()
rec_model, rec_processor = load_rec_model(), load_rec_processor()

tokenizer = AutoTokenizer.from_pretrained("/home/jiajun/公共/jiajun/History_backend/GOT", trust_remote_code=True)
model = AutoModel.from_pretrained(
    "/home/jiajun/公共/jiajun/History_backend/GOT",
    trust_remote_code=True,
    low_cpu_mem_usage=True,
    device_map="cuda",
    use_safetensors=True,
    eos_token_id=tokenizer.eos_token_id,
).eval().cuda()

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
    images_list = []
    output_dir = "./images"
    os.makedirs(output_dir, exist_ok=True)
    
    for page_num in range(start_page - 1, end_page):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(dpi=500)
        img = Image.open(BytesIO(pix.tobytes("png")))
        image_path = os.path.join(output_dir, f"{os.path.splitext(os.path.basename(pdf_path))[0]}_{page_num + 1}.png")
        img.save(image_path, format="PNG")
        images.append(img)
        images_list.append(image_path)
    
    doc.close()
    return images, images_list

async def perform_ocr(images: List[Image.Image], language: str) -> List[str]:
    results = {}
    for image in images:
        res = model.chat(tokenizer, image, ocr_type="ocr")
        headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer sk-SkV6Leve2mXaej9lNP6VMuhugmbC2B6J6x8ASVQutg50hQt1"
    }
        payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": f"你是一位历史研究的专家，精通{language}，并且熟悉目录整理。"
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "格式要求：1.除了给定文本，请不要增加其他内容。2.以及目录和子目录（如附）都应当作为一条记录返回，并使用目录页码。3.目录应当尽可能完整，包含：前后的所有文本，并删除目录前的序号数字，但忽略目录中的人名，如朱德、张闻天等。4.部分目录的时间在页码之后，请你将其放置于标题后，并且不要将汉字数字改为阿拉伯数字。5.请返回dict格式，例如{'页码':'目录文本', '页码':'目录文本'...}。6.请删除内容中的\n和空格。"
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"请你精确识别目录内容，并按照格式要求返回结果：{res}"
                    }
                ]
            }
        ],
        "top_p": 1,
        "temperature": 0,
        "frequency_penalty": 0,
        "presence_penalty": 0
    }
        response = send_request(headers, payload)
        if not response or response.status_code != 200:
            time.sleep(2)  # 等待 2 秒后重试
            response = send_request(headers, payload)
        try:
            response_content = response.json().get("choices", [])[0].get("message", {}).get("content", "").replace("json", "").replace("python", "").replace("'", '"')
            result = json.loads(response_content)  # 返回字典
            results.update(result)
        except ValueError as e:
            raise HTTPException(status_code=400, detail="目录读取失败！")
    return results

async def ocr_process(images: List[str], langs:str) -> str:
    full_text = ""
    for image in images:
        predictions = run_ocr([image], [[langs]], det_model, det_processor, rec_model, rec_processor)
        for text_line in predictions[0].text_lines:
            full_text += text_line.text + "\n"
    return full_text

async def save_document_to_db(pdf_path: str, user_name: str, series_name: str, title: str, start_page: int, end_page: int, full_text: str, pdf_blob: bytes, date: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    document_uuid = str(uuid.uuid4())
    cursor.execute('''INSERT INTO documents (
                        uuid, user_name, series_name, file_name, title, 
                        start_page, end_page, full_text, file, date) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                   (document_uuid, user_name, series_name, os.path.basename(pdf_path), 
                    title, start_page, end_page, full_text, pdf_blob, date))
    conn.commit()
    conn.close()

async def process_pdf_pages(pdf_path: str, ocr_results: Dict, user_name: str, series_name: str, content_page: str, language: str):
    doc = fitz.open(pdf_path)
    
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

        images, images_list = await pdf_to_images(pdf_path, pdf_start_page, pdf_end_page)
        full_text = await ocr_process(images, language)

        await save_document_to_db(pdf_path, user_name, series_name, title, pdf_start_page-page_offset, pdf_end_page-page_offset, full_text, pdf_blob, "")

        os.remove(split_pdf_path)
        split_pdf.close()

    doc.close()