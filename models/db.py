import sqlite3
from pathlib import Path
from typing import Optional, Tuple, List, Dict, Any
import threading


class DatabaseConnectionPool:
    """
    数据库连接池管理类
    """
    _instance = None
    _connections: Dict[str, sqlite3.Connection] = {}
    _lock = threading.RLock()  # 添加锁以确保线程安全
    
    def __new__(cls):
        """单例模式"""
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DatabaseConnectionPool, cls).__new__(cls)
        return cls._instance
    
    def get_connection(self, db_path: str) -> Optional[sqlite3.Connection]:
        """
        获取数据库连接
        
        Args:
            db_path: 数据库文件路径
            
        Returns:
            数据库连接对象或None
        """
        # 确保data目录存在
        Path(db_path).parent.mkdir(exist_ok=True)
        
        with self._lock:
            # 先检查连接是否存在
            connection_exists = db_path in self._connections
            
            # 验证连接是否有效（无论是否存在）
            if connection_exists:
                connection_valid = False
                try:
                    # 尝试执行简单查询验证连接
                    test_cursor = self._connections[db_path].cursor()
                    test_cursor.execute("SELECT 1")
                    test_cursor.close()
                    connection_valid = True
                except (sqlite3.Error, AttributeError) as e:
                    # 捕获连接错误或属性错误（如closed属性不存在）
                    print(f"数据库连接无效，将重新创建: {e}")
                    # 尝试关闭无效连接
                    try:
                        if hasattr(self._connections[db_path], 'close'):
                            self._connections[db_path].close()
                    except:
                        pass
                
                # 如果连接无效，标记需要重新创建
                if not connection_valid:
                    connection_exists = False
            
            # 如果需要创建新连接
            if not connection_exists:
                try:
                    self._connections[db_path] = sqlite3.connect(
                        db_path, 
                        check_same_thread=False,
                        timeout=30  # 添加超时设置
                    )
                    # 设置更高效的参数
                    self._connections[db_path].row_factory = sqlite3.Row
                    print(f"成功创建数据库连接: {db_path}")
                except sqlite3.Error as e:
                    print(f"创建数据库连接失败: {e}")
                    return None
        
        return self._connections[db_path]
    
    def close_connection(self, db_path: str) -> None:
        """
        关闭指定数据库连接
        
        Args:
            db_path: 数据库文件路径
        """
        with self._lock:
            if db_path in self._connections:
                try:
                    self._connections[db_path].close()
                    del self._connections[db_path]
                except sqlite3.Error as e:
                    print(f"关闭数据库连接失败: {e}")
    
    def close_all_connections(self) -> None:
        """关闭所有数据库连接"""
        with self._lock:
            for db_path in list(self._connections.keys()):
                self.close_connection(db_path)


# 全局连接池实例
connection_pool = DatabaseConnectionPool()


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
        self.db_path = str(db_dir / f"{db_name}.db")
        self.conn = None
        self.cursor = None
    
    def connect(self) -> bool:
        """
        从连接池获取数据库连接
        
        Returns:
            bool: 连接是否成功
        """
        try:
            self.conn = connection_pool.get_connection(self.db_path)
            if self.conn is not None:
                self.cursor = self.conn.cursor()
                return True
            else:
                self.cursor = None
                return False
        except Exception as e:
            print(f"数据库连接失败: {str(e)}")
            self.conn = None
            self.cursor = None
            return False
    
    def close(self) -> None:
        """
        关闭数据库连接（实际上只是释放游标，连接仍然在池中）
        """
        if self.cursor:
            try:
                self.cursor.close()
            except Exception as e:
                print(f"关闭游标时出错: {str(e)}")
        
        self.cursor = None
        # 注意：不关闭连接，而是将其保留在连接池中供后续使用
    
    def execute(self, query: str, params: Optional[tuple] = None) -> bool:
        """
        执行SQL语句
        
        Args:
            query: SQL查询语句
            params: 查询参数
            
        Returns:
            bool: 执行是否成功
        """
        # 检查连接和游标是否有效
        if self.conn is None or self.cursor is None:
            if not self.connect():
                return False
        
        try:
            if self.cursor is not None:
                if params:
                    self.cursor.execute(query, params)
                else:
                    self.cursor.execute(query)
                return True
            return False
        except sqlite3.Error as e:
            print(f"SQL执行失败: {str(e)} - Query: {query}")
            # 执行失败后重新连接，以便下次操作能正常进行
            self.close()
            return False
    
    def commit(self) -> bool:
        """
        提交事务
        
        Returns:
            bool: 提交是否成功
        """
        try:
            if self.conn is not None:
                self.conn.commit()
                return True
            return False
        except sqlite3.Error as e:
            print(f"事务提交失败: {str(e)}")
            return False
    
    def rollback(self) -> None:
        """
        回滚事务
        """
        try:
            if self.conn is not None:
                self.conn.rollback()
        except sqlite3.Error as e:
            print(f"事务回滚失败: {str(e)}")
    
    def fetchall(self) -> List[Dict[str, Any]]:
        """
        获取所有查询结果
        
        Returns:
            List[Dict[str, Any]]: 查询结果列表，每行数据以字典形式返回
        """
        if not self.cursor:
            return []
        
        try:
            # 使用字典形式返回结果，便于使用列名访问
            result = []
            for row in self.cursor.fetchall():
                if isinstance(row, sqlite3.Row):
                    result.append(dict(row))
                else:
                    # 兼容非字典形式的结果
                    columns = self.get_columns()
                    if columns and len(columns) == len(row):
                        result.append(dict(zip(columns, row)))
                    else:
                        result.append(row)
            return result
        except Exception as e:
            print(f"获取查询结果失败: {str(e)}")
            return []
    
    def fetchone(self) -> Optional[Dict[str, Any]]:
        """
        获取单条查询结果
        
        Returns:
            Optional[Dict[str, Any]]: 查询结果或None
        """
        if not self.cursor:
            return None
        
        try:
            row = self.cursor.fetchone()
            if row is not None:
                if isinstance(row, sqlite3.Row):
                    return dict(row)
                else:
                    columns = self.get_columns()
                    if columns and len(columns) == len(row):
                        return dict(zip(columns, row))
            return None
        except Exception as e:
            print(f"获取单条查询结果失败: {str(e)}")
            return None
    
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
        try:
            last_id = self.cursor.lastrowid
            return last_id if last_id is not None else -1
        except Exception as e:
            print(f"获取最后插入行ID失败: {str(e)}")
            return -1
    
    def get_rowcount(self) -> int:
        """
        获取受影响的行数
        
        Returns:
            int: 受影响的行数
        """
        if not self.cursor:
            return 0
        return self.cursor.rowcount


# 常量定义
USER_ROLE = {
    "ADMIN": "admin",
    "PARTICIPANT": "participant"
}

ASSIGNMENT_STATUS = {
    "NOT_STARTED": 0,
    "IN_PROGRESS": 1,
    "COMPLETED": 2,
    "FAILED": 3
}

def init_user_db():
    """
    初始化用户数据库，创建用户表和行为表
    """
    db = Database("users")
    if not db.connect():
        return "数据库连接失败"
    
    try:
        # 启用外键约束
        db.execute("PRAGMA foreign_keys = ON")
        
        # 创建用户表
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL,
                sex TEXT NOT NULL,
                age INTEGER NOT NULL CHECK(age > 0 AND age < 150),
                degree TEXT NOT NULL,
                job TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                role TEXT NOT NULL DEFAULT "participant",
                user_group INTEGER NOT NULL DEFAULT 0,
                experiment_name TEXT NOT NULL,
                last_login DATETIME
            )
        ''')
        
        # 创建行为表
        db.execute('''
            CREATE TABLE IF NOT EXISTS behaviors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                action TEXT NOT NULL,
                act_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                target TEXT,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY (email) REFERENCES users(email) ON DELETE CASCADE
            )
        ''')
        
        # 创建索引 - 添加更多索引以提高查询性能
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_behavior_email ON behaviors(email)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_behavior_action ON behaviors(action)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_behavior_time ON behaviors(act_at)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_users_experiment ON users(experiment_name)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_users_group ON users(user_group)
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
        # 启用外键约束
        db.execute("PRAGMA foreign_keys = ON")
        
        # 创建实验表
        db.execute('''
            CREATE TABLE IF NOT EXISTS experiments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                experiment_name TEXT NOT NULL UNIQUE,
                visible BOOLEAN NOT NULL DEFAULT 1,
                content TEXT NOT NULL,
                author TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME,
                ended_at DATETIME,
                user_group INTEGER NOT NULL DEFAULT 0,
                description TEXT,
                is_active BOOLEAN DEFAULT 1
            )
        ''')
        
        # 创建材料表（先创建，因为assignments表会引用它）
        db.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                is_active INTEGER DEFAULT 1,
                FOREIGN KEY (experiment_name) REFERENCES experiments(experiment_name) ON DELETE CASCADE,
                UNIQUE(experiment_name, material_name)
            )
        ''')
        
        # 创建任务分配表
        db.execute('''
            CREATE TABLE IF NOT EXISTS assignments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                material_name TEXT NOT NULL,
                status INTEGER NOT NULL DEFAULT 0,
                author TEXT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME,
                started_at DATETIME,
                ended_at DATETIME,
                duration INTEGER
            )
        ''')
        
        # 添加必要的索引
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_assignments_email ON assignments(email)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_assignments_material ON assignments(material_name)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_assignments_email_material ON assignments(email, material_name)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_materials_experiment ON materials(experiment_name)
        ''')
        db.execute('''
            CREATE INDEX IF NOT EXISTS idx_experiments_active ON experiments(is_active)
        ''')
        
        db.commit()
        return None
    except sqlite3.Error as e:
        db.rollback()
        return f"数据库初始化失败: {str(e)}"
    finally:
        db.close()