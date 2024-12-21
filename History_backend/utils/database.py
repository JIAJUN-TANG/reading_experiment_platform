import sqlite3
from io import BytesIO


def get_db_connection():
    """ 获取数据库连接的函数 """
    conn = sqlite3.connect("/mnt/hdd/local_database.db")
    return conn

def create_table():
    """ 创建文献数据库的数据表 """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''CREATE TABLE IF NOT EXISTS documents (
            uuid TEXT PRIMARY KEY,
            user_name TEXT,
            series_name TEXT NOT NULL,
            file_name TEXT,
            title TEXT,
            start_page INTEGER NOT NULL,
            end_page INTEGER NOT NULL,
            full_text TEXT NOT NULL,
            file BLOB NOT NULL,
            date TEXT
        )'''
    )
    conn.commit()
    conn.close()

create_table()

def create_user_table():
    """ 创建用户数据库的数据表 """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            user_name TEXT NOT NULL,
            affiliation TEXT NOT NULL,
            invitation TEXT NOT NULL,
            passwd TEXT NOT NULL,
            register_date Date
        )'''
    )
    conn.commit()
    conn.close()

create_user_table()

def create_usage_table():
    """ 创建用户数据库的数据表 """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''CREATE TABLE IF NOT EXISTS usage (
            uuid TEXT PRIMARY KEY,
            email TEXT NOT NULL,
            user_name TEXT NOT NULL,
            affiliation TEXT NOT NULL,
            login_date Date,
            ip_address TEXT
        )'''
    )
    conn.commit()
    conn.close()

create_usage_table()

def user_register(user_data):
    """插入用户数据到数据库"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO usage (uuid, email, user_name, affiliation, login_date, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (
            user_data["email"],
            user_data["user_name"],
            user_data["affiliation"],
            user_data["invitation"],
            user_data["passwd"],
            user_data["register_date"],
        ),
    )
    conn.commit()
    conn.close()

def record_usage(uuid, email, user_name, affiliation, login_date, ip_address):
    """ 记录用户登录情况 """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        '''INSERT INTO usage (uuid, email, user_name, affiliation, login_date, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (
            uuid, email, user_name, affiliation, login_date, ip_address, 
        ),
    )
    conn.commit()
    conn.close()

def user_login(email):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email, passwd, user_name, affiliation FROM users WHERE email = ?", (email,))
    user_data = cursor.fetchone()
    conn.close()
    # 检查用户是否存在
    if not user_data:
        return None
    else:
        return user_data
    
def get_latest(limit: int = 100):
    conn = get_db_connection()
    cursor = conn.cursor()
    # 执行查询获取数据
    cursor.execute("""
        SELECT uuid, user_name, series_name
        FROM documents
        GROUP BY series_name
        LIMIT ?
    """, (limit,))
    
    # 获取列名·
    column_names = [description[0] for description in cursor.description]
    
    # 获取查询结果
    rows = cursor.fetchall()
    
    conn.close()
    
    # 将每一行的数据与列名对应，返回字典列表
    result = []
    for row in rows:
        # 遍历每一行数据并进行编码转换
        result.append({
    column_names[i]: row[i].decode('utf-8', errors='ignore') if isinstance(row[i], bytes) else row[i]
    for i in range(len(row))
})
    return result

def get_affiliation():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT affiliation, COUNT(*) as count FROM users GROUP BY affiliation")
    rows = cursor.fetchall()
    conn.close()
    affiliations = {row[0]: row[1] for row in rows}
    return affiliations

def get_count():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM documents")
    count = cursor.fetchone()[0]
    conn.close()
    return {"count": count}

def search_data(search_string):
    conn = get_db_connection()
    cursor = conn.cursor()
    search_pattern = f"*{search_string}*"
    cursor.execute("""
        SELECT uuid, user_name, series_name, file_name, title, start_page, end_page, full_text
        FROM documents
        WHERE full_text GLOB ?
    """, (search_pattern,))
    column_names = [description[0] for description in cursor.description]
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        result.append({
            column_names[i]: row[i].decode('utf-8', errors='ignore') if isinstance(row[i], bytes) else row[i]
            for i in range(len(row))
        })
    return result

def get_file(uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT title, series_name, file
        FROM documents
        WHERE uuid = ?
    """, (uuid,))
    result = cursor.fetchone()
    conn.close()
    return result

def get_full_text(uuid):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT user_name, series_name, file_name, title, start_page, end_page, full_text
        FROM documents
        WHERE uuid = ?
    """, (uuid,))
    result = cursor.fetchone()
    conn.close()
    return result