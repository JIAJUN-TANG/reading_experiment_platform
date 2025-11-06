import json
import sqlite3
from typing import Optional, Tuple, Union, List, Dict, Any
from pathlib import Path
from .db import Database


def save_feedback(feedback: str, feedback_time: str) -> Tuple[bool, str]:
    """
    保存用户反馈到JSON文件
    
    Args:
        feedback: 用户反馈内容
        feedback_time: 反馈时间
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    feedback_path = Path("./data/feedback.json")
    
    try:
        # 确保data目录存在
        feedback_path.parent.mkdir(exist_ok=True)
        
        # 读取现有反馈
        existing_feedbacks = []
        if feedback_path.exists():
            with open(feedback_path, "r", encoding="utf-8") as f:
                try:
                    existing_feedbacks = json.load(f)
                    if not isinstance(existing_feedbacks, list):
                        existing_feedbacks = []
                except json.JSONDecodeError:
                    existing_feedbacks = []
        
        # 添加新反馈
        feedback_with_time = {
            "feedback": feedback,
            "created_at": feedback_time
        }
        existing_feedbacks.append(feedback_with_time)
        
        # 写入文件
        with open(feedback_path, "w", encoding="utf-8") as f:
            json.dump(
                existing_feedbacks,
                f,
                ensure_ascii=False,
                indent=2
            )
        
        return True, "反馈成功！"
    except Exception as e:
        return False, f"反馈失败：{str(e)}"


def record_behavior(email: str, action: str, act_time: str, target: Optional[str] = None) -> Tuple[bool, str]:
    """
    记录用户行为
    
    Args:
        email: 用户邮箱
        action: 行为动作
        act_time: 行为时间
        target: 行为目标（可选）
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    db = Database("users")
    if not db.connect():
        return False, "数据库连接失败"
    
    try:
        db.execute(
            "INSERT INTO behaviors (email, action, act_at, target) VALUES (?, ?, ?, ?)",
            (email, action, act_time, target)
        )
        db.commit()
        return True, "行为记录成功"
    except Exception as e:
        db.rollback()
        return False, f"行为记录失败：{str(e)}"
    finally:
        db.close()


def get_info(db_name: str, table: str) -> Tuple[bool, Optional[List[str]], Union[List[Tuple], str]]:
    """
    获取数据库表中的所有信息
    
    Args:
        db_name: 数据库名称
        table: 表名
        
    Returns:
        Tuple[bool, Optional[List[str]], Union[List[Tuple], str]]: 
            (是否成功, 列名列表, 数据列表或错误信息)
    """
    db = Database(db_name)
    if not db.connect():
        return False, None, "数据库连接失败"
    
    try:
        db.execute(f"SELECT * FROM {table}")
        results = db.fetchall()
        columns = db.get_columns()
        
        return True, columns, results
    except sqlite3.Error as e:
        return False, None, f"数据库错误：{str(e)}"
    except Exception as e:
        return False, None, f"查询失败：{str(e)}"
    finally:
        db.close()


def delete_data(db_name: str, table: str, field: str, id_value: str) -> Tuple[bool, str]:
    """
    删除数据库中的数据
    
    Args:
        db_name: 数据库名称
        table: 表名
        field: 字段名
        id_value: 字段值
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    db = Database(db_name)
    if not db.connect():
        return False, "数据库连接失败"
    
    try:
        # 检查记录是否存在
        db.execute(f"SELECT 1 FROM {table} WHERE {field} = ?", (id_value,))
        exists = db.fetchone()
        
        if not exists:
            return False, f"错误：{table}表中不存在{field}为{id_value}的记录"
        
        # 执行删除操作
        db.execute(f"DELETE FROM {table} WHERE {field} = ?", (id_value,))
        db.commit()
        
        return True, f"成功删除{table}表中{field}为{id_value}的记录，影响行数：{db.get_rowcount()}"
    except sqlite3.Error as e:
        db.rollback()
        return False, f"数据库错误：{str(e)}"
    except Exception as e:
        return False, f"删除失败：{str(e)}"
    finally:
        db.close()


def insert_data(
    db_name: str, 
    table: str, 
    data: Dict[str, Any], 
    primary_key: Optional[Union[str, List[str]]] = None
) -> Tuple[bool, str]:
    """
    通用数据库插入函数
    
    Args:
        db_name: 数据库名称
        table: 目标表名
        data: 插入的数据字典（键为字段名，值为字段值）
        primary_key: 用于查重的主键字段名（支持单个字段或复合主键列表）
        
    Returns:
        Tuple[bool, str]: (是否成功, 提示信息)
    """
    # 检查数据字典是否为空
    if not data:
        return False, "错误：数据字典不能为空"
        
    db = Database(db_name)
    if not db.connect():
        return False, "数据库连接失败"
    
    try:
        # 检查主键字段是否都在数据中
        if isinstance(primary_key, list):
            missing_keys = [key for key in primary_key if key not in data]
            if missing_keys:
                return False, f"错误：主键字段「{', '.join(missing_keys)}」未在数据中找到"
        else:
            if primary_key is not None and primary_key not in data:
                return False, f"错误：主键字段「{primary_key}」未在数据中找到"
        
        # 查重逻辑
        if primary_key is not None:
            if isinstance(primary_key, list):
                # 复合主键查重
                where_clause = " AND ".join([f"{key} = ?" for key in primary_key])
                primary_values = tuple(data[key] for key in primary_key)
                
                db.execute(
                    f"SELECT 1 FROM {table} WHERE {where_clause}",
                    primary_values
                )
                if db.fetchone():
                    key_str = ", ".join([f"{key}={data[key]}" for key in primary_key])
                    return False, f"数据已存在：主键组合「{key_str}」已被使用"
            else:
                # 单个主键查重
                db.execute(
                    f"SELECT {primary_key} FROM {table} WHERE {primary_key} = ?",
                    (data[primary_key],)
                )
                if db.fetchone():
                    return False, f"数据已存在!"
        
        # 构建插入SQL
        fields = list(data.keys())
        placeholders = ", ".join(["?"] * len(fields))
        insert_sql = f"INSERT INTO {table} ({', '.join(fields)}) VALUES ({placeholders})"
        
        # 执行插入
        db.execute(insert_sql, tuple(data.values()))
        db.commit()
        
        # 记录行为
        if "email" in data and "behavior" in data and "created_at" in data:
            record_behavior(data["email"], data["behavior"], data["created_at"], None)
        
        return True, "数据插入成功！"
    except sqlite3.Error as e:
        db.rollback()
        return False, f"数据库错误：{str(e)}（表：{table}）"
    except Exception as e:
        return False, f"插入失败：{str(e)}"
    finally:
        db.close()