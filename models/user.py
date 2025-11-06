from typing import Optional, Tuple, Dict, Any, List
from pathlib import Path
import yaml
from .db import Database
from .data import record_behavior


def register_user(user_data: Dict[str, Any]) -> Tuple[bool, str]:
    """
    注册新参与者信息，存入数据库
    
    Args:
        user_data: 用户数据字典
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    db = Database("users")
    if not db.connect():
        return False, "数据库连接失败"
    
    try:
        # 检查邮箱是否已存在
        db.execute("SELECT email FROM users WHERE email = ?", (user_data["email"],))
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
                user_data["email"], user_data["username"], user_data["sex"], 
                user_data["age"], user_data["degree"], user_data["job"], user_data["created_at"], user_data["role"], 
                0, user_data["experiment_name"]
            )
        )
        db.commit()
        
        # 记录注册行为
        record_behavior(user_data["email"], "register", user_data["created_at"], None)
        
        return True, "信息录入成功！"
    except Exception as e:
        db.rollback()
        return False, f"信息录入失败：{str(e)}"
    finally:
        db.close()


def validate_user(email: str, act_at: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    验证邮箱对应的用户是否已在数据库中注册
    
    Args:
        email: 用户输入的邮箱字符串
        act_at: 验证时间
        
    Returns:
        tuple: (状态, 信息) 
            - 状态为 True 时，信息为用户名（验证成功）
            - 状态为 False 时，信息为错误提示（验证失败）
    """
    db = Database("users")
    if not db.connect():
        return False, "", "数据库连接失败"
    
    try:
        db.execute("SELECT username FROM users WHERE email = ?", (email.strip(),))
        result = db.fetchone()
        
        if result:
            # 记录登录行为
            record_behavior(email, "login", act_at, None)
            return True, result[0], "登陆成功"
        else:
            return False, "", "邮箱未注册，请先注册"
    except Exception as e:
        return False, "", f"验证失败：{str(e)}"
    finally:
        db.close()


def check_access(username: str, password: str) -> Tuple[bool, str]:
    """
    验证用户名和密码是否匹配配置文件中的记录
    
    Args:
        username: 待验证的用户名
        password: 待验证的密码
        
    Returns:
        tuple: (验证状态, 提示信息)
            - 状态为 True 时，验证成功
            - 状态为 False 时，提示信息说明失败原因
    """
    config_path = Path("./data/manage_config.yaml")
    
    try:
        # 检查配置文件是否存在
        if not config_path.exists():
            return False, f"配置文件不存在：{config_path.resolve()}"
        
        # 检查路径是否为文件
        if not config_path.is_file():
            return False, f"路径不是文件：{config_path.resolve()}"
        
        # 读取并解析YAML配置
        with open(config_path, "r", encoding="utf-8") as f:
            try:
                config = yaml.safe_load(f)
            except yaml.YAMLError as e:
                return False, f"配置文件格式错误（YAML解析失败）：{str(e)}"
        
        # 验证配置是否为字典类型
        if not isinstance(config, dict):
            return False, "配置文件格式错误，根节点必须是字典（用户名:密码结构）"
        
        # 验证用户名是否存在
        if "secret_keys" not in config or username not in config["secret_keys"]:
            return False, f"用户名不存在：{username}"
        
        # 验证密码是否匹配
        stored_password = config["secret_keys"][username]
        if password == stored_password:
            return True, f"验证成功，欢迎 {username}"
        else:
            return False, "密码错误"
    except Exception as e:
        return False, f"验证过程出错：{str(e)}"


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