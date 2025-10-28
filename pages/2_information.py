import streamlit as st
import re
from datetime import datetime
from utils.data import register_user


# 初始化session_state
def init_session_state():
    fields = [
        "email", "username", "sex", "age", "degree", 
        "school", "major", "role"
    ]
    for field in fields:
        if field not in st.session_state:
            st.session_state[field] = None if field != "role" else "参与者"


def is_valid_email(email):
    return re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email) is not None


# 初始化状态
init_session_state()

# 页面标题
st.subheader("个人信息填写")

# 输入组件区域
## 邮箱
st.session_state.email = st.text_input(
    label="邮箱", 
    value=st.session_state.email or "", 
    placeholder="请输入您的邮箱（用于登录）", 
    key="email_input"
)

## 姓名
st.session_state.username = st.text_input(
    label="姓名", 
    value=st.session_state.username or "", 
    placeholder="请输入您的真实姓名", 
    key="username_input"
)

## 性别（selectbox）
sex_options = ["男性", "女性"]
st.session_state.sex = st.selectbox(
    label="性别", 
    options=sex_options,
    index=sex_options.index(st.session_state.sex) if st.session_state.sex in sex_options else None,
    placeholder="请选择您的性别", 
    key="sex_select"
)

## 年龄（修改为selectbox，原范围1-100岁不变）
age_options = [f"{i}岁" for i in range(1, 101)]  # 生成带"岁"的选项（如"1岁"、"2岁"...）
# 处理当前年龄值（从session_state中提取数字，匹配选项）
current_age = st.session_state.age
# 计算索引：如果当前年龄存在，找到对应的"XX岁"选项索引；否则为None
age_index = age_options.index(f"{current_age}岁") if (current_age and f"{current_age}岁" in age_options) else None

st.session_state.age = st.selectbox(
    label="年龄", 
    options=age_options,  # 下拉选项为"1岁"到"100岁"
    index=age_index,
    placeholder="请选择您的年龄", 
    key="age_select"
)
# 从选择的"XX岁"中提取数字（方便后续存储）
if st.session_state.age:
    st.session_state.age = int(st.session_state.age.replace("岁", ""))

## 学历
st.session_state.degree = st.selectbox(
    label="学历", 
    options=["初中、中专及以下", "高中或高职", "本科或专科", "硕士研究生", "博士研究生"], 
    index=None if st.session_state.degree is None else [
        "初中、中专及以下", "高中或高职", "本科或专科", "硕士研究生", "博士研究生"
    ].index(st.session_state.degree),
    placeholder="请选择您的学历", 
    key="degree_select"
)

## 学校和专业（条件显示）
school_visible = st.session_state.degree in ["本科或专科", "硕士研究生", "博士研究生"]
if school_visible:
    st.session_state.school = st.text_input(
        label="学校", 
        value=st.session_state.school or "", 
        placeholder="请输入您的学校名称", 
        key="school_input"
    )
    st.session_state.major = st.text_input(
        label="专业", 
        value=st.session_state.major or "", 
        placeholder="请输入您的专业名称", 
        key="major_input"
    )
else:
    st.session_state.school = None
    st.session_state.major = None

## 角色
st.session_state.role = st.selectbox(
    label="用户角色", 
    options=["参与者"], 
    index=0,
    disabled=True,
    key="role_select"
)


# 信息预览区域
with st.expander("📋 已填写信息预览", expanded=False):
    info_items = [
        ("邮箱", st.session_state.email.strip() if st.session_state.email else "未填写"),
        ("姓名", st.session_state.username.strip() if st.session_state.username else "未填写"),
        ("性别", st.session_state.sex if st.session_state.sex else "未选择"),
        ("年龄", f"{st.session_state.age}岁" if st.session_state.age else "未选择"),  # 显示带"岁"的格式
        ("学历", st.session_state.degree if st.session_state.degree else "未选择")
    ]
    
    if school_visible:
        info_items.extend([
            ("学校", st.session_state.school.strip() if st.session_state.school else "未填写"),
            ("专业", st.session_state.major.strip() if st.session_state.major else "未填写")
        ])
    
    info_items.append(("用户角色", st.session_state.role))
    
    for label, value in info_items:
        if "未" in value:
            st.write(f"**{label}**：{st.markdown(f':red[{value}]')}")
        else:
            st.write(f"**{label}**：{value}")


# 提交按钮及验证
submit_clicked = st.button(label="提交信息", key="submit_btn")

if submit_clicked:
    error_messages = []
    email_val = (st.session_state.email or "").strip()
    username_val = (st.session_state.username or "").strip()
    
    if not email_val:
        error_messages.append("邮箱不能为空，请输入！")
    elif not is_valid_email(email_val):
        error_messages.append("邮箱格式不正确（示例：example@domain.com）")
    
    if not username_val:
        error_messages.append("姓名不能为空，请输入！")
    
    if not st.session_state.sex:
        error_messages.append("请选择性别！")
    
    if st.session_state.age is None:  # 验证年龄是否选择
        error_messages.append("请选择年龄！")
    
    if st.session_state.degree is None:
        error_messages.append("请选择学历！")
    
    if school_visible:
        school_val = (st.session_state.school or "").strip()
        major_val = (st.session_state.major or "").strip()
        if not school_val:
            error_messages.append("学校不能为空，请输入！")
        if not major_val:
            error_messages.append("专业不能为空，请输入！")
    
    if error_messages:
        st.error("提交失败，以下信息需要完善：")
        for msg in error_messages:
            st.error(f"• {msg}")
    else:
        user_data = {
            "email": email_val,
            "username": username_val,
            "sex": st.session_state.sex,
            "age": st.session_state.age,
            "degree": st.session_state.degree,
            "school": school_val if school_visible else None,
            "major": major_val if school_visible else None,
            "role": st.session_state.role,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        status, message = register_user(user_data)
        if status:
            st.success(message)
        else:
            st.warning(message)
        