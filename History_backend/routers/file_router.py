import os
from fastapi import APIRouter, HTTPException, UploadFile, Form, File
from schemas import FileRequest, GetCatalogueRequest, OCRResults, ProcessPdfPagesRequest
from utils.database import get_file, get_full_text
from utils.file_processing import get_file_list, upload_file, get_catelogue, save_catelogue, process_pdf_pages, process_all_pdf_pages
from fastapi.responses import StreamingResponse, JSONResponse
from io import BytesIO
import json
from concurrent.futures import ThreadPoolExecutor
import asyncio
import multiprocessing


file_router = APIRouter()

# 假设文件存储在 cached 目录下
CACHE_DIR = "cached"

# 创建一个全局字典来存储每个任务的进度
progress_tracker = {}

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
async def process_pdf_pages_endpoint(data: ProcessPdfPagesRequest):
    """处理PDF页面的端点"""
    try:
        # 获取CPU核心数，设置线程数
        num_threads = multiprocessing.cpu_count() * 2
        file_path = os.path.join(".", data.file_path.lstrip("/"))
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404, 
                detail=f"文件未找到: {file_path}"
            )
            
        json_file_path = os.path.join(os.path.dirname(file_path), f"{os.path.splitext(os.path.basename(file_path))[0]}", f"{os.path.splitext(os.path.basename(file_path))[0]}.json")
        
        if not os.path.exists(json_file_path):
            raise HTTPException(
                status_code=404, 
                detail=f"OCR结果文件未找到: {json_file_path}"
            )

        with open(json_file_path, "r", encoding="utf-8") as f:
            ocr_results = json.load(f)

        # 创建线程池
        with ThreadPoolExecutor(max_workers=num_threads) as executor:
            # 将异步函数转换为同步函数
            def sync_process_pdf_pages(*args, **kwargs):
                return asyncio.run(process_pdf_pages(*args, **kwargs))

            # 在线程池中执行同步函数
            future = executor.submit(
                sync_process_pdf_pages,
                file_path,
                ocr_results,
                data.user_name,
                data.series_name,
                data.content_page
            )
            
            # 等待结果
            result = future.result()

        return {"status": "success", "message": "处理完成"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@file_router.post("/ProcessAllPdfPages/")
async def process_all_pdf_pages_endpoint(data: ProcessPdfPagesRequest):
    try:
        result = await process_all_pdf_pages(data.file_path, data.user_name, data.series_name, data.content_page)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))