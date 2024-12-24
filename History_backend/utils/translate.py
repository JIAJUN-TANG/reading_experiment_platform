import os
from utils.request import send_request
import time
import json
import base64
from io import BytesIO
import pypdfium2
from fastapi.exceptions import HTTPException

async def open_pdf(pdf_file):
    try:
        with open(pdf_file, "rb") as f:
            file_content = f.read()
        stream = BytesIO(file_content)
        pdf_document = pypdfium2.PdfDocument(stream)
        return pdf_document
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error opening PDF: {str(e)}")

async def get_page_image(pdf_file, page_num, dpi=150):
    try:
        doc = await open_pdf(pdf_file)
        renderer = doc.render(
            pypdfium2.PdfBitmap.to_pil,
            page_indices=[page_num - 1],
            scale=dpi / 72,
        )
        # 检查 renderer 是否为空
        if not renderer:
            raise HTTPException(status_code=500, detail="Error: No pages rendered from PDF.")
        png = list(renderer)[0]
        png_image = png.convert("RGB")
        return png_image
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting page image: {str(e)}")

async def encode_image(image):
    try:
        buffer = BytesIO()
        image.save(buffer, format="PNG")
        image_bytes = buffer.getvalue()
        buffer.close()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        return image_b64
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error encoding image: {str(e)}")

async def get_user_cache_path(email: str, filename: str) -> str:
    user_cache_dir = os.path.abspath(os.path.join("./cached", email, filename))
    os.makedirs(user_cache_dir, exist_ok=True)
    return os.path.join(user_cache_dir, f"{filename}.json")

async def load_cached_results(file_path: str):
    if os.path.exists(file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}
    return {}

async def save_results_to_cache(file_path: str, page: int, ocr_text: str, translated_text: str):
    try:
        results = await load_cached_results(file_path)        
        results[str(page)] = {"ocr_text": ocr_text, "translated_text": translated_text}
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=4)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save results to cache: {str(e)}")
    
async def retry_request(headers, payload, max_retries=5, delay=2):
    for attempt in range(max_retries):
        response = send_request(headers, payload)
        if response:
            return response
        if attempt < max_retries - 1:
            time.sleep(delay)
    return None

async def translate_text(file_path, email, page, language, service):
    filename = os.path.splitext(os.path.basename(file_path))[0]
    cache_path = await get_user_cache_path(email, filename)
    cached_results = await load_cached_results(cache_path)
    if str(page) in cached_results:
        return cached_results[str(page)]
    else:
        image = await get_page_image(file_path, page)
        encoded_image = await encode_image(image)
        if service == "ChatGPT":
            model = "gpt-4o-mini"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer sk-SkV6Leve2mXaej9lNP6VMuhugmbC2B6J6x8ASVQutg50hQt1"
        }
        
        ocr_payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "你是一位历史研究的专家，精通多种语言，因此你很熟悉档案识别。"},
                {"role": "user", "content": [{"type": "text", "text": f"图中文本为{language}。请你识别图中文本并返回，除了识别结果外不要增加其他任何文本。"}]},
                {"role": "user", "content": [{"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"}}]}
            ],
            "top_p": 1,
            "temperature": 0,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }
        
        ocr_response = await retry_request(headers, ocr_payload)
        if not ocr_response:
            raise HTTPException(status_code=500, detail="OCR识别失败，未能提取文本。")

        ocr_choices = ocr_response.choices
        if not ocr_choices:
            raise HTTPException(status_code=500, detail="OCR识别失败，未能提取文本。")

        ocr_text = ocr_choices[0].message.content.replace("`", "")
        if not ocr_text:
            raise HTTPException(status_code=500, detail="OCR识别失败，未能提取文本。")

        translation_payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "你是一位历史研究的专家，精通多种语言，因此你很熟悉档案翻译。除了翻译结果外不要增加其他任何文本。"},
                {"role": "user", "content": [{"type": "text", "text": f"文本的语言为{language}。请你翻译文本为中文，文本为{ocr_text}"}]}
            ],
            "top_p": 1,
            "temperature": 0,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }

        translation_response = await retry_request(headers, translation_payload)
        if not translation_response:
            raise HTTPException(status_code=500, detail="翻译失败，未能生成翻译文本。")

        translation_choices = translation_response.choices
        if not translation_choices:
            raise HTTPException(status_code=500, detail="翻译失败，未能生成翻译文本。")

        translated_text = translation_choices[0].message.content.replace("`", "")
        if not translated_text:
            raise HTTPException(status_code=500, detail="翻译失败，未能生成翻译文本。")

        await save_results_to_cache(cache_path, page, ocr_text, translated_text)

        return {"ocr_text": ocr_text, "translated_text": translated_text}