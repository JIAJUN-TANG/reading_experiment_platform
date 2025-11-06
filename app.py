import streamlit as st
from config.settings import settings
from models.db import init_user_db, init_experiment_db


# 初始化页面配置
st.set_page_config(
    page_title=settings.PAGE_CONFIG["title"],
    page_icon=settings.PAGE_CONFIG["icon"],
    layout=settings.PAGE_CONFIG["layout"]  # type: ignore
)

# 确保目录结构存在
settings.ensure_directories()

# 初始化数据库
with st.spinner("正在初始化系统...", show_time=True):
    user_db_error = init_user_db()
    exp_db_error = init_experiment_db()
    
    if user_db_error:
        st.error(f"用户数据库初始化失败: {user_db_error}")
    if exp_db_error:
        st.error(f"实验数据库初始化失败: {exp_db_error}")

# 初始化session_state
if "username" not in st.session_state:
    st.session_state["username"] = None
if "email" not in st.session_state:
    st.session_state["email"] = None

# 创建导航页面
navigation_pages = []
for page_config in settings.NAVIGATION_PAGES:
    navigation_pages.append(
        st.Page(
            page_config["path"],
            title=page_config["title"],
            icon=page_config["icon"]
        )
    )

pg = st.navigation(navigation_pages)
pg.run()