import re
import sqlite3
from typing import Optional, Tuple, Dict, Any, List
from pathlib import Path
import yaml
import hashlib
from .db import Database, USER_ROLE
from .data import record_behavior


# 邮箱验证正则表达式
EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'


def is_valid_email(email: str) -> bool:
    """
    验证邮箱格式是否正确
    
    Args:
        email: 邮箱地址
        
    Returns:
        bool: 邮箱格式是否正确
    """
    return bool(re.match(EMAIL_PATTERN, email))


def hash_password(password: str) -> str:
    """
    对密码进行哈希处理
    
    Args:
        password: 原始密码
        
    Returns:
        str: 哈希后的密码
    """
    return hashlib.sha256(password.encode()).hexdigest()


def register_user(user_data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    注册新参与者信息，存入数据库
    
    Args:
        user_data: 用户数据字典
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    # 参数验证
    required_fields = ["email", "username", "sex", "age", "degree", "job", "experiment_name"]
    for field in required_fields:
        if field not in user_data or not user_data[field]:
            return False, f"{field}不能为空"
    
    # 验证邮箱格式
    email = user_data["email"].strip()
    if not is_valid_email(email):
        return False, "邮箱格式不正确"
    
    # 验证年龄
    try:
        age = int(user_data["age"])
        if age <= 0 or age >= 150:
            return False, "年龄必须在1-149之间"
    except ValueError:
        return False, "年龄必须是数字"
    
    # 统一角色名称
    user_data["role"] = USER_ROLE["PARTICIPANT"]
    
    db = Database("users")
    if not db.connect():
        return False, "数据库连接失败"
    
    try:
        # 检查邮箱是否已存在
        db.execute("SELECT email FROM users WHERE email = ?", (email,))
        if db.fetchone():
            return False, "邮箱已存在，请更换"
        
        # 插入新用户
        db.execute(
            """
            INSERT INTO users (email, username, sex, age, degree, job, created_at, 
                              role, user_group, experiment_name) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                email, user_data["username"].strip(), user_data["sex"], 
                age, user_data["degree"], user_data["job"], user_data["created_at"], 
                user_data["role"], 0, user_data["experiment_name"].strip()
            )
        )
        db.commit()
        
        # 记录注册行为
        record_behavior(email, "register", user_data["created_at"], None)
        
        return True, "信息录入成功！"
    except sqlite3.Error as e:
        db.rollback()
        # 避免泄露敏感的错误信息
        return False, "信息录入失败，请稍后重试"
    except Exception as e:
        db.rollback()
        print(f"注册用户时发生错误: {str(e)}")
        return False, "信息录入失败，请稍后重试"
    finally:
        db.close()


def login_user(email: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Tuple[bool, str, str]:
    """
    用户登录函数
    
    Args:
        email: 用户邮箱
        ip_address: 用户IP地址
        user_agent: 用户代理信息
    
    Returns:
        Tuple[bool, str, str]: (是否成功, 用户名, 错误信息)
    """
    try:
        db = Database("users")
        if not db.connect():
            return False, "", "数据库连接失败"
        
        # 查询用户是否存在
        query = "SELECT username FROM users WHERE email = ?"
        if not db.execute(query, (email,)):
            return False, "", "查询用户信息失败"
        
        result = db.fetchone()
        if result:
            username = result["username"] if isinstance(result, dict) else result[0]
            return True, username, ""
        else:
            # 用户不存在，创建新用户
            username = email.split('@')[0]
            # 检查用户名是否已存在
            check_query = "SELECT id FROM users WHERE username = ?"
            db.execute(check_query, (username,))
            existing = db.fetchone()
            
            if existing:
                # 用户名已存在，添加数字后缀
                count = 1
                while True:
                    new_username = f"{username}{count}"
                    db.execute(check_query, (new_username,))
                    if not db.fetchone():
                        username = new_username
                        break
                    count += 1
            
            # 创建新用户
            insert_query = """
            INSERT INTO users (username, email, created_at, role, user_group)
            VALUES (?, ?, datetime('now', 'localtime'), ?, ?)
            """
            if db.execute(insert_query, (username, email, USER_ROLE["PARTICIPANT"], 0)):
                db.commit()
                return True, username, ""
            else:
                return False, "", "创建用户失败"
    except Exception as e:
        print(f"登录失败: {str(e)}")
        return False, "", str(e)
    finally:
        db.close()

def validate_user(email: str, act_at: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    验证邮箱对应的用户是否已在数据库中注册
    
    Args:
        email: 用户输入的邮箱字符串
        act_at: 验证时间
        ip_address: 用户IP地址（可选）
        user_agent: 用户代理信息（可选）
        
    Returns:
        tuple: (状态, 用户名, 消息) 
            - 状态为 True 时，返回用户名和成功消息
            - 状态为 False 时，返回空用户名和错误提示
    """
    # 邮箱验证
    if not email or not is_valid_email(email.strip()):
        return False, None, "邮箱格式不正确"
    
    # 调用login_user函数，保持功能
    success, username, error_msg = login_user(email.strip(), ip_address, user_agent)
    
    if success:
        # 更新最后登录时间
        db = Database("users")
        if db.connect():
            try:
                db.execute("UPDATE users SET last_login = ? WHERE email = ?", (act_at, email.strip()))
                db.commit()
                # 记录登录行为
                record_behavior(email.strip(), "login", act_at, None, ip_address, user_agent)
            except Exception as e:
                print(f"更新登录时间失败: {str(e)}")
                db.rollback()
            finally:
                db.close()
        return True, username, "登录成功"
    else:
        return False, None, error_msg if error_msg else "登录失败"


def check_access(username: str, password: str) -> Tuple[bool, str]:
    """
    验证管理员用户名和密码
    
    Args:
        username: 待验证的用户名
        password: 待验证的密码
        
    Returns:
        tuple: (验证状态, 提示信息)
            - 状态为 True 时，验证成功
            - 状态为 False 时，提示信息说明失败原因
    """
    # 输入验证
    if not username or not username.strip():
        return False, "用户名不能为空"
    
    if not password or not password.strip():
        return False, "密码不能为空"
    
    config_path = Path("./data/manage_config.yaml")
    
    # 确保配置文件存在
    if not config_path.exists():
        # 创建默认配置文件
        default_config = {"secret_key": {"jiajun_tang": hash_password("NJLDS1101tjj!")}}
        config_path.parent.mkdir(exist_ok=True)
        with open(config_path, 'w', encoding='utf-8') as f:
            yaml.dump(default_config, f, default_flow_style=False, allow_unicode=True)
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
            
        if not config or "secret_key" not in config:
            return False, "管理员配置不存在"
        
        secret_key_config = config["secret_key"]
        # 使用哈希密码进行验证
        if secret_key_config[username] == hash_password(password.strip()):
            return True, "验证成功"
        else:
            return False, "用户名或密码错误"
    except Exception as e:
        print(f"检查管理员权限时发生错误: {str(e)}")
        return False, "验证失败，请稍后重试"

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """
    根据邮箱获取用户信息
    
    Args:
        email: 用户邮箱
        
    Returns:
        Optional[Dict[str, Any]]: 用户信息字典或None
    """
    db = Database("users")
    if not db.connect():
        return None
    
    try:
        db.execute("SELECT * FROM users WHERE email = ?", (email.strip(),))
        result = db.fetchone()
        
        if result:
            columns = db.get_columns()
            return dict(zip(columns, result))
        return None
    except Exception as e:
        print(f"获取用户信息失败：{str(e)}")
        return None
    finally:
        db.close()


def get_all_users() -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取所有用户信息
    
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: 
            (是否成功, 用户列表, 错误信息)
    """
    db = Database("users")
    if not db.connect():
        return False, None, "数据库连接失败"
    
    try:
        db.execute("SELECT * FROM users")
        results = db.fetchall()
        columns = db.get_columns()
        
        users = [dict(zip(columns, row)) for row in results]
        return True, users, ""
    except Exception as e:
        return False, None, f"获取用户列表失败：{str(e)}"
    finally:
        db.close()