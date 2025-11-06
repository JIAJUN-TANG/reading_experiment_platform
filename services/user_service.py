from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime
from models.user import register_user as model_register_user, validate_user as model_validate_user
from models.user import check_access as model_check_access, get_user_by_email, get_all_users
from models.data import record_behavior


def register_user(user_data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    用户注册服务
    
    Args:
        user_data: 用户数据字典
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    # 验证必要字段
    required_fields = ["email", "username", "sex", "age", "degree", "job", "experiment_name"]
    for field in required_fields:
        if field not in user_data or not user_data[field]:
            return False, f"{field}不能为空"
    
    # 添加时间戳
    if "created_at" not in user_data:
        user_data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # 添加默认角色
    if "role" not in user_data:
        user_data["role"] = "参与者"
    
    # 调用模型层注册用户
    return model_register_user(user_data)


def login_user(email: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    用户验证服务
    
    Args:
        email: 用户邮箱
        
    Returns:
        Tuple[bool, Optional[str]]: (是否成功, 用户名或错误信息)
    """
    if not email or not email.strip():
        return False, "", "邮箱不能为空"
    
    # 调用模型层验证用户
    return model_validate_user(email.strip(), datetime.now().strftime("%Y-%m-%d %H:%M:%S"))


def check_access(username: str, password: str) -> Tuple[bool, str]:
    """
    管理员访问权限检查
    
    Args:
        username: 用户名
        password: 密码
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    if not username or not username.strip():
        return False, "用户名不能为空"
    
    if not password or not password.strip():
        return False, "密码不能为空"
    
    # 调用模型层检查权限
    return model_check_access(username.strip(), password.strip())


def get_user_info(email: str) -> Optional[Dict[str, Any]]:
    """
    获取用户详细信息
    
    Args:
        email: 用户邮箱
        
    Returns:
        Optional[Dict[str, Any]]: 用户信息字典或None
    """
    if not email or not email.strip():
        return None
    
    return get_user_by_email(email.strip())


def list_users() -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取所有用户列表
    
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: (是否成功, 用户列表, 错误信息)
    """
    return get_all_users()


def logout_user() -> Dict[str, Any]:
    """
    用户登出服务
    
    Returns:
        Dict[str, Any]: 登出结果
    """
    return {
        "success": True,
        "message": "已成功登出"
    }


def is_valid_email(email: str) -> bool:
    """
    验证邮箱格式是否正确
    
    Args:
        email: 邮箱地址
        
    Returns:
        bool: 是否有效
    """
    import re
    email_pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return re.match(email_pattern, email) is not None