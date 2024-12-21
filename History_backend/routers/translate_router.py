import os
from fastapi import APIRouter, HTTPException
from schemas import TranslationRequest
from utils.translate import translate_text


translate_router = APIRouter()

@translate_router.post("/GetTranslation")
async def translate_text_endpoint(data: TranslationRequest):
    try:
        file_path = os.path.join(".", data.file_path.lstrip("/"))
        email = data.email
        page = data.page
        language = data.language
        service = data.service

        result = await translate_text(file_path, email, page, language, service)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")