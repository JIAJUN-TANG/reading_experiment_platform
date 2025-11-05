import streamlit as st
from utils.user import validate_user
from utils.data import get_info
from datetime import datetime
import pandas as pd


st.title("🔍 材料阅读")

# 初始化session_state
if "username" not in st.session_state: 
    st.session_state["username"] = None  # 未登录时为None
if "email" not in st.session_state: 
    st.session_state["email"] = None  # 未登录时为None


# 登录状态判断
if st.session_state["username"] in [None, ""]:
    with st.form("login_form"):
        email = st.text_input(
            label="请输入您的邮箱以验证身份", 
            value=st.session_state["email"] or "",  # 保留已输入的邮箱
            key="email_input"
        )
        submit_button = st.form_submit_button(label="确认")

        if submit_button:
            email_clean = email.strip()
            if not email_clean:
                st.warning("邮箱不能为空，请输入！")
            else:
                status, result = validate_user(email_clean, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                
                if status:
                    # 验证成功：更新session状态
                    st.session_state["email"] = email_clean
                    st.session_state["username"] = result
                    st.success(f"验证成功！欢迎，{result}")
                    st.rerun()  # 刷新页面生效
                else:
                    # 显示具体错误信息
                    st.warning(result)

else:
    # 已登录状态
    st.markdown(f"欢迎回来，**{st.session_state['username']}**！")
    
    # 查询用户的材料分配
    status, assignment_columns, assignments = get_info("experiments", "assignments")
    mat_status, mat_columns, materials = get_info("experiments", "materials")

    if status and assignments:
        assignments = pd.DataFrame(assignments, columns=assignment_columns)
        materials = pd.DataFrame(materials, columns=mat_columns)
        read_count = assignments[assignments['status'] == 1].shape[0]
        remain_count = assignments[assignments['status'] == 0].shape[0]
        col1, col2 = st.columns(2)
        with col1:
            st.metric(
            label="已阅读",
            value=read_count,
            border=True
                )
        with col2:
            st.metric(
            label="待阅读",
            value=remain_count,
            border=True
                )
        
        st.divider()

        if remain_count > 0:
            st.markdown("### 您收到的阅读材料如下：")
            material_list = assignments["material_name"][assignments["status"] == 0].tolist()
            for idx, mat_name in enumerate(material_list):
                mat_info = materials[materials["material_name"] == mat_name].iloc[0]
                with st.expander(f"📄 {idx+1}-{mat_name}"):
                    st.markdown(f"**内容概述：** {mat_info['content']}")
                    st.markdown(f"**开始日期：** {assignments['started_at'][assignments['material_name'] == mat_name].values[0]}")
        else:
            st.success("您已完成所有阅读材料！感谢您的参与！")

    elif not status:
        # 显示查询错误
        st.error(f"材料查询失败：{assignments}")
    else:
        st.toast(body="您的阅读材料已全部完成，感谢！", icon="🎉")