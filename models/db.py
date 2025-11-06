import sqlite3
from pathlib import Path
from typing import Optional, Tuple, List


class Database:
    """
    数据库连接和操作的基类
    """
    
    def __init__(self, db_name: str):
        """
        初始化数据库连接
        
        Args:
            db_name: 数据库名称（不含.db后缀）
        """
        db_dir = Path("./data")
        db_dir.mkdir(exist_ok=True)
        self.db_path = db_dir / f"{db_name}.db"
        self.conn = None
        self.cursor = None
    
    def connect(self) -> bool:
        """
        建立数据库连接
        
        Returns:
            bool: 连接是否成功
        """
        try:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.cursor = self.conn.cursor()
            return True
        except sqlite3.Error as e:
            print(f"数据库连接失败: {e}")
            return False
    
    def close(self) -> None:
        """
        关闭数据库连接
        """
        if self.conn:
            self.conn.close()
            self.conn = None
            self.cursor = None
    
    def execute(self, query: str, params: Optional[tuple] = None) -> bool:
        """
        执行SQL语句
        
        Args:
            query: SQL查询语句
            params: 查询参数
            
        Returns:
            bool: 执行是否成功
        """
        if not self.cursor:
            return False
        
        try:
            if params:
                self.cursor.execute(query, params)
            else:
                self.cursor.execute(query)
            return True
        except sqlite3.Error as e:
            print(f"SQL执行失败: {e}")
            return False
    
    def commit(self) -> bool:
        """
        提交事务
        
        Returns:
            bool: 提交是否成功
        """
        if not self.conn:
            return False
        
        try:
            self.conn.commit()
            return True
        except sqlite3.Error as e:
            print(f"事务提交失败: {e}")
            return False
    
    def rollback(self) -> None:
        """
        回滚事务
        """
        if self.conn:
            self.conn.rollback()
    
    def fetchall(self) -> List[Tuple]:
        """
        获取所有查询结果
        
        Returns:
            List[Tuple]: 查询结果列表
        """
        if not self.cursor:
            return []
        return self.cursor.fetchall()
    
    def fetchone(self) -> Optional[Tuple]:
        """
        获取单条查询结果
        
        Returns:
            Optional[Tuple]: 查询结果或None
        """
        if not self.cursor:
            return None
        return self.cursor.fetchone()
    
    def get_columns(self) -> List[str]:
        """
        获取当前查询的列名
        
        Returns:
            List[str]: 列名列表
        """
        if not self.cursor or not self.cursor.description:
            return []
        return [desc[0] for desc in self.cursor.description]
    
    def get_lastrowid(self) -> int:
        """
        获取最后插入行的ID
        
        Returns:
            int: 最后插入行的ID
        """
        if not self.cursor:
            return -1
        return self.cursor.lastrowid or -1
    
    def get_rowcount(self) -> int:
        """
        获取受影响的行数
        
        Returns:
            int: 受影响的行数
        """
        if not self.cursor:
            return 0
        return self.cursor.rowcount


def init_user_db():
    """
    初始化用户数据库，创建用户表和行为表
    """
    db = Database("users")
    if not db.connect():
        return "数据库连接失败"
    
    try:
        # 创建用户表
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL,
                sex TEXT NOT NULL,
                age INTEGER NOT NULL CHECK(age > 0 AND age < 150),
                degree TEXT NOT NULL,
                job TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                role TEXT NOT NULL DEFAULT "user",
                user_group INTEGER NOT NULL DEFAULT 0,
                experiment_name TEXT NOT NULL
            )
        ''')
        
        # 创建行为表
        db.execute('''
            CREATE TABLE IF NOT EXISTS behaviors (
                id INTEGER PRIMARY KEY,
                email TEXT NOT NULL,
                action TEXT NOT NULL,
                act_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                target TEXT,
                FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
            )
        ''')
        
        # 创建索引
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_behavior_email ON behaviors(email)
        ''')
        
        db.commit()
        return None
    except sqlite3.Error as e:
        db.rollback()
        return f"数据库初始化失败: {str(e)}"
    finally:
        db.close()


def init_experiment_db():
    """
    初始化实验数据库，记录每次实验材料和相关数据
    """
    # 创建媒体目录
    media_dirs = [Path("./data/image"), Path("./data/video"), Path("./data/audio")]
    for dir_path in media_dirs:
        dir_path.mkdir(exist_ok=True)
    
    db = Database("experiments")
    if not db.connect():
        return "数据库连接失败"
    
    try:
        # 创建实验表
        db.execute('''
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
        
        # 创建任务分配表
        db.execute('''
            CREATE TABLE IF NOT EXISTS assignments (
                id INTEGER PRIMARY KEY,
                email TEXT NOT NULL,
                material_name TEXT NOT NULL,
                status INTEGER NOT NULL,
                author TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 创建材料表
        db.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY,
                experiment_name TEXT NOT NULL,
                material_name TEXT NOT NULL,
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
        
        db.commit()
        return None
    except sqlite3.Error as e:
        db.rollback()
        return f"数据库初始化失败: {str(e)}"
    finally:
        db.close()