import sqlite3
import bcrypt
from datetime import datetime


def register_user(email, username, password, role):
    """注册新用户：检查用户名是否存在，加密密码后存入数据库"""
    if not username or not password:
        return False, "用户名和密码不能为空"
    
    if len(password) < 6:
        return False, "密码长度不能少于6位"

    # 连接数据库
    conn = sqlite3.connect("./data/users.db")
    c = conn.cursor()

    try:
        # 检查用户名是否已存在
        c.execute("SELECT username FROM users WHERE username = ?", (username,))
        if c.fetchone():
            return False, "用户名已存在，请更换"
        
        # 密码加密（bcrypt哈希，自动生成盐值）
        password_bytes = password.encode('utf-8')  # 转换为字节
        password_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt())  # 哈希加密

        # 插入新用户
        c.execute(
            "INSERT INTO users (email, username, password_hash, created_at, role) VALUES (?, ?, ?, ?, ?)",
            (email, username, password_hash, datetime.now(), role)
        )
        conn.commit()
        return True, "注册成功，请登录"
    
    except Exception as e:
        return False, f"注册失败：{str(e)}"
    
    finally:
        conn.close()