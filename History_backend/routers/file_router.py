import os
from fastapi import APIRouter, HTTPException, UploadFile, Form, File
from schemas import FileRequest
from utils.database import get_file, get_full_text
from utils.file_processing import get_file_list, upload_file
from fastapi.responses import StreamingResponse, JSONResponse
from urllib.parse import quote
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
