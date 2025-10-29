import streamlit as st
from utils.init import init_user_db, init_experiment_db


# 初始化页面配置
st.set_page_config(
    page_title="实验平台",
    page_icon="📄",
    layout="wide"
)

# 初始化数据库
with st.spinner("正在初始化系统...", show_time=True):
    init_user_db()
    init_experiment_db()

# 初始化session_state（存储用户信息，确保登录状态可追溯）
if "username" not in st.session_state:
    st.session_state["username"] = None  # 未登录时为None


pg = st.navigation([
        st.Page("pages/1_homepage.py", title="主页", icon="🏠"),
        st.Page("pages/2_information.py", title="信息注册", icon="📰"),
        st.Page("pages/3_reading.py", title="材料阅读", icon="🔍"),
        st.Page("pages/4_publish.py", title="项目管理", icon="📲"),
        st.Page("pages/5_management.py", title="数据管理", icon="📊"),
    ])
pg.run()