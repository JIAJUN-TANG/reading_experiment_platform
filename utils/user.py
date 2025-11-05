import sqlite3
from utils.data import record_behavior
from pathlib import Path
import yaml

            
def register_user(user_data):
    """注册新参与者信息，存入数据库"""

    # 连接数据库
    conn = sqlite3.connect("./data/users.db")
    c = conn.cursor()

    try:
        # 检查用户名是否已存在
        c.execute("SELECT email FROM users WHERE email = ?", (user_data["email"],))
        if c.fetchone():
            return False, "邮箱已存在，请更换"

        # 插入新用户
        c.execute(
            "INSERT INTO users (email, username, sex, age, degree, school, major, created_at, role, user_group, experiment_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (user_data["email"], user_data["username"], user_data["sex"], user_data["age"], user_data["degree"], user_data["school"], user_data["major"], user_data["created_at"], user_data["role"], 0, user_data["experiment_name"])
        )
        conn.commit()
        record_behavior(user_data["email"], "register", user_data["created_at"], None)
        return True, "信息录入成功！"
    
    except Exception as e:
        return False, f"信息录入失败：{str(e)}"
    
    finally:
        conn.close()

def validate_user(email, act_at):
    """
    验证邮箱对应的用户是否已在数据库中注册
    
    参数：
        email: 用户输入的邮箱字符串
        
    返回：
        tuple: (状态, 信息) 
            - 状态为 True 时，信息为用户名（验证成功）
            - 状态为 False 时，信息为错误提示（验证失败）
    """
    conn = None
    try:
        conn = sqlite3.connect("./data/users.db")
        c = conn.cursor()

        c.execute("SELECT username FROM users WHERE email = ?", (email.strip(),))
        result = c.fetchone()

        if result:
            record_behavior(email, "login", act_at, None)
            return True, result[0]
        else:
            return False, None

    except sqlite3.Error as e:
        return False, f"数据库错误：{str(e)}"
    except Exception as e:
        return False, f"验证失败：{str(e)}"
    finally:
        if conn:
            conn.close()

def check_access(username: str, password: str) -> tuple[bool, str]:
    """
    验证用户名和密码是否匹配配置文件中的记录
    
    参数：
        username: 待验证的用户名
        password: 待验证的密码
        
    返回：
        tuple: (验证状态, 提示信息)
            - 状态为 True 时，验证成功
            - 状态为 False 时，提示信息说明失败原因
    """
    config_path = Path("./data/manage_config.yaml")
    
    try:
        # 检查配置文件是否存在
        if not config_path.exists():
            return False, f"配置文件不存在：{config_path.resolve()}"
        
        # 检查路径是否为文件（避免目录误判）
        if not config_path.is_file():
            return False, f"路径不是文件：{config_path.resolve()}"
        
        # 读取并解析YAML配置
        with open(config_path, "r", encoding="utf-8") as f:
            try:
                config = yaml.safe_load(f)
            except yaml.YAMLError as e:
                return False, f"配置文件格式错误（YAML解析失败）：{str(e)}"
        
        # 验证配置是否为字典类型（确保结构正确）
        if not isinstance(config, dict):
            return False, "配置文件格式错误，根节点必须是字典（用户名:密码结构）"
        
        # 验证用户名是否存在
        if username not in config["secret_keys"]:
            return False, f"用户名不存在：{username}"
        
        # 验证密码是否匹配
        stored_password = config["secret_keys"][username]
        if password == stored_password:
            return True, f"验证成功，欢迎 {username}"
        else:
            return False, "密码错误"
    
    except Exception as e:
        # 捕获其他未知错误（如权限问题、文件损坏等）
        return False, f"验证过程出错：{str(e)}"