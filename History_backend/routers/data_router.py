from fastapi import APIRouter, HTTPException, BackgroundTasks, Body
from fastapi.responses import JSONResponse
from schemas import GetCatalogueRequest, OCRResults, ProcessPdfPagesRequest, ProcessTextRequest, SearchDataRequest
from utils.file_processing import perform_ocr, pdf_to_images, save_document_to_db, process_pdf_pages
from utils.database import get_latest, get_count, search_data, get_usage_statistics
import os
import uuid

data_router = APIRouter()

@data_router.get("/GetLatest/")
async def get_latest_endpoint():
    try:
        result = get_latest()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"加载失败：{str(e)}")
    
@data_router.get("/GetCount/")
async def get_count_endpoint():
    try:
        result = get_count()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"加载失败：{str(e)}")

@data_router.post("/Searchdata/")
async def search_data_endpoint(data: SearchDataRequest = Body(...)):
    try:
        result = search_data(data.search_string)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"检索失败：{str(e)}")

@data_router.post("/GetCatelogue/")
async def get_catelogue(request: GetCatalogueRequest = Body(...)):
    file_path = os.path.join(".", request.file_path.lstrip("/"))   
    if request.language == "中文" or request.language == "英文": 
        images, images_list = await pdf_to_images(file_path, request.start_page, request.end_page)
        ocr_texts = await perform_ocr(images_list, request.language)
        return {"ocr_results": ocr_texts}
    else:
        raise HTTPException(status_code=401, detail="目录读取失败！")

@data_router.post("/SaveCatelogue/")
async def save_catelogue(request: OCRResults = Body(...)):
    try:
        file_name = os.path.splitext(os.path.basename(request.file_path))[0]
        parent_dir = os.path.dirname(request.file_path).lstrip("/")
        target_directory = os.path.join(parent_dir, file_name)
        os.makedirs(target_directory, exist_ok=True)
        json_file_path = os.path.join(target_directory, f"{file_name}_ocr_results.json")

        with open(json_file_path, "w", encoding="utf-8") as f:
            json.dump(request.ocr_results, f, ensure_ascii=False, indent=4)

        return {"message": "保存成功！", "file_name": json_file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"保存失败：{str(e)}")

@data_router.post("/ProcessPdfPages/")
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

@data_router.get("/GetUsage/")
async def get_usage_endpoint():
    """获取用户使用统计数据的端点"""
    try:
        result = get_usage_statistics()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取使用统计失败：{str(e)}")