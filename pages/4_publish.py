import streamlit as st
from config.settings import settings
from datetime import datetime
from services.user_service import check_access, get_all_users
from services.experiment_service import (
    create_experiment, get_experiments,
    create_material, get_materials,
    assign_material_to_user, get_assignments
)
from services.notification_service import send_invitation_email
from datetime import datetime
import time
import pandas as pd


# 用户管理页面
def manage_users_page():
    st.subheader("邀请受试者")
    
    with st.form("invite_participant_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            participant_email = st.text_input("受试者邮箱", placeholder="请输入受试者的邮箱地址")
        
        with col2:
            # 获取可用实验列表
            experiment_status, experiments, _ = get_experiments()
            experiment_dict = {}
            selected_experiment = None
            
            if experiment_status and experiments:
                # 创建实验字典，用于快速查找实验详情
                experiment_dict = {exp.get("experiment_name"): exp for exp in experiments if exp.get("experiment_name")}
                experiment_names = list(experiment_dict.keys())
                
                selected_experiment = st.selectbox(
                    "选择实验", 
                    experiment_names,
                    placeholder="请选择要邀请参与的实验",
                    disabled=not experiment_names
                )
            else:
                st.selectbox(
                    "选择实验",
                    [],
                    placeholder="暂无可用实验",
                    disabled=True
                )
        
        # 显示实验信息
        start_date_str = ""
        end_date_str = ""
        if selected_experiment and selected_experiment in experiment_dict:
            experiment = experiment_dict[selected_experiment]
            start_date = experiment.get("start_date", "")
            end_date = experiment.get("end_date", "")
            
            # 格式化日期显示
            try:
                if isinstance(start_date, str):
                    start_date_str = start_date
                else:
                    start_date_str = start_date.strftime("%Y年%m月%d日")
                
                if isinstance(end_date, str):
                    end_date_str = end_date
                else:
                    end_date_str = end_date.strftime("%Y年%m月%d日")
                
            except Exception:
                st.info(f"**实验信息**\n- 名称：{selected_experiment}\n- 日期信息：请检查实验配置")
        
        # 发送邮件按钮
        invite_button = st.form_submit_button("发送邀请邮件")
        
        if invite_button:
            if not participant_email:
                st.error("请输入受试者邮箱")
                st.stop()
            if not selected_experiment:
                st.error("请选择实验")
                st.stop()
            try:
                # 从实验信息中获取日期
                if selected_experiment and selected_experiment in experiment_dict:
                    experiment = experiment_dict[selected_experiment]
                    start_date = experiment.get("started_at", "")
                    end_date = experiment.get("ended_at", "")
                    
                    # 格式化日期
                    try:
                        if isinstance(start_date, str):
                            start_date_str = start_date
                        else:
                            start_date_str = start_date.strftime("%Y年%m月%d日")
                        
                        if isinstance(end_date, str):
                            end_date_str = end_date
                        else:
                            end_date_str = end_date.strftime("%Y年%m月%d日")
                    except Exception:
                        start_date_str = ""
                        end_date_str = ""
                
                # 发送邀请邮件
                response = send_invitation_email(
                    username="受试者",
                    experiment_name=selected_experiment or "",
                    receiver_email=participant_email,
                    start_date=start_date_str,
                    end_date=end_date_str
                )
                
                if response.success:
                    st.success(f"邀请邮件已成功发送至 {participant_email}！")
                else:
                    st.error(f"邮件发送失败：{response.error}")
            except Exception as e:
                st.error(f"邀请功能执行失败：{str(e)}")
    
    st.divider()

    st.subheader("受试者列表")
    try:
        status, users, msg = get_all_users()
        if status:
            if users and len(users) > 0:
                st.dataframe(users)
            else:
                st.info("暂无受试者")
        else:
            st.info(msg)
    except Exception as e:
        st.error(f"获取受试者列表失败: {e}")


# 实验管理页面
def manage_experiments_page():
    st.subheader("创建实验")
    with st.form("create_experiment_form"):
        experiment_name = st.text_input("实验名称*")
        experiment_description = st.text_area("实验描述*")
        start_date = st.date_input("开始日期*")
        end_date = st.date_input("结束日期*")
        author = "管理员"
        
        if st.form_submit_button("创建实验"):
            if not experiment_name:
                st.error("实验名称不能为空")
            else:
                started_at = datetime.combine(start_date, datetime.min.time())
                ended_at = datetime.combine(end_date, datetime.min.time())
                status, msg = create_experiment(experiment_name, experiment_description, author, started_at, ended_at)
                if status:
                    st.success("实验创建成功！")
                else:
                    st.error(f"创建失败: {msg}")
    
    st.divider()

    st.subheader("实验统计")
    try:
        status, experiments, msg = get_experiments()
        if status:
            if experiments and len(experiments) > 0:
                st.dataframe(experiments)
            else:
                st.info("暂无实验数据")
        else:
            st.info(msg)
    except Exception as e:
        st.error(f"获取实验列表失败: {e}")


# 材料管理页面
def manage_materials_page():
    st.subheader("创建材料")
    with st.form("create_material_form"):
        # 安全获取实验列表，避免None类型错误
        exp_status, experiments, _ = get_experiments()
        experiment_options = [exp["experiment_name"] for exp in experiments] if exp_status and experiments else []
        experiment_name = st.selectbox("实验名称*", placeholder="选择实验", options=experiment_options)
        material_name = st.text_input("材料名称*", placeholder="请输入材料名称")
        AI_funtion = st.multiselect("AI功能*", options=settings.AI_FUNCTION_OPTIONS, placeholder="选择该材料支持的AI功能")
        content = st.text_area("材料内容*", placeholder="请输入材料正文")
        image = st.file_uploader("上传图片", type=["jpg", "jpeg", "png"])
        video = st.file_uploader("上传视频", type=["mp4", "avi", "mov"])
        audio = st.file_uploader("上传音频", type=["mp3", "wav"])
        author = "管理员"

        if st.form_submit_button("创建材料"):
            if not material_name or not content:
                st.error("材料名称和内容不能为空")
            elif not experiment_name:
                st.error("实验名称不能为空")
            else:
                # 将 Streamlit 上传的文件对象转为 bytes
                img_bytes = image.read() if image is not None else None
                vid_bytes = video.read() if video is not None else None
                aud_bytes = audio.read() if audio is not None else None

                status, msg = create_material(experiment_name, material_name, AI_funtion, content, author, img_bytes, vid_bytes, aud_bytes)
                if status:
                    st.success("材料创建成功！")
                else:
                    st.error(f"创建失败: {msg}")
    
    st.divider()
    st.subheader("现有材料")
    try:
        status, materials, msg = get_materials()
        if status:
            if materials:
                st.dataframe(materials)
            else:
                st.info("暂无材料数据")
        else:
            st.error(msg)
    except Exception as e:
        st.error(f"获取材料列表失败: {e}")


# 分配管理页面
def manage_assignments_page():
    st.subheader("分配材料")
    material_options = []  # 默认初始化为空列表
    try:
        status, materials, msg = get_materials()
        if status and materials:
            material_options = [mat["material_name"] for mat in materials]
        elif not status:
            st.error(f"获取材料列表失败: {msg}")
    except Exception as e:
        st.error(f"获取材料列表异常: {e}")
    
    with st.form("assign_material_form"):
        user_email = st.text_input("用户邮箱*", placeholder="请输入用户邮箱")
        material_id = st.selectbox("实验材料*", placeholder="请选择分发的材料", options=material_options)
        author = "管理员"
        started_at = st.date_input("开始日期*")
        ended_at = st.date_input("结束日期*")
        assign_button = st.form_submit_button("分配材料")
        
        if assign_button:
            started_dt = datetime.combine(started_at, datetime.min.time())
            ended_dt   = datetime.combine(ended_at,   datetime.min.time())
            # 检查材料ID是否有效
            status = False
            msg = ""
            if not material_id:
                st.error("请选择要分配的材料")
            else:
                status, msg = assign_material_to_user(user_email, material_id, author, started_dt, ended_dt)
                if status:
                    st.success("材料分配成功！")
                    time.sleep(1)
                    st.rerun()
                else:
                    st.error(f"分配失败: {msg}")
    
    st.divider()

    st.subheader("分配列表")
    try:
        # 获取所有用户的分配
        all_assignments = []
        try:
            status, users, _ = get_all_users()
            if status and users:
                for user in users:
                    # 确保user是字典类型
                    if isinstance(user, dict) and 'email' in user:
                        # 正确处理get_assignments的返回值
                        assignment_status, assignments, _ = get_assignments()
                        if assignment_status and assignments:
                            all_assignments.extend(assignments)
        except Exception as e:
            st.error(f"获取分配列表失败: {e}")
        
        if all_assignments:
            # 转换为DataFrame格式显示
            assignment_data = []
            for assignment in all_assignments:
                # 确保assignment是字典类型
                if isinstance(assignment, dict):
                    # 获取状态的中文描述
                    status_text = '已完成' if assignment.get('status') == 2 else '待完成'
                    
                    # 构建数据行
                    data_row = {
                        '邮箱': assignment.get('email', ''),
                        '材料名称': assignment.get('material_name', ''),
                        '状态': status_text,
                        '分配时间': assignment.get('assigned_at', '') or assignment.get('created_at', '')
                    }
                    assignment_data.append(data_row)
            
            # 创建并显示DataFrame
            if assignment_data:
                df = pd.DataFrame(assignment_data)
                st.dataframe(df, width="stretch", hide_index=True)
        else:
            st.info("暂无分配记录")
    except Exception as e:
        st.error(f"获取分配记录失败: {e}")


# 显示管理页面
def show_management_page():
    # 使用标签页组织不同的管理功能
    tab1, tab2, tab3, tab4 = st.tabs(["用户管理", "实验管理", "材料管理", "分发管理"])
    
    with tab1:
        manage_users_page()
        
    with tab2:
        manage_experiments_page()
        
    with tab3:
        manage_materials_page()
        
    with tab4:
        manage_assignments_page()


# 页面主逻辑
st.title("📲 项目管理")

# 检查登录状态
if "admin_logged_in" not in st.session_state:
    st.session_state.admin_logged_in = False

if not st.session_state.admin_logged_in:
    # 显示登录表单
    with st.form("admin_login_form"):
        st.subheader("管理员登录")
        username = st.text_input("用户名")
        password = st.text_input("密码", type="password")
        login_button = st.form_submit_button("登录")
        
        if login_button:
            # 验证用户名和密码
            status, msg = check_access(username, password)
            if status:
                st.session_state.admin_logged_in = True
                st.success("登录成功！")
                st.rerun()
            else:
                st.error(msg)
else:
    
    # 退出登录按钮
    if st.sidebar.button("退出登录"):
        st.session_state.admin_logged_in = False
        st.rerun()
    
    # 显示管理功能
    show_management_page()