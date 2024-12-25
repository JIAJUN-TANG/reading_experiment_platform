from fastapi import APIRouter, HTTPException, BackgroundTasks, Body
from fastapi.responses import JSONResponse
from schemas import SearchDataRequest
from utils.database import get_latest, get_count, search_data, get_usage_statistics

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

@data_router.get("/GetUsage/")
async def get_usage_endpoint():
    """获取用户使用统计数据的端点"""
    try:
        result = get_usage_statistics()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取使用统计失败：{str(e)}")