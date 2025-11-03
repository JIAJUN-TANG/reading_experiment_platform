import streamlit as st
from utils.user import check_access
from module.manage_module import manage_participant_page, manage_experiment_page, manage_material_page, manage_assignment_page


def show_management_page():
    """登录成功后显示的项目管理页面内容"""
    
    tab1, tab2, tab3, tab4 = st.tabs(["👥 用户管理", "📖 实验管理", "📄 材料管理", "📧 分发管理"])

    # 用户管理
    with tab1:
        manage_participant_page()
    
    # 实验管理
    with tab2:
        manage_experiment_page()

    # 材料管理
    with tab3:
        manage_material_page()
    
    # 分发管理
    with tab4:
        manage_assignment_page()
    
    # 退出登录按钮
    if st.button("退出登录", type="secondary"):
        # 清除登录状态
        st.session_state.logged_in = False
        st.session_state.login_msg = "已退出登录"
        st.rerun()


# 页面主逻辑
st.title("📲 项目管理")

# 初始化session状态（临时存储登录信息，刷新页面后失效）
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False
if "current_username" not in st.session_state:
    st.session_state.current_username = ""
if "login_msg" not in st.session_state:
    st.session_state.login_msg = ""

# 显示登录消息
if st.session_state.login_msg and not st.session_state.logged_in:
    st.info(st.session_state.login_msg)
    st.session_state.login_msg = ""  # 显示后清除

# 创建内容占位符
content_placeholder = st.empty()

# 根据登录状态动态填充占位符内容
if not st.session_state.logged_in:
    # 未登录：在占位符中显示登录表单
    with content_placeholder.container():
        username = st.text_input(
            label="用户名", 
            placeholder="请输入管理员用户名", 
            key="username"
        )
        password = st.text_input(
            label="密码", 
            placeholder="请输入管理员密码", 
            key="password",
            type="password"
        )
        submit_button = st.button(label="登录", type="primary", key="submit_button")
        
        # 处理登录提交
        if submit_button:
            if not username or not  username.strip():
                st.warning("请输入用户名！")
            elif not password or  not password.strip():
                st.warning("请输入密码！")
            else:
                status, msg = check_access(username.strip(), password.strip())
                if status:
                    st.session_state.logged_in = True
                    st.session_state.current_username = username.strip()
                    st.rerun()
                else:
                    st.error(msg)
else:
    with content_placeholder.container():
        show_management_page()