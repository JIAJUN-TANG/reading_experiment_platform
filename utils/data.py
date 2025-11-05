import sqlite3
import json
import os
from typing import Optional, Tuple, Union, List


def save_feedback(feedback, feedback_time) -> tuple[bool, str]:
    """
    保存用户反馈到JSON文件
    """
    feedback_path = "./data/feedback.json"  # 目标文件路径
    try:
        # 确保data目录存在（不存在则创建）
        os.makedirs(os.path.dirname(feedback_path), exist_ok=True)
        
        # 读取现有反馈
        existing_feedbacks = []
        if os.path.exists(feedback_path):
            with open(feedback_path, "r", encoding="utf-8") as f:
                try:
                    existing_feedbacks = json.load(f)  # 加载现有数据
                    # 确保读取的是列表（防止文件内容格式错误）
                    if not isinstance(existing_feedbacks, list):
                        existing_feedbacks = []
                except json.JSONDecodeError:
                    # 若文件损坏，重置为空列表
                    existing_feedbacks = []
        
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
                ensure_ascii=False,  # 支持中文显示
                indent=2  # 格式化输出，便于人工查看
            )
        
        return True, "反馈成功！"
    
    except Exception as e:
        # 捕获所有异常（如权限错误、路径错误等）
        return False, f"反馈失败：{str(e)}"
    
def record_behavior(email, action, act_time, target):
    """记录用户行为"""
    
    # 连接数据库
    conn = sqlite3.connect("./data/users.db")
    c = conn.cursor()

    try:
        # 插入新行为
        c.execute(
            "INSERT INTO behaviors (email, action, act_at, target) VALUES (?, ?, ?, ?)",
            (email, action, act_time, target)
        )
        conn.commit()
    
    except Exception as e:
        return False, f"行为记录失败：{str(e)}"
    
    finally:
        conn.close()

def get_info(db: str, table: str) -> tuple[bool, list[str] | None, list[tuple] | str]:
    conn = None
    try:
        # 连接数据库
        conn = sqlite3.connect(f"./data/{db}.db")
        c = conn.cursor()

        # 查询所有用户
        c.execute(f"SELECT * FROM {table}")
        results = c.fetchall()  # 获取所有匹配记录
        
        # 获取列名（通过cursor.description提取字段名）
        columns = [desc[0] for desc in c.description]

        if results:
            # 有匹配记录：返回True、列名、数据
            return True, columns, results
        else:
            # 无匹配记录：仍返回列名（确保表格有表头），数据为空列表
            return True, columns, []

    except sqlite3.Error as e:
        # 数据库错误
        return False, None, f"数据库错误：{str(e)}"
    except Exception as e:
        # 其他未知错误
        return False, None, f"查询失败：{str(e)}"
    finally:
        # 确保连接关闭
        if conn:
            conn.close()

def delete_data(db: str, table: str, field: str, id: str):
    conn = None
    try:
        # 连接数据库
        conn = sqlite3.connect(f"./data/{db}.db")
        c = conn.cursor()

        # 先检查记录是否存在
        c.execute(f"SELECT 1 FROM {table} WHERE {field} = ?", (id,))
        exists = c.fetchone()

        if not exists:
            # 记录不存在
            return False, f"错误：{table}表中不存在{field}为{id}的记录"

        # 执行删除操作（使用参数化查询防止SQL注入）
        c.execute(f"DELETE FROM {table} WHERE {field} = ?", (id,))
        conn.commit()  # 提交事务

        # 返回删除成功信息（影响的行数）
        return True, f"成功删除{table}表中{field}为{id}的记录，影响行数：{c.rowcount}"

    except sqlite3.Error as e:
        # 数据库错误（回滚事务）
        if conn:
            conn.rollback()
        return False, f"数据库错误：{str(e)}"
    except Exception as e:
        # 其他未知错误
        return False, f"删除失败：{str(e)}"
    finally:
        # 确保连接关闭
        if conn:
            conn.close()

def insert_data(
    db: str, 
    table: str, 
    data: dict, 
    primary_key: Optional[Union[str, List[str]]]
) -> Tuple[bool, str]:
    """
    通用数据库插入函数
    
    参数:
        db: 数据库文件名
        table: 目标表名
        data: 插入的数据字典（键为字段名，值为字段值）
        primary_key: 用于查重的主键字段名（支持单个字段或复合主键列表）
    
    返回:
        Tuple[bool, str]: (是否成功, 提示信息)
    """
    conn = None
    try:
        # 检查主键字段是否都在数据中
        if isinstance(primary_key, list):
            # 复合主键：检查每个字段是否存在
            missing_keys = [key for key in primary_key if key not in data]
            if missing_keys:
                return False, f"错误：主键字段「{', '.join(missing_keys)}」未在数据中找到"
        else:
            # 检查字段是否存在
            if primary_key is not None and primary_key not in data:
                return False, f"错误：主键字段「{primary_key}」未在数据中找到"

        # 连接数据库
        conn = sqlite3.connect(f"./data/{db}.db")
        c = conn.cursor()

        # 查重逻辑
        if primary_key is not None:
            if isinstance(primary_key, list):
                # 复合主键查重
                where_clause = " AND ".join([f"{key} = ?" for key in primary_key])
                primary_values = tuple(data[key] for key in primary_key)
                
                c.execute(
                    f"SELECT 1 FROM {table} WHERE {where_clause}",
                    primary_values
                )
                if c.fetchone():
                    key_str = ", ".join([f"{key}={data[key]}" for key in primary_key])
                    return False, f"数据已存在：主键组合「{key_str}」已被使用"
            else:
                # 单个主键查重
                c.execute(
                    f"SELECT {primary_key} FROM {table} WHERE {primary_key} = ?",
                    (data[primary_key],)
                )
                if c.fetchone():
                    return False, f"数据已存在：主键「{primary_key}={data[primary_key]}」已被使用"

        # 构建插入SQL
        fields = list(data.keys())
        placeholders = ", ".join(["?"] * len(fields))
        insert_sql = f"INSERT INTO {table} ({', '.join(fields)}) VALUES ({placeholders})"
        
        # 执行插入
        c.execute(insert_sql, tuple(data.values()))
        conn.commit()
        
        if "email" in data and "behavior" in data and "created_at" in data:
            record_behavior(data["email"], data["behavior"], data["created_at"], None)
        
        success_msg = "数据插入成功！"
        return True, success_msg
    
    except sqlite3.Error as e:
        if conn:
            conn.rollback()
        return False, f"数据库错误：{str(e)}（表：{table}）"
    except Exception as e:
        return False, f"插入失败：{str(e)}"
    finally:
        if conn:
            conn.close()