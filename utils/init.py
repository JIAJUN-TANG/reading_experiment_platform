import os
import streamlit as st
import sqlite3
from pathlib import Path


def initialize_secret_toml():
    """初始化secret.toml文件，若不存在则创建并写入示例内容"""
    # 定义配置目录和文件路径
    config_dir = os.path.join(os.getcwd(), "config")
    secret_path = os.path.join(config_dir, "secret.toml")
    
    # 创建config目录（如果不存在）
    if not os.path.exists(config_dir):
        os.makedirs(config_dir, exist_ok=True)
        st.success(f"已创建配置目录：{config_dir}")
    
    # 检查secret.toml是否存在，不存在则创建并写入内容
    if not os.path.exists(secret_path):
        # 示例敏感信息模板（根据实际需求修改字段）
        example_content = """
# Streamlit敏感信息配置文件
# 请勿将此文件提交到版本控制（建议在.gitignore中添加 ./config/secret.toml）

# 数据库连接信息
[database]
host = "your_db_host"
port = "5432"
user = "your_db_user"
password = "your_db_password"
dbname = "your_db_name"

# API密钥（如需要）
[api]
api_key = "your_api_key_here"
api_secret = "your_api_secret_here"

# 其他敏感配置
[other]
admin_token = "your_admin_token"
        """.strip()
        
        # 写入文件
        with open(secret_path, "w", encoding="utf-8") as f:
            f.write(example_content)
        st.success(f"已生成secret.toml：{secret_path}\n请请填写实际敏感信息")
    
    return secret_path

def init_user_db():
    """初始化数据库，创建用户表（若不存在）"""
    # 数据库文件路径（./data/users.db）
    db_dir = Path("./data")
    db_dir.mkdir(exist_ok=True)  # 确保data目录存在
    db_path = db_dir / "users.db"

    # 连接数据库
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    # 创建用户表：id（主键）、username（唯一）、password_hash（加密密码）、created_at（注册时间）
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            password_hash BLOB NOT NULL,
            created_at DATETIME NOT NULL,
            role TEXT NOT NULL DEFAULT "user"
        )
    ''')
    conn.commit()
    conn.close()
