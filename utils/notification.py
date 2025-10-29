import smtplib
import yaml
from pathlib import Path
from email.mime.text import MIMEText
from email.header import Header
from typing import Optional
from datetime import datetime
import streamlit as st


def load_email_config(config_path: str = "./data/email_config.yaml") -> dict:
    """加载YAML配置（包含邮件模板）"""
    config_file = Path(config_path)
    
    if not config_file.exists():
        raise FileNotFoundError(f"配置文件不存在：{config_file.resolve()}")
    
    with open(config_file, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    
    # 验证必要配置（包括新增的邮件模板）
    required_sections = ["smtp", "account", "admin", "register_template", "delete_template"]
    for section in required_sections:
        if section not in config:
            raise ValueError(f"配置文件缺少必要节点：{section}")
    
    required_template_keys = ["subject", "content"]
    for key in required_template_keys:
        if key not in config["register_template"]:
            raise ValueError(f"邮件模板缺少必要项：{key}")
    
    return config

def send_163_email(
    username: str,
    receiver_email: Optional[str] = None,
    subject: Optional[str] = None,
    content: Optional[str] = None,
    template: Optional[str] = None,
    experiment_name: Optional[str] = None
):
    """发送邮件：支持模板指定，自定义内容优先于模板"""
    try:
        config = load_email_config()  # 假设该函数加载邮件配置（包含多个模板）
        
        # 提取基础配置
        smtp_server = config["smtp"]["server"]
        smtp_port = config["smtp"]["port"]
        sender = config["account"]["sender"]
        auth_code = config["account"]["auth_code"]
        admin_email = config["admin"]["email"]
        template = config[template]
        
        # 确定收件人（默认发给管理员）
        receiver = receiver_email or admin_email
        
        if subject is not None and content is not None:
            # 完全使用自定义内容
            email_subject = subject
            email_content = content
        else:
            # 检查模板是否存在
            if not template:
                raise ValueError(f"模板不存在：{template}")
            
            # 填充主题
            email_subject = subject or template["subject"].format(experimentname=experiment_name) if template == "experiment_delete_template" else template["subject"].format(username=username)
            # 填充正文
            email_content = content or template["content"].format(username=username, time=datetime.now().strftime("%Y年%m月%d日")) if template == "invite_template" else template["content"].format(username=username, time=datetime.now().strftime("%Y年%m月%d日"))

        # 构建邮件
        message = MIMEText(email_content, "plain", "utf-8")
        message["From"] = Header(f"系统通知 <{sender}>", "utf-8")
        message["To"] = Header(receiver, "utf-8")
        message["Subject"] = Header(email_subject, "utf-8")
        
        # 发送邮件
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender, auth_code)
            server.sendmail(sender, receiver.split(","), message.as_string())
        
        return None

    except Exception as e:
        return e  # 失败返回异常对象