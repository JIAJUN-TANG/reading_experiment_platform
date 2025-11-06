from typing import Optional
from pydantic import BaseModel


class EmailConfig(BaseModel):
    """邮件配置模型"""
    smtp: dict
    account: dict
    admin: dict
    register_template: dict
    delete_template: dict
    invite_template: dict


class EmailRequest(BaseModel):
    """邮件发送请求模型"""
    username: Optional[str] = None
    receiver_email: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    template: Optional[str] = None
    experiment_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None


class EmailResponse(BaseModel):
    """邮件发送响应模型"""
    success: bool
    message: str
    error: Optional[str] = None