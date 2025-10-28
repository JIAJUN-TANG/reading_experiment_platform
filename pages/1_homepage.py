import streamlit as st


st.title("欢迎参与科普阅读实验！")

st.markdown("### 1.登记信息")
st.markdown("在**第一次使用**时，请先于信息登记页面登记个人基本信息。")
st.page_link(st.Page("pages/2_information.py"), label="信息登记", icon="📰", help=None, disabled=False, width="content")

st.markdown("### 2.阅读材料")
st.markdown("系统会自动分发需要阅读的实验材料，在阅读前**请先输入邮箱登记**。")