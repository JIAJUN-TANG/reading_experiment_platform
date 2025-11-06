import smtplib
import yaml
from pathlib import Path
from email.mime.text import MIMEText
from email.header import Header
from typing import Optional
from datetime import datetime

from config.settings import settings
from schemas.email import EmailConfig, EmailRequest, EmailResponse


def load_email_config(config_path: str = "./data/email_config.yaml") -> EmailConfig:
    """加载邮件配置"""
    if config_path is None:
        config_path = settings.EMAIL_CONFIG_PATH
    
    config_file = Path(config_path)
    
    if not config_file.exists():
        raise FileNotFoundError(f"配置文件不存在：{config_file.resolve()}")
    
    with open(config_file, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    
    # 验证必要配置
    required_sections = ["smtp", "account", "admin", "register_template", "delete_template", "invite_template"]
    for section in required_sections:
        if section not in config:
            raise ValueError(f"配置文件缺少必要节点：{section}")
    
    required_template_keys = ["subject", "content"]
    for key in required_template_keys:
        if key not in config["register_template"]:
            raise ValueError(f"邮件模板缺少必要项：{key}")
    
    return EmailConfig(**config)


def send_163_email(request: EmailRequest) -> EmailResponse:
    """发送邮件服务"""
    try:
        config = load_email_config()
        
        # 提取基础配置
        smtp_server = config.smtp["server"]
        smtp_port = config.smtp["port"]
        sender = config.account["sender"]
        auth_code = config.account["auth_code"]
        admin_email = config.admin["email"]
        
        # 获取模板
        template = getattr(config, f"{request.template}", None)
        if request.template and not template:
            return EmailResponse(
                success=False,
                message="发送失败",
                error=f"模板不存在：{request.template}"
            )
        
        # 确定收件人
        receiver = request.receiver_email or admin_email
        
        if request.subject is not None and request.content is not None:
            # 完全使用自定义内容
            email_subject = request.subject
            email_content = request.content
        else:
            # 使用模板
            if not template:
                return EmailResponse(
                    success=False,
                    message="发送失败",
                    error="未提供模板或自定义内容"
                )
            
            # 填充主题
            try:
                if request.template == "delete_template" and request.experiment_name:
                    email_subject = template["subject"].format(experimentname=request.experiment_name)
                else:
                    email_subject = template["subject"].format(username=request.username)
            except (KeyError, AttributeError):
                email_subject = template.get("subject", "")
            
            # 填充正文
            current_time = datetime.now().strftime("%Y年%m月%d日")
            try:
                if request.template == "invite_template":
                    # 为邀请模板提供所有必要的参数
                    template_data = {
                        "username": request.username,
                        "experimentname": request.experiment_name or "",
                        "start_date": request.start_date or "",
                        "end_date": request.end_date or "",
                        "time": current_time
                    }
                    email_content = template["content"].format(**template_data)
                else:
                    email_content = template["content"].format(username=request.username, time=current_time)
            except (KeyError, AttributeError):
                email_content = template.get("content", "")
        
        # 构建邮件
        message = MIMEText(email_content, "plain", "utf-8")
        message["From"] = f"系统通知 <{sender}>"
        message["To"] = receiver
        message["Subject"] = email_subject
        
        # 发送邮件
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(sender, auth_code)
            server.sendmail(sender, receiver.split(","), message.as_string())
        
        return EmailResponse(
            success=True,
            message="邮件发送成功"
        )

    except Exception as e:
        return EmailResponse(
            success=False,
            message="邮件发送失败",
            error=str(e)
        )


def send_registration_email(username: str, receiver_email: Optional[str] = None) -> EmailResponse:
    """发送注册成功邮件"""
    request = EmailRequest(
        username=username,
        receiver_email=receiver_email,
        template="register_template"
    )
    return send_163_email(request)


def send_experiment_deletion_email(username: str, experiment_name: str, receiver_email: Optional[str] = None) -> EmailResponse:
    """发送实验删除邮件通知"""
    request = EmailRequest(
        username=username,
        receiver_email=receiver_email,
        template="delete_template",
        experiment_name=experiment_name
    )
    return send_163_email(request)


def send_invitation_email(username: str, experiment_name: str, receiver_email: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None) -> EmailResponse:
    """发送邀请受试者参与实验的邮件，使用配置中的invite_template模板"""
    request = EmailRequest(
        username=username,
        receiver_email=receiver_email,
        template="invite_template",
        experiment_name=experiment_name,
        start_date=start_date,
        end_date=end_date
    )
    return send_163_email(request)