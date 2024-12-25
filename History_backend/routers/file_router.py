import os
from fastapi import APIRouter, HTTPException, UploadFile, Form, File
from schemas import FileRequest, GetCatalogueRequest, OCRResults, ProcessPdfPagesRequest
from utils.database import get_file, get_full_text
from utils.file_processing import get_file_list, upload_file, get_catelogue, save_catelogue, process_pdf_pages
from fastapi.responses import StreamingResponse, JSONResponse
from io import BytesIO


file_router = APIRouter()

# 假设文件存储在 cached 目录下
CACHE_DIR = "cached"

@file_router.post("/UpLoad/")
async def upload_file_endpoint(email: str = Form(...), file: UploadFile = File(...)):
    return await upload_file(email, file)

@file_router.get("/GetFileList/")
async def get_file_list_endpoint(email: str):
    try:
        result = await get_file_list(email)
        # 返回文件列表
        return result
    except Exception as e:
        # 捕获所有异常并返回错误信息
        raise HTTPException(status_code=500, detail=str(e))

@file_router.post("/GetFile/")
async def get_file_endpoint(request: FileRequest):
    try:
        uuid = request.uuid
        result = get_file(uuid)
        if result:
            title, series_name, file = result

            if not title:
                title = series_name

            if file:
                file_stream = BytesIO(file)
                return StreamingResponse(file_stream, media_type="application/pdf")
            else:
                # 返回一个空的PDF流
                empty_stream = BytesIO()
                return StreamingResponse(empty_stream, media_type="application/pdf")
        else:
            # 返回一个空的PDF流
            empty_stream = BytesIO()
            return StreamingResponse(empty_stream, media_type="application/pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{str(e)}")

@file_router.post("/GetFullText/")
async def get_full_text_endpoint(request: FileRequest):
    try:
        uuid = request.uuid
        result = get_full_text(uuid)
        if result:
            user_name, series_name, file_name, title, start_page, end_page, full_text = result
            return JSONResponse(content={
                "user_name": user_name,
                "series_name": series_name,
                "file_name": file_name,
                "title": title,
                "start_page": start_page,
                "end_page": end_page,
                "full_text": full_text
            })
        else:
            return JSONResponse(content={"error": "Full text not found"}, status_code=404)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{str(e)}")

@file_router.post("/GetCatelogue/")
async def get_catalogue_endpoint(request: GetCatalogueRequest):
    try:
        file_path = f".{request.file_path}"
        result = await get_catelogue(file_path, request.start_page, request.end_page, request.language)
        return {"ocr_results": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{str(e)}")
    
@file_router.post("/SaveCatelogue/")
async def save_catelogue_endpoint(request: OCRResults):
    try:
        result = await save_catelogue(request.file_path, request.ocr_results)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{str(e)}")
    
@file_router.post("/ProcessPdfPages/")
async def process_pdf_pages_endpoint(data: ProcessPdfPagesRequest, background_tasks: BackgroundTasks):
    try:
        file_name = os.path.splitext(os.path.basename(data.file_path))[0]
        parent_dir = os.path.dirname(data.file_path).lstrip("/")
        target_directory = os.path.join(parent_dir, file_name)
        os.makedirs(target_directory, exist_ok=True)
        json_file_path = os.path.join(target_directory, f"{file_name}_ocr_results.json")

        if not os.path.exists(json_file_path):
            raise HTTPException(status_code=404, detail=f"OCR 结果文件未找到: {json_file_path}")

        with open(json_file_path, "r", encoding="utf-8") as f:
            ocr_results = json.load(f)

        background_tasks.add_task(process_pdf_pages, os.path.join(".", data.file_path.lstrip("/")), ocr_results, data.user_name, data.series_name, data.content_page, data.language)

        return {"message": "文献写入已启动！"}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})