import streamlit as st
import time
from datetime import datetime
from utils.data import save_feedback
from module.manage_module import statistic_experiment_page


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

st.title("欢迎参与阅读实验！")

st.markdown("### 1.登记信息")
st.markdown("在**第一次使用**时，请先于信息注册页面登记个人基本信息，并选择希望加入的实验项目。")

st.markdown("### 2.加入实验")
st.markdown("选择您想参与的实验项目，待研究人员审批通过后方可正式开始实验。")

st.markdown("### 3.阅读材料")
st.markdown("研究人员会根据要求使用系统自动分发需要阅读的实验材料，在阅读前**请先输入邮箱登记**。")

st.divider()
statistic_experiment_page()
st.divider()

st.markdown("#### 联系我们")
st.markdown("如您在实验过程中有任何疑问，请随时联系研究人员：")
st.markdown("邮箱：-，电话：-")
st.markdown("如您在使用过程中有任何疑问，请随时联系开发人员：")
st.markdown("邮箱：[jiajuntang1101@smail.nju.edu.cn](jiajuntang1101@smail.nju.edu.cn)，电话：16680808521")
feedback_button = st.button(label="在此反馈", type="secondary")
if feedback_button:
    vote()
