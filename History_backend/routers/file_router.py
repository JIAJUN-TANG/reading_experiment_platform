import os
from fastapi import APIRouter, HTTPException, UploadFile, Form, File, BackgroundTasks, WebSocket
from schemas import FileRequest, GetCatalogueRequest, OCRResults, ProcessPdfPagesRequest
from utils.database import get_file, get_full_text
from utils.file_processing import get_file_list, upload_file, get_catelogue, save_catelogue, process_pdf_pages
from fastapi.responses import StreamingResponse, JSONResponse
from io import BytesIO
import json
import uuid
import asyncio


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
    
@file_router.websocket("/ws/progress/{task_id}")
async def progress_websocket(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        while True:
            if task_id in progress_tracker:
                progress = progress_tracker[task_id]
                await websocket.send_json(progress)
                if progress["completed"]:
                    del progress_tracker[task_id]
                    break
            await asyncio.sleep(0.5)
    except WebSocketDisconnect:
        if task_id in progress_tracker:
            del progress_tracker[task_id]

@file_router.post("/ProcessPdfPages/")
async def process_pdf_pages_endpoint(data: ProcessPdfPagesRequest, background_tasks: BackgroundTasks):
    """
    处理PDF页面的端点
    Args:
        data: 包含处理所需信息的请求对象
        background_tasks: 后台任务对象
    """
    try:
        # 1. 构建文件路径
        file_name = os.path.splitext(os.path.basename(data.file_path))[0]
        parent_dir = os.path.dirname(data.file_path).lstrip("/")
        target_directory = os.path.join(parent_dir, file_name)
        
        # 2. 确保目录存在
        os.makedirs(target_directory, exist_ok=True)
        
        # 3. 构建JSON文件路径
        json_file_path = os.path.join(target_directory, f"{file_name}.json")

        # 4. 验证OCR结果文件是否存在
        if not os.path.exists(json_file_path):
            raise HTTPException(
                status_code=404, 
                detail=f"OCR结果文件未找到: {json_file_path}"
            )

        # 5. 读取OCR结果
        try:
            with open(json_file_path, "r", encoding="utf-8") as f:
                ocr_results = json.load(f)
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=400, 
                detail=f"OCR结果文件格式错误: {str(e)}"
            )

        # 生成任务ID
        task_id = str(uuid.uuid4())
        progress_tracker[task_id] = {
            "current": 0,
            "total": len(ocr_results),
            "completed": False
        }

        # 添加后台任务
        background_tasks.add_task(
            process_pdf_pages,
            os.path.join(".", data.file_path.lstrip("/")),
            ocr_results,
            data.user_name,
            data.series_name,
            data.content_page,
            task_id  # 传递任务ID
        )

        return {
            "status": "success",
            "message": "文献处理任务已启动",
            "task_id": task_id,  # 返回任务ID
            "details": {
                "file_name": file_name,
                "target_directory": target_directory,
                "total_entries": len(ocr_results)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"处理请求时出错: {str(e)}"
        )