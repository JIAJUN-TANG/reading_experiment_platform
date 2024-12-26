from pydantic import BaseModel


# 数据模型
class UserLogin(BaseModel):
    email: str
    password: str
    ip_address: str

class UserCreate(BaseModel):
    email: str
    user_name: str
    affiliation: str
    invitation: str
    password: str

class GetCatalogueRequest(BaseModel):
    file_path: str
    start_page: int
    end_page: int
    language: str

class OCRResults(BaseModel):
    ocr_results: dict
    file_path: str

# 切分目录和写入数据库的请求体
class ProcessPdfPagesRequest(BaseModel):
    file_path: str
    user_name: str
    series_name: str
    content_page: str

class SearchDataRequest(BaseModel):
    search_string: str

class FileRequest(BaseModel):
    uuid: str  # 接收 uuid 字段

class TranslationRequest(BaseModel):
    file_path: str
    email: str
    page: int
    service: str
    language:str
    
class ChatRequest(BaseModel):
    user_message: str
    assistant_message: str