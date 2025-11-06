import streamlit as st
from config.settings import settings
from models.data import save_feedback
from services.experiment_service import get_experiments


def vote_dialog():
    with st.form("vote_form", clear_on_submit=True):
        st.write("请为我们的平台提供反馈")
        vote = st.slider("评分", 1, 5, 3)
        comment = st.text_area("您的建议", "")
        submitted = st.form_submit_button("提交")
        
        if submitted:
            save_feedback(str(vote), comment)
            st.toast("感谢您的反馈！")


# 标题
st.title(settings.PAGE_CONFIG["title"])

# 使用说明
st.markdown("""
    ### 欢迎使用阅读实验平台
    
    请按照以下步骤参与实验：
    
    1. **登记信息**：点击左侧导航栏中的 "信息注册"，填写个人基本信息
    2. **加入实验**：完成信息注册后，系统将自动为您分配阅读材料
    3. **阅读材料**：点击左侧导航栏中的 "材料阅读"，查看并阅读分配给您的材料
    
    如有任何问题，请联系平台管理员。
    """)

st.divider()

# 实验统计信息
st.subheader("实验统计")
# 获取实验统计数据
status, experiments, msg = get_experiments()
if not status:
    st.error(f"获取实验统计信息失败: {msg}")
else:
    # 显示统计卡片
    col1, col2 = st.columns(2)
    with col1:
        st.metric("总实验数", len(experiments) if experiments is not None else 0)
    with col2:
        st.badge("最新实验")
        st.write(experiments[-1]["experiment_name"] if experiments is not None and len(experiments) > 0 else "暂无最新实验")

st.divider()

# 联系信息
st.markdown("### 联系我们")
st.markdown(f"""
    **联系人**：管理员
    **联系方式**：[{settings.ADMIN_EMAIL}](mailto:{settings.ADMIN_EMAIL})
    """)

# 反馈按钮
if st.button("💬 给我们反馈", width="content"):
    vote_dialog()
