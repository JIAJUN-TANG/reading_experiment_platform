import streamlit as st
from utils.user import validate_user
from utils.data import check_assignments, get_statistics
from datetime import datetime


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
    status, assignments = check_assignments(st.session_state["email"])
    read_status, statistics = get_statistics(st.session_state["email"])
    
    if read_status:
        col1, col2 = st.columns(2)
        with col1:
            st.metric(
            label="已阅读",
            value=statistics[2],
            border=True
                )
        with col2:
            st.metric(
            label="待阅读",
            value=statistics[4],
            border=True
                )
    else:
        st.warning(statistics)
                
    if not status:
        # 显示查询错误
        st.error(f"材料查询失败：{assignments}")
    else:
        if not assignments:
            st.toast(body="您的阅读材料已全部完成，感谢！", icon="🎉")
        else:
            material_options = [item[1] for item in assignments]  # 提取材料名称
            
            st.subheader("您的阅读材料列表")
            st.write("请选择下方材料进行阅读：")
            material = st.selectbox(
                "选择阅读材料",
                options=material_options,
                placeholder="请选择..."
            )
            
            if material:
                st.info(f"您选择了：{material}\n\n（此处可嵌入材料正文内容）")