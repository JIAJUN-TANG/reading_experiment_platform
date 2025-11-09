import sqlite3
import re
from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime
from models.db import Database
from models.data import insert_data, record_behavior


def create_experiment(experiment_name: str, content: str, author: str, started_at: datetime, ended_at: datetime) -> Tuple[bool, str]:
    """
    创建新实验
    
    Args:
        experiment_name: 实验名称
        content: 实验内容描述
        author: 作者
        started_at: 开始时间
        ended_at: 结束时间
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    # 参数验证
    if not experiment_name or not experiment_name.strip():
        return False, "实验名称不能为空"
    
    if not content or not content.strip():
        return False, "实验内容不能为空"
    
    if not author or not author.strip():
        return False, "作者不能为空"
    
    if started_at is None or ended_at is None:
        return False, "开始时间和结束时间不能为空"
    
    # 验证时间逻辑
    if started_at > ended_at:
        return False, "实验结束时间必须在开始时间之后"
    
    db = Database("experiments")
    
    try:
        if not db.connect():
            return False, "数据库连接失败"
        
        # 检查实验是否已存在
        db.execute("SELECT 1 FROM experiments WHERE experiment_name = ?", (experiment_name.strip(),))
        if db.fetchone():
            return False, "实验名称已存在"
        
        # 插入实验
        query = """
            INSERT INTO experiments (
                experiment_name, content, author, started_at, ended_at,
                visible, user_group, created_at, description, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if db.execute(query, (
            experiment_name.strip(),
            content.strip(),
            author.strip(),
            started_at,
            ended_at,
            1,  # visible
            0,  # user_group
            current_time,
            content.strip(),  # description
            1   # is_active
        )):
            db.commit()
            return True, "实验创建成功"
        else:
            db.rollback()
            return False, "实验创建失败"
    except sqlite3.Error as e:
        print(f"创建实验数据库错误: {str(e)}")
        if db:
            db.rollback()
        return False, f"数据库错误: {str(e)}"
    except Exception as e:
        print(f"创建实验失败: {str(e)}")
        if db:
            db.rollback()
        return False, str(e)
    finally:
        if db:
            db.close()


def get_experiments() -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取所有实验列表
    
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: (是否成功, 实验列表, 错误信息)
    """
    db = Database("experiments")
    
    try:
        if not db.connect():
            return False, None, "数据库连接失败"
        
        db.execute("SELECT * FROM experiments ORDER BY id DESC")
        results = db.fetchall()
        
        return True, results, ""
    except sqlite3.Error as e:
        print(f"获取实验列表失败: {str(e)}")
        return False, None, f"数据库错误: {str(e)}"
    except Exception as e:
        print(f"获取实验列表失败: {str(e)}")
        return False, None, str(e)
    finally:
        if db:
            db.close()


def get_experiment_by_name(experiment_name: str) -> Optional[Dict[str, Any]]:
    """
    根据名称获取实验信息
    
    Args:
        experiment_name: 实验名称
        
    Returns:
        Optional[Dict[str, Any]]: 实验信息字典或None
    """
    if not experiment_name or not experiment_name.strip():
        return None
    
    db = Database("experiments")
    
    try:
        if not db.connect():
            return None
        
        db.execute("SELECT * FROM experiments WHERE experiment_name = ?", (experiment_name.strip(),))
        result = db.fetchone()
        
        # 验证结果是否为字典类型
        if isinstance(result, dict):
            return result
        return None
    except Exception as e:
        print(f"获取实验信息失败: {str(e)}")
        return None
    finally:
        if db:
            db.close()


def create_material(experiment_name: str, material_name: str, AI_funtion: List[str], content: str, author: str, image: Optional[bytes] = None, video: Optional[bytes] = None, audio: Optional[bytes] = None) -> Tuple[bool, str]:
    """
    创建实验材料
    
    Args:
        experiment_name: 实验名称
        material_name: 材料名称
        AI_funtion: AI功能列表
        content: 材料内容
        author: 作者
        image: 可选的图像数据
        video: 可选的视频数据
        audio: 可选的音频数据
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    # 参数验证
    if not experiment_name or not experiment_name.strip():
        return False, "实验名称不能为空"
    
    if not material_name or not material_name.strip():
        return False, "材料名称不能为空"
    
    if not AI_funtion or not isinstance(AI_funtion, list):
        return False, "AI功能列表不能为空且必须为列表类型"
    
    if not content or not content.strip():
        return False, "材料内容不能为空"
    
    if not author or not author.strip():
        return False, "作者不能为空"
    
    db = Database("experiments")
    
    try:
        if not db.connect():
            return False, "数据库连接失败"
        
        # 检查材料是否已存在
        db.execute(
            "SELECT 1 FROM materials WHERE experiment_name = ? AND material_name = ?",
            (experiment_name.strip(), material_name.strip())
        )
        if db.fetchone():
            return False, "该实验下已存在同名材料"
        
        # 插入材料
        query = """
            INSERT INTO materials (
                experiment_name, material_name, ai_function, content, author,
                created_at, user_group, image, video, audio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        if db.execute(query, (
            experiment_name.strip(),
            material_name.strip(),
            ", ".join(AI_funtion),
            content.strip(),
            author.strip(),
            current_time,
            0,  # user_group
            image,
            video,
            audio
        )):
            db.commit()
            return True, "材料创建成功"
        else:
            db.rollback()
            return False, "材料创建失败"
    except sqlite3.Error as e:
        print(f"创建材料数据库错误: {str(e)}")
        if db:
            db.rollback()
        return False, f"数据库错误: {str(e)}"
    except Exception as e:
        print(f"创建材料失败: {str(e)}")
        if db:
            db.rollback()
        return False, str(e)
    finally:
        if db:
            db.close()


def get_materials(experiment_name: Optional[str] = None) -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取材料列表
    
    Args:
        experiment_name: 可选的实验名称过滤条件
        
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: (是否成功, 材料列表, 错误信息)
    """
    db = Database("experiments")
    
    try:
        if not db.connect():
            return False, None, "数据库连接失败"
        
        if experiment_name and experiment_name.strip():
            db.execute("SELECT * FROM materials WHERE experiment_name = ?", (experiment_name.strip(),))
        else:
            db.execute("SELECT * FROM materials")
        
        results = db.fetchall()
        
        return True, results, ""
    except sqlite3.Error as e:
        print(f"获取材料列表失败: {str(e)}")
        return False, None, f"数据库错误: {str(e)}"
    except Exception as e:
        print(f"获取材料列表失败: {str(e)}")
        return False, None, str(e)
    finally:
        if db:
            db.close()


def get_material_by_name(material_name: str) -> Optional[Dict[str, Any]]:
    """
    根据名称获取材料信息
    
    Args:
        material_name: 材料名称
        
    Returns:
        Optional[Dict[str, Any]]: 材料信息字典或None
    """
    if not material_name or not material_name.strip():
        return None
    
    db = Database("experiments")
    
    try:
        if not db.connect():
            return None
        
        db.execute("SELECT * FROM materials WHERE material_name = ?", (material_name.strip(),))
        result = db.fetchone()
        
        # 验证结果类型
        if isinstance(result, dict):
            return result
        return None
    except sqlite3.Error as e:
        print(f"获取材料信息数据库错误: {str(e)}")
        return None
    except Exception as e:
        print(f"获取材料信息失败: {str(e)}")
        return None
    finally:
        if db:
            db.close()


def assign_material_to_user(email: str, material_name: str, author: str, started_at: datetime, ended_at: datetime) -> Tuple[bool, str]:
    """
    分配材料给用户
    
    Args:
        email: 用户邮箱
        material_name: 材料名称
        author: 作者
        started_at: 开始时间
        ended_at: 结束时间
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    # 参数验证
    if not email or not email.strip():
        return False, "用户邮箱不能为空"
    
    if not material_name or not material_name.strip():
        return False, "材料名称不能为空"
    
    if not author or not author.strip():
        return False, "作者不能为空"
    
    if started_at is None or ended_at is None:
        return False, "开始时间和结束时间不能为空"
    
    # 验证时间逻辑
    if started_at > ended_at:
        return False, "结束时间必须在开始时间之后"
    
    db = Database("experiments")
    
    try:
        if not db.connect():
            return False, "数据库连接失败"
        
        # 检查材料是否存在
        db.execute("SELECT * FROM materials WHERE material_name = ?", (material_name.strip(),))
        material = db.fetchone()
        if not material:
            return False, "材料不存在"
        
        # 检查是否已分配
        db.execute(
            "SELECT 1 FROM assignments WHERE email = ? AND material_name = ?",
            (email.strip(), material_name.strip())
        )
        if db.fetchone():
            return False, "材料已分配给该用户"
        
        # 插入分配记录
        query = """
            INSERT INTO assignments (
                email, material_name, author, started_at, ended_at,
                created_at, completed_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        assignment_data = {
            "email": email.strip(),
            "material_name": material_name.strip(),
            "author": author.strip(),
            "started_at": started_at,
            "ended_at": ended_at,
            "created_at": current_time,
            "completed_at": None,
            "status": 0
        }
        
        if db.execute(query, (
            assignment_data["email"],
            assignment_data["material_name"],
            assignment_data["author"],
            assignment_data["started_at"],
            assignment_data["ended_at"],
            assignment_data["created_at"],
            assignment_data["completed_at"],
            assignment_data["status"]
        )):
            db.commit()
            return True, "材料分配成功"
        else:
            db.rollback()
            return False, "材料分配失败"
    except sqlite3.Error as e:
        print(f"分配材料数据库错误: {str(e)}")
        if db:
            db.rollback()
        return False, f"数据库错误: {str(e)}"
    except Exception as e:
        print(f"分配材料失败: {str(e)}")
        if db:
            db.rollback()
        return False, str(e)
    finally:
        if db:
            db.close()


def get_assignments() -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取材料列表
    
    Args:
        experiment_name: 可选的实验名称过滤条件
        
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: (是否成功, 材料列表, 错误信息)
    """
    db = Database("experiments")
    
    try:
        if not db.connect():
            return False, None, "数据库连接失败"
        
        else:
            db.execute("SELECT * FROM assignments")
        
        results = db.fetchall()
        
        return True, results, ""
    except sqlite3.Error as e:
        print(f"获取分配列表失败: {str(e)}")
        return False, None, f"数据库错误: {str(e)}"
    except Exception as e:
        print(f"获取分配列表失败: {str(e)}")
        return False, None, str(e)
    finally:
        if db:
            db.close()


def get_user_assignments(email: str) -> Tuple[bool, List[Dict[str, Any]], str]:
    """
    获取用户的材料分配列表
    
    Args:
        email: 用户邮箱
        
    Returns:
        Tuple[bool, List[Dict[str, Any]], str]: (是否成功, 分配列表, 错误信息)
    """
    # 参数验证
    if not email or not email.strip():
        return False, [], "用户邮箱不能为空"
    
    db = Database("experiments")
    assignments = []
    
    try:
        if not db.connect():
            return False, [], "数据库连接失败"
        
        # 使用JOIN查询获取材料信息和分配信息
        query = """
            SELECT a.*, m.content, m.author as material_author, m.experiment_name
            FROM assignments a
            LEFT JOIN materials m ON a.material_name = m.material_name
            WHERE a.email = ?
            ORDER BY a.created_at DESC
        """
        
        if db.execute(query, (email.strip(),)):
            results = db.fetchall()
            
            # 状态码映射
            status_map = {
                0: "未开始",
                1: "已完成",
                2: "阅读中"
            }
            
            for row in results:
                if isinstance(row, dict):
                    # 添加材料内容和状态文本
                    assignment = row.copy()
                    assignment["status_text"] = status_map.get(assignment.get("status", 0), "未知")
                    assignments.append(assignment)
    except sqlite3.Error as e:
        print(f"获取用户分配列表数据库错误: {str(e)}")
        return False, [], f"数据库错误: {str(e)}"
    except Exception as e:
        print(f"获取用户分配列表失败: {str(e)}")
        return False, [], str(e)
    finally:
        if db:
            db.close()
    
    return True, assignments, ""


def read_assignment(
    email: str, 
    material_name: str, 
    status: int,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
) -> Tuple[bool, str]:
    """
    更新阅读任务状态
    
    Args:
        email: 用户邮箱
        material_name: 材料名称
        status: 状态码 (0: 未开始, 1: 已完成, 2: 阅读中)
        ip_address: IP地址
        user_agent: 用户代理
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    # 参数验证
    if not email or not email.strip():
        return False, "用户邮箱不能为空"
    
    if not material_name or not material_name.strip():
        return False, "材料名称不能为空"
    
    # 验证状态值范围
    if status not in [0, 1, 2]:
        return False, "无效的状态值"
    
    db = Database("experiments")
    user_db = Database("users")
    
    try:
        if not db.connect():
            return False, "数据库连接失败"
        
        # 开始事务
        db.execute("BEGIN TRANSACTION")
        
        # 检查分配记录是否存在
        db.execute(
            "SELECT 1 FROM assignments WHERE email = ? AND material_name = ?",
            (email.strip(), material_name.strip())
        )
        if not db.fetchone():
            raise ValueError("分配记录不存在")
        
        # 更新状态
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        update_fields = ["status = ?", "updated_at = ?"]
        update_params = [status, current_time]
        
        # 如果状态为已完成，更新completed_at
        if status == 2:
            update_fields.append("completed_at = ?")
            update_params.append(current_time)
        
        query = f"""
            UPDATE assignments 
            SET {', '.join(update_fields)} 
            WHERE email = ? AND material_name = ?
        """
        update_params.extend([email.strip(), material_name.strip()])
        
        if not db.execute(query, tuple(update_params)):
            raise ValueError("更新失败")
        
        # 记录行为
        behavior_data = {
            "email": email.strip(),
            "action": "read",
            "target": material_name.strip(),
            "ip_address": ip_address or "unknown",
            "user_agent": user_agent or "unknown",
        }
        
        behavior_query = """
            INSERT INTO behaviors (
                email, action, target, 
                ip_address, user_agent
            ) VALUES (?, ?, ?, ?, ?)
        """
        
        if not user_db.execute(behavior_query, (
            behavior_data["email"],
            behavior_data["action"],
            behavior_data["target"],
            behavior_data["ip_address"],
            behavior_data["user_agent"],
        )):
            raise ValueError("记录行为失败")
        
        # 提交事务
        db.commit()
        user_db.commit()
        
        # 状态文本映射
        status_map = {
            0: "未开始",
            1: "已完成",
            2: "阅读中"
        }
        
        return True, f"状态已更新为: {status_map[status]}"
        
    except sqlite3.Error as e:
        print(f"更新阅读状态数据库错误: {str(e)}")
        if db:
            db.rollback()
        if user_db:
            user_db.rollback()
        return False, f"数据库错误: {str(e)}"
    except Exception as e:
        print(f"更新阅读状态失败: {str(e)}")
        if db:
            db.rollback()
        if user_db:
            user_db.rollback()
        return False, str(e)
    finally:
        if db:
            db.close()
        if user_db:
            user_db.close()