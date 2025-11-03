import sqlite3
from pathlib import Path


def init_user_db():
    """初始化用户数据库，创建用户表和行为表（若不存在），优化表结构及约束"""
    # 确保数据目录存在
    db_dir = Path("./data")
    db_dir.mkdir(exist_ok=True)  # 若目录已存在则不报错
    db_path = db_dir / "users.db"

    conn = sqlite3.connect(db_path, check_same_thread=False)
    c = conn.cursor()

    try:
        c.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL,
                sex TEXT NOT NULL,
                age INTEGER NOT NULL CHECK(age > 0 AND age < 150),
                degree TEXT NOT NULL,
                school TEXT,
                major TEXT,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                role TEXT NOT NULL DEFAULT "user",
                user_group INTEGER NOT NULL DEFAULT 0
            )
        ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS behaviors (
                id INTEGER PRIMARY KEY,
                email TEXT NOT NULL,
                action TEXT NOT NULL,
                target TEXT,
                act_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
            )
        ''')

        c.execute('''
            CREATE INDEX IF NOT EXISTS idx_behavior_email ON behaviors(email)
        ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS statistics (
                id INTEGER PRIMARY KEY,
                email TEXT NOT NULL,
                read INTEGER NOT NULL DEFAULT 0,
                read_list TEXT NOT NULL,
                remain INTEGER NOT NULL DEFAULT 0,
                remain_list TEXT NOT NULL,
                FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
            )
        ''')

        c.execute('''
            CREATE INDEX IF NOT EXISTS idx_statistic_email ON statistics(email)
        ''')

        # 提交事务
        conn.commit()

    except sqlite3.Error as e:
        conn.rollback()
    finally:
        conn.close()

def init_experiment_db():
    """初始化实验数据库，记录每次实验材料和相关数据"""
    # 确保数据目录存在
    db_dir = Path("./data")
    media_dir = [Path("./data/image"), Path("./data/video"), Path("./data/audio")]
    for _ in media_dir:
        _.mkdir(exist_ok=True)
    db_dir.mkdir(exist_ok=True)  # 若目录已存在则不报错
    db_path = db_dir / "experiments.db"

    conn = sqlite3.connect(db_path, check_same_thread=False)
    c = conn.cursor()

    try:
        c.execute('''
            CREATE TABLE IF NOT EXISTS experiments (
                id INTEGER PRIMARY KEY,
                experiment_name TEXT NOT NULL,
                visible TEXT NOT NULL,
                content TEXT NOT NULL,
                author TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME NOT NULL,
                user_group INTEGER NOT NULL DEFAULT 0
            )
        ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS assignments (
                id INTEGER PRIMARY KEY,
                experiment_name TEXT NOT NULL,
                email TEXT NOT NULL,
                material_name TEXT NOT NULL,
                ai_function TEXT NOT NULL,
                status INTEGER NOT NULL,
                author TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME NOT NULL,
                FOREIGN KEY (experiment_name) REFERENCES experiments(experiment_name) ON DELETE CASCADE
            )
        ''')

        c.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY,
                experiment_name TEXT NOT NULL,
                material_name TEXT NOT NULL,
                visible INTEGER NOT NULL,
                ai_function TEXT NOT NULL,
                content TEXT NOT NULL,
                image TEXT,
                video TEXT,
                audio TEXT,
                author TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                user_group INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (experiment_name) REFERENCES experiments(experiment_name) ON DELETE CASCADE
            )
        ''')

        # 提交事务
        conn.commit()

    except sqlite3.Error as e:
        conn.rollback()
    finally:
        conn.close()