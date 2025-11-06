from typing import Optional, Tuple, Dict, Any, List
from datetime import datetime
from models.db import Database
from models.data import insert_data, get_info, record_behavior


def create_experiment(experiment_name: str, content: str, author: str, started_at: datetime, ended_at: datetime) -> Tuple[bool, str]:
    """
    创建新实验
    
    Args:
        experiment_data: 实验数据字典
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    
    # 验证时间逻辑
    try:
        if started_at > ended_at:
            return False, "实验结束时间必须在开始时间之后！"
    except ValueError:
        return False, "日期格式错误，请使用YYYY-MM-DD格式"
    
    # 调用数据层插入实验
    return insert_data(
        db_name="experiments",
        table="experiments",
        data={
            "experiment_name": experiment_name.strip(),
            "content": content.strip(),
            "author": author.strip(),
            "started_at": started_at,
            "ended_at": ended_at,
            "visible": "true",
            "user_group": 0,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        },
        primary_key="experiment_name"
    )


def get_experiments() -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取所有实验列表
    
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: (是否成功, 实验列表, 错误信息)
    """
    status, columns, results = get_info("experiments", "experiments")
    
    if not status:
        return False, None, str(columns)
    
    # 转换为字典列表
    experiments = []
    for row in results:
        experiment = {}
        if columns is None:
            return False, None, "列信息为空"
        for i, col in enumerate(columns):
            experiment[col] = row[i]
        experiments.append(experiment)
    
    return True, experiments, ""


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
    if not db.connect():
        return None
    
    try:
        db.execute("SELECT * FROM experiments WHERE experiment_name = ?", (experiment_name.strip(),))
        result = db.fetchone()
        
        if result:
            columns = db.get_columns()
            return dict(zip(columns, result))
        return None
    except Exception as e:
        print(f"获取实验信息失败：{str(e)}")
        return None
    finally:
        db.close()


def create_material(experiment_name: str, material_name: str, AI_funtion: List[str], content: str, author: str, image: Optional[bytes] = None, video: Optional[bytes] = None, audio: Optional[bytes] = None) -> Tuple[bool, str]:
    """
    创建实验材料
    
    Args:
        experiment_name: 实验名称
        material_name: 材料名称
        content: 材料内容
        author: 作者
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """

    material_data = {
        "experiment_name": experiment_name.strip(),
        "material_name": material_name.strip(),
        "ai_function": ", ".join(AI_funtion),
        "content": content.strip(),
        "author": author.strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "user_group": 0,
        "image": image,
        "video": video,
        "audio": audio
    }
    # 调用数据层插入材料
    return insert_data(
        db_name="experiments",
        table="materials",
        data=material_data,
        primary_key=["experiment_name", "material_name"]
    )


def get_materials(experiment_name: Optional[str] = None) -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取材料列表
    
    Args:
        experiment_name: 可选的实验名称过滤条件
        
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: (是否成功, 材料列表, 错误信息)
    """
    db = Database("experiments")
    if not db.connect():
        return False, None, "数据库连接失败"
    
    try:
        if experiment_name:
            db.execute("SELECT * FROM materials WHERE experiment_name = ?", (experiment_name,))
        else:
            db.execute("SELECT * FROM materials")
        
        results = db.fetchall()
        columns = db.get_columns()
        
        # 转换为字典列表
        materials = []
        for row in results:
            material = {}
            for i, col in enumerate(columns):
                material[col] = row[i]
            materials.append(material)
        
        return True, materials, ""
    except Exception as e:
        return False, None, f"获取材料列表失败：{str(e)}"
    finally:
        db.close()


def assign_material_to_user(email: str, material_name: str, author: str, started_at: datetime, ended_at: datetime) -> Tuple[bool, str]:
    """
    分配材料给用户
    
    Args:
        email: 用户邮箱
        material_name: 材料名称
        author: 作者
        started_at: 开始日期
        ended_at: 结束日期
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    assignment_data = {
        "email": email.strip(),
        "material_name": material_name.strip(),
        "status": 0,
        "author": author.strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "completed_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "started_at": started_at,
        "ended_at": ended_at
    }
    # 调用数据层插入分配记录
    return insert_data(
        db_name="experiments",
        table="assignments",
        data=assignment_data,
        primary_key=["email", "material_name"]
    )


def get_user_assignments(email: str) -> Tuple[bool, Optional[List[Dict[str, Any]]], str]:
    """
    获取用户的材料分配列表
    
    Args:
        email: 用户邮箱
        
    Returns:
        Tuple[bool, Optional[List[Dict[str, Any]]], str]: (是否成功, 分配列表, 错误信息)
    """
    db = Database("experiments")
    if not db.connect():
        return False, None, "数据库连接失败"
    
    try:
        db.execute("SELECT * FROM assignments WHERE email = ?", (email,))
        results = db.fetchall()
        columns = db.get_columns()
        
        # 转换为字典列表
        assignments = []
        for row in results:
            assignment = {}
            for i, col in enumerate(columns):
                assignment[col] = row[i]
            assignments.append(assignment)
        
        return True, assignments, ""
    except Exception as e:
        return False, None, f"获取分配列表失败：{str(e)}"
    finally:
        db.close()


def read_assignment(email: str, material_name: str, status: int) -> Tuple[bool, str]:
    """
    获取材料详情并记录用户点击阅读行为
    
    Args:
        email: 用户邮箱
        material_name: 材料名称
        status: 状态值（0: 正在阅读, 1: 已完成）
        
    Returns:
        Tuple[bool, str]: (是否成功, 消息)
    """
    db = Database("experiments")
    if not db.connect():
        return False, "数据库连接失败"
    
    try:
        # 开始事务
        db.execute("BEGIN TRANSACTION")
        
        # 更新分配状态
        db.execute(
            """
            UPDATE assignments 
            SET status = ?
            WHERE email = ? AND material_name = ?
            """,
            (status, email, material_name)
        )
        
        # 记录阅读行为
        record_behavior(email=email, action="reading_start", act_time=datetime.now().strftime("%Y-%m-%d %H:%M:%S"), target=material_name)

        # 提交事务
        db.commit()
        return True, "状态更新和行为记录成功"
    except Exception as e:
        db.rollback()
        return False, f"操作失败：{str(e)}"
    finally:
        db.close()


def get_material_by_name(material_name: str) -> Tuple[bool, Dict[str, Any], str]:
    """
    根据实验名称和材料名称获取材料详情
    
    Args:
        experiment_name: 实验名称
        material_name: 材料名称
        
    Returns:
        Tuple[bool, Dict[str, Any], str]: (是否成功, 材料详情, 错误信息)
    """
    db = Database("experiments")
    if not db.connect():
        return False, {}, "数据库连接失败"
    
    try:
        db.execute(
            "SELECT * FROM materials WHERE material_name = ?",
            (material_name,)
        )
        result = db.fetchone()
        
        if not result:
            return False, {}, "未找到指定材料"
        
        columns = db.get_columns()
        material = dict(zip(columns, result))
        return True, material, ""
    except Exception as e:
        return False, {}, f"获取材料失败: {str(e)}"
    finally:
        db.close()