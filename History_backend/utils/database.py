import aiosqlite
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_db():
    """异步数据库连接上下文管理器"""
    db = None
    try:
        db = await aiosqlite.connect("/mnt/hdd/local_database.db")
        yield db
    finally:
        if db:
            await db.close()

async def init_db():
    """初始化数据库"""
    async with get_db() as db:
        # 创建文献表
        await create_document_table(db)
        
        # 创建用户表
        await create_user_table(db)
        
        # 创建使用记录表
        await create_usage_table(db)
        
    return True

async def create_document_table(db):
    """ 异步创建文献数据库的数据表 """
    await db.execute(
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
                insert_date TEXT NOT NULL,
                date TEXT
            )'''
        )
    await db.commit()
    return True

async def create_library_table(email: str):
    """ 异步创建用户个人文献数据表 """
    async with get_db() as db:
        await db.execute(
            f'''CREATE TABLE IF NOT EXISTS {email} (
                uuid TEXT PRIMARY KEY,
                user_name TEXT,
                series_name TEXT NOT NULL,
                file_name TEXT,
                title TEXT,
                start_page INTEGER NOT NULL,
                end_page INTEGER NOT NULL,
                full_text TEXT NOT NULL,
                file BLOB NOT NULL,
                insert_date TEXT NOT NULL,
                date TEXT
            )'''
        )
        await db.commit()
        return True

async def create_user_table(db):
    """ 异步创建用户系统表 """
    await db.execute(
            '''CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                user_name TEXT NOT NULL,
                affiliation TEXT NOT NULL,
                invitation TEXT NOT NULL,
                passwd TEXT NOT NULL,
                register_date Date
            )'''
        )
    await db.commit()
    return True

async def create_usage_table(db):
    """ 异步创建使用记录表 """
    await db.execute(
            '''CREATE TABLE IF NOT EXISTS usage (
                uuid TEXT PRIMARY KEY,
                email TEXT NOT NULL,
                user_name TEXT NOT NULL,
                affiliation TEXT NOT NULL,
                login_date Date,
                ip_address TEXT
            )'''
        )
    await db.commit()
    return db

async def user_register(user_data):
    """异步插入用户数据"""
    async with get_db() as db:
        await db.execute(
            '''INSERT INTO users (email, user_name, affiliation, invitation, passwd, register_date)
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
        await db.commit()
        return True

async def save_document_to_db(document_uuid: str, user_name: str, series_name: str, file_name: str, 
                            title: str, start_page: int, end_page: int, full_text: str, 
                            pdf_blob: bytes, insert_date: str, date: str):
    """
    异步保存文档到数据库
    """
    try:
        async with get_db() as db:
            await db.execute('''
                INSERT INTO documents (uuid, user_name, series_name, file_name, title, 
                                     start_page, end_page, full_text, file, insert_date, date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (document_uuid, user_name, series_name, file_name, title, 
                  start_page, end_page, full_text, pdf_blob, insert_date, date))
            
            await db.commit()
            return True
            
    except Exception as e:
        print(f"保存到数据库时出错: {e}")
        return False

async def record_usage(uuid, email, user_name, affiliation, login_date, ip_address):
    """异步记录用户使用情况"""
    async with get_db() as db:
        await db.execute(
            '''INSERT INTO usage (uuid, email, user_name, affiliation, login_date, ip_address)
               VALUES (?, ?, ?, ?, ?, ?)''',
            (uuid, email, user_name, affiliation, login_date, ip_address),
        )
        await db.commit()
        return True
    
async def user_login(email):
    """异步用户登录验证"""
    async with get_db() as db:
        async with db.execute(
            "SELECT email, passwd, user_name, affiliation, register_date FROM users WHERE email = ?", 
            (email,)
        ) as cursor:
            user_data = await cursor.fetchone()
            return user_data if user_data else None

async def get_latest(limit: int = 100):
    """异步获取最新文档"""
    async with get_db() as db:
        async with db.execute("""
            SELECT uuid, user_name, series_name
            FROM documents
            GROUP BY series_name
            LIMIT ?
        """, (limit,)) as cursor:
            column_names = [description[0] for description in cursor.description]
            rows = await cursor.fetchall()
            
            result = []
            for row in rows:
                result.append({
                    column_names[i]: row[i].decode('utf-8', errors='ignore') if isinstance(row[i], bytes) else row[i]
                    for i in range(len(row))
                })
            return result

async def get_affiliation():
    """异步获取机构统计"""
    async with get_db() as db:
        async with db.execute(
            "SELECT affiliation, COUNT(*) as count FROM users GROUP BY affiliation"
        ) as cursor:
            rows = await cursor.fetchall()
            return {row[0]: row[1] for row in rows}

async def get_count():
    """异步获取文档总数"""
    async with get_db() as db:
        async with db.execute("SELECT COUNT(*) FROM documents") as cursor:
            count = (await cursor.fetchone())[0]
            return {"count": count}

async def search_data(search_string):
    """异步搜索文档"""
    async with await get_db() as db:
        search_pattern = f"*{search_string}*"
        async with db.execute("""
            SELECT uuid, user_name, series_name, file_name, title, start_page, end_page, full_text
            FROM documents
            WHERE full_text GLOB ?
        """, (search_pattern,)) as cursor:
            column_names = [description[0] for description in cursor.description]
            rows = await cursor.fetchall()
            
            result = []
            for row in rows:
                result.append({
                    column_names[i]: row[i].decode('utf-8', errors='ignore') if isinstance(row[i], bytes) else row[i]
                    for i in range(len(row))
                })
            return result

async def get_file(uuid):
    """异步获取文件"""
    async with get_db() as db:
        async with db.execute("""
            SELECT title, series_name, file
            FROM documents
            WHERE uuid = ?
        """, (uuid,)) as cursor:
            return await cursor.fetchone()

async def get_full_text(uuid):
    """异步获取全文"""
    async with get_db() as db:
        async with db.execute("""
            SELECT user_name, series_name, file_name, title, start_page, end_page, full_text
            FROM documents
            WHERE uuid = ?
        """, (uuid,)) as cursor:
            return await cursor.fetchone()

async def get_usage_statistics():
    """异步获取使用统计"""
    async with get_db() as db:
        async with db.execute("""
            SELECT 
                strftime('%Y-%m', login_date) as month,
                COUNT(*) as count
            FROM usage
            WHERE login_date >= date('now', '-6 months')
            GROUP BY strftime('%Y-%m', login_date)
            ORDER BY month DESC
            LIMIT 6
        """) as cursor:
            rows = await cursor.fetchall()
            
            months = []
            counts = []
            for row in rows:
                months.append(row[0])
                counts.append(row[1])
            
            months.reverse()
            counts.reverse()
            
            return {
                "months": months,
                "counts": counts,
                "total": sum(counts)
            }
