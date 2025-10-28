import streamlit as st
from utils.data import validate_user
from datetime import datetime


st.title("🔍 材料阅读")

# 初始化session_state
if "username" not in st.session_state:
    st.session_state["username"] = None

# 根据登录状态显示不同内容
if st.session_state["username"] is None:
    with st.form("login_form"):
        email = st.text_input(label="请输入您的邮箱以验证身份", key="email")
        submit_button = st.form_submit_button(label="确认")

        if submit_button:
            if not email.strip():
                st.warning("邮箱不能为空，请输入！")
            else:
                status, result = validate_user(email, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
                if status:
                    st.session_state["username"] = result  # 存储用户名
                    st.success(f"验证成功！欢迎，{result}")
                    st.rerun()
                else:
                    # 验证失败：显示错误信息
                    st.warning(result)
else:
    st.success(f"欢迎回来，{st.session_state['username']}！")
    
    st.subheader("阅读材料列表")
    st.write("请选择下方材料进行阅读：")
    material = st.selectbox(
        "选择阅读材料",
        options=["材料1：XXX研究", "材料2：YYY报告", "材料3：ZZZ论文"],
        placeholder="请选择..."
    )
    if material:
        st.info(f"您选择了：{material}（此处可嵌入材料内容）")