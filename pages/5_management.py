import streamlit as st
import time
from datetime import datetime
from utils.user import save_feedback


@st.dialog("意见反馈")
def vote():
    st.write("您的意见对我们改进十分重要！")
    message = st.text_input(label="请输入您的意见")
    if st.button("提交"):
        st.session_state.vote = {"message": message}
        status, massage = save_feedback(message, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        if status:
            st.success(massage)
        else:
            st.warning(massage)
        time.sleep(1)
        st.rerun()

st.title("欢迎参与科普阅读实验！")

st.markdown("### 1.登记信息")
st.markdown("在**第一次使用**时，请先于信息登记页面登记个人基本信息。")
st.page_link(st.Page("pages/2_information.py"), label="信息登记", icon="📰", help=None, disabled=False, width="content")

st.markdown("### 2.阅读材料")
st.markdown("系统会自动分发需要阅读的实验材料，在阅读前**请先输入邮箱登记**。")
st.page_link(st.Page("pages/3_reading.py"), label="材料阅读", icon="🔍", help=None, disabled=False, width="content")

st.divider()

st.markdown("#### 联系我们")
st.markdown("如您在实验过程中有任何疑问，请随时联系研究人员：")
st.markdown("邮箱：[jiajuntang1101@smail.nju.edu.cn](jiajuntang1101@smail.nju.edu.cn)，电话：16680808521")
feedback_button = st.button(label="在此反馈", type="secondary")
if feedback_button:
    vote()
