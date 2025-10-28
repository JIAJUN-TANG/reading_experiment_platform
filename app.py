import streamlit as st
from utils.init import init_user_db, init_experiment_db


st.set_page_config(
    page_title="AI科普阅读平台",
    page_icon="📄",
    layout="wide"
)

with st.spinner("正在初始化系统...", show_time=True):
    init_user_db()
    init_experiment_db()

pg = st.navigation([
        st.Page("pages/1_homepage.py", title="主页", icon="🏠"),
        st.Page("pages/2_information.py", title="信息登记", icon="📰"),
        st.Page("pages/3_reading.py", title="材料阅读", icon="🔍"),
    ])
pg.run()