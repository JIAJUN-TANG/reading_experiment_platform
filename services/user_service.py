from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime
from models.user import (
    register_user as model_register_user, 
    validate_user as model_validate_user,
    check_access as model_check_access, 
    get_user_by_email, 
    get_all_users,
    is_valid_email
)


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
    
    # 调用模型层注册用户（模型层现在会统一角色名称）
    return model_register_user(user_data)


def login_user(
    email: str, 
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    用户验证服务
    
    Args:
        email: 用户邮箱
        ip_address: 用户IP地址（可选）
        user_agent: 用户代理信息（可选）
        
    Returns:
        Tuple[bool, Optional[str], Optional[str]]: (是否成功, 用户名或错误信息)
    """
    if not email or not email.strip():
        return False, "", "邮箱不能为空"
    
    # 调用模型层验证用户，传入IP和用户代理信息
    return model_validate_user(
        email.strip(), 
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        ip_address,
        user_agent
    )


def enhanced_login(email: str, st_session: Optional[Dict] = None) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    增强版登录函数，支持获取更多上下文信息
    
    Args:
        email: 用户邮箱
        st_session: Streamlit会话状态（可选）
        
    Returns:
        Tuple[bool, Optional[str], Optional[str]]: (是否成功, 用户名或错误信息)
    """
    try:
        # 验证邮箱格式
        if not email or not email.strip():
            return False, None, "邮箱不能为空"
        
        if not is_valid_email(email.strip()):
            return False, None, "邮箱格式不正确"
        
        # 尝试获取IP和用户代理信息
        ip_address = None
        user_agent = None
        
        if st_session and "client_info" in st_session:
            client_info = st_session["client_info"]
            ip_address = getattr(client_info, "client", None)
            user_agent = getattr(client_info, "user_agent", None)
        
        # 构建当前时间
        act_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 使用validate_user函数进行登录
        success, username, msg = model_validate_user(email.strip(), act_at, ip_address, user_agent)
        return success, username, msg
    except Exception as e:
        print(f"增强版登录失败: {str(e)}")
        return False, None, f"系统错误: {str(e)}"


def check_access(username: str, password: str) -> Tuple[bool, str]:
    """
    管理员访问权限检查
    
    Args:
        username: 用户名
        password: 密码
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    # 参数验证
    if not username or not username.strip():
        return False, "用户名不能为空"
    
    if not password or not password.strip():
        return False, "密码不能为空"
    
    # 调用模型层检查权限，使用连接池提高性能
    try:
        # 确保model_check_access返回正确格式
        result = model_check_access(username.strip(), password.strip())
        if not isinstance(result, tuple) or len(result) != 2:
            return False, "内部错误：权限检查返回格式不正确"
        return result
    except Exception as e:
        print(f"检查访问权限时发生错误: {str(e)}")
        return False, "系统错误，请稍后再试"


def get_user_info(email: str) -> Optional[Dict[str, Any]]:
    """
    获取用户详细信息
    
    Args:
        email: 用户邮箱
        
    Returns:
        Optional[Dict[str, Any]]: 用户信息字典或None
    """
    # 参数验证
    if not email or not email.strip():
        return None
    
    # 验证邮箱格式
    if not is_valid_email(email.strip()):
        print("无效的邮箱格式")
        return None
    
    # 调用模型层获取用户信息，添加错误处理
    try:
        # 确保返回值是字典类型
        user_info = get_user_by_email(email.strip())
        if user_info is not None and not isinstance(user_info, dict):
            print("获取的用户信息格式不正确")
            return None
        return user_info
    except Exception as e:
        print(f"获取用户信息时发生错误: {str(e)}")
        return None


def list_users() -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取所有用户列表
    
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: (是否成功, 用户列表, 错误信息)
    """
    # 调用模型层获取所有用户，使用连接池提高性能并添加错误处理
    try:
        return get_all_users()
    except Exception as e:
        print(f"获取用户列表时发生错误: {str(e)}")
        return False, None, "系统错误，请稍后再试"


def update_user_role(email: str, new_role: str) -> Tuple[bool, str]:
    """
    更新用户角色
    
    Args:
        email: 用户邮箱
        new_role: 新角色
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    # 参数验证
    if not email or not email.strip():
        return False, "邮箱不能为空"
    
    if not new_role or not new_role.strip():
        return False, "角色不能为空"
    
    # 验证邮箱格式
    if not is_valid_email(email.strip()):
        return False, "邮箱格式不正确"
    
    from models.db import Database, USER_ROLE
    
    # 验证角色是否有效
    valid_roles = list(USER_ROLE.values())
    if new_role not in valid_roles:
        return False, f"无效的角色，有效角色为: {', '.join(valid_roles)}"
    
    db = None
    try:
        db = Database("users")
        if not db.connect():
            return False, "数据库连接失败"
        
        # 检查用户是否存在
        db.execute("SELECT 1 FROM users WHERE email = ?", (email,))
        if not db.fetchone():
            return False, "用户不存在"
        
        # 执行更新
        result = db.execute("UPDATE users SET role = ? WHERE email = ?", (new_role, email))
        db.commit()
        
        return True, f"用户角色已更新为 {new_role}"
    except Exception as e:
        if db:
            db.rollback()
        print(f"更新用户角色时发生错误: {str(e)}")
        return False, f"更新角色失败: {str(e)}"
    finally:
        if db:
            db.close()


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