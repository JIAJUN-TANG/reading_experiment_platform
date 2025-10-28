import sqlite3


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


def register_user(user_data):
    """注册新参与者信息，存入数据库"""

    # 连接数据库
    conn = sqlite3.connect("./data/users.db")
    c = conn.cursor()

    try:
        # 检查用户名是否已存在
        c.execute("SELECT email FROM users WHERE email = ?", (user_data["email"],))
        if c.fetchone():
            return False, "邮箱已存在，请更换"

        # 插入新用户
        c.execute(
            "INSERT INTO users (email, username, sex, age, degree, school, major, created_at, role, user_group) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (user_data["email"], user_data["username"], user_data["sex"], user_data["age"], user_data["degree"], user_data["school"], user_data["major"], user_data["created_at"], user_data["role"], 0)
        )
        conn.commit()
        record_behavior(user_data["email"], "register", user_data["created_at"], None)
        return True, "信息录入成功！"
    
    except Exception as e:
        return False, f"信息录入失败：{str(e)}"
    
    finally:
        conn.close()

def validate_user(email, act_at):
    """
    验证邮箱对应的用户是否已在数据库中注册
    
    参数：
        email: 用户输入的邮箱字符串
        
    返回：
        tuple: (状态, 信息) 
            - 状态为 True 时，信息为用户名（验证成功）
            - 状态为 False 时，信息为错误提示（验证失败）
    """
    conn = None
    try:
        conn = sqlite3.connect("./data/users.db")
        c = conn.cursor()

        c.execute("SELECT username FROM users WHERE email = ?", (email.strip(),))
        result = c.fetchone()

        if result:
            record_behavior(email, "login", act_at, None)
            return True, result[0]
        else:
            return False, "该邮箱未录入信息，请先完成个人信息填写"

    except sqlite3.Error as e:
        return False, f"数据库错误：{str(e)}"
    except Exception as e:
        return False, f"验证失败：{str(e)}"
    finally:
        if conn:
            conn.close()