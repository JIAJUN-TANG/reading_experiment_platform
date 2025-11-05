import streamlit as st
from utils.data import insert_data, delete_data, get_info
import pandas as pd
import time
from utils.notification import send_163_email


def manage_experiment_page():
    st.markdown("### 新增实验")

    if "show_experiment_form" not in st.session_state:
        st.session_state.show_experiment_form = False

    if not st.session_state.show_experiment_form:
        add_experiment_button = st.button(
            label="新增实验", 
            key="add_experiment_button"
        )

        st.divider()

        if add_experiment_button:
            st.session_state.show_experiment_form = True  # 点击后切换状态
            st.rerun()  # 立即刷新页面，显示表单

    # 内容占位符：动态切换「表单」和「实验详情+删除功能」
    content_placeholder = st.empty()

    if st.session_state.show_experiment_form:
        with content_placeholder.container():
            st.markdown("### 填写实验信息")
            with st.form(key="experiment_form", clear_on_submit=True):
                # 表单字段（带*为必填）
                experiment_name = st.text_input(label="实验名称*", placeholder="请输入实验名称")
                experiment_start = st.date_input(label="实验开始时间*", help="选择实验启动日期")
                experiment_end = st.date_input(label="实验结束时间*", help="选择实验截止日期")
                experiment_desc = st.text_area(
                    label="实验描述*", 
                    placeholder="请简要描述实验目的、流程",
                    height=100
                )
                experiment_owner = st.text_input(label="负责人*", placeholder="请输入实验负责人姓名")
                submit_btn = st.form_submit_button(label="创建实验", type="primary")

            if submit_btn:
                # 校验必填字段
                required_fields = [experiment_name, experiment_start, experiment_end, experiment_owner, experiment_desc]
                if not all(required_fields):
                    st.error("请填写所有带「*」的必填字段！")
                # 校验时间顺序
                elif experiment_start > experiment_end:
                    st.error("实验结束时间必须在开始时间之后！")
                else:
                    # 准备插入数据
                    experiment_data = {
                        "experiment_name": experiment_name,
                        "visible": "true",
                        "content": experiment_desc,
                        "author": experiment_owner,
                        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "started_at": experiment_start.strftime("%Y-%m-%d"),
                        "ended_at": experiment_end.strftime("%Y-%m-%d"),
                        "user_group": 0,
                    }
                    # 调用通用插入函数
                    status, msg = insert_data(
                        db="experiments",
                        table="experiments",
                        data=experiment_data,
                        primary_key="experiment_name"
                    )
                    # 处理插入结果
                    if status:
                        st.success(f"实验「{experiment_name}」创建成功！")
                        time.sleep(1)
                        # 重置状态，返回实验列表
                        st.session_state.show_experiment_form = False
                        st.rerun()
                    else:
                        st.error(f"创建失败：{msg}")

    # 场景2：不显示表单时，始终显示实验详情和删除功能
    else:
        with content_placeholder.container():
            # 获取实验信息
            status, columns, experiment_info = get_info("experiments", "experiments")
            if status:
                st.write("### 实验详情")
                df = pd.DataFrame(experiment_info, columns=columns)
                
                # 无实验数据时的提示
                if len(df) == 0:
                    st.info("当前还未设置实验。")
                else:
                    # 展示实验表格
                    st.dataframe(df, width="stretch", hide_index=True)
                    st.caption(f"当前共有 {len(df)} 个实验")
                    st.divider()

                    # 删除实验功能
                    st.write("### 删除实验")
                    if "experiment_name" not in df.columns:
                        st.warning("实验表缺少「experiment_name」字段，请检查数据库表结构！")
                    else:
                        # 选择要删除的实验
                        experiment_name = st.selectbox(
                            label="请选择要删除的实验名称", 
                            options=df["experiment_name"].to_list(),
                            key="experiment_name"
                        )
                        delete_button = st.button(label="删除", key="delete_experiment_button")
                        
                        if delete_button:
                            # 调用删除函数
                            status, message = delete_data(
                                db="experiments",  # 实验数据应存在experiments.db
                                table="experiments",  # 表名应为experiments
                                field="experiment_name",  # 用实验名称作为删除条件
                                id=experiment_name
                            )
                            
                            if status:
                                if 'df' in locals() and "experiment_name" in df.columns and "author" in df.columns:
                                    experiment_owner = df[df["experiment_name"] == experiment_name]["author"].iloc[0]
                                else:
                                    experiment_owner = st.session_state.get("current_username", "管理员")
                                s = send_163_email(
                                    username=experiment_owner,
                                    receiver_email=None,
                                    template="experiment_delete_template"
                                )
                                if s:
                                    st.error(f"邮件发送失败：{s}")
                                st.toast(message)
                                time.sleep(1)
                                st.rerun()
                            else:
                                st.warning(message)
            else:
                st.error(f"获取实验信息失败：{columns}")  # columns为错误信息
        
        st.divider()

def manage_material_page():
    st.markdown("### 新增材料")

    if "show_material_form" not in st.session_state:
        st.session_state.show_material_form = False

    if not st.session_state.show_material_form:
        add_material_button = st.button(
            label="新增材料", 
            key="add_material_button"
        )

        st.divider()

        if add_material_button:
            st.session_state.show_material_form = True  # 点击后切换状态
            st.rerun()  # 立即刷新页面，显示表单

    content_placeholder = st.empty()

    if st.session_state.show_material_form:
        status, columns, experiment_info = get_info("experiments", "experiments")
        if status:
            df = pd.DataFrame(experiment_info, columns=columns)
        with content_placeholder.container():
            st.markdown("### 填写材料信息")
            with st.form(key="material_form", clear_on_submit=True):
                experiment_name = st.selectbox(label="实验名称*", options=df["experiment_name"].to_list(), placeholder="请选择实验", disabled=not df["experiment_name"].to_list())
                material_name = st.text_input(label="材料名称*", placeholder="请输入材料名称")
                visible = st.selectbox(
                    label="是否可见*", 
                    options=["可见", "隐藏"],
                    help="选择材料是否对参与者可见"
                )
                ai_function = st.multiselect(
                    label="AI辅助功能", 
                    options=["文本摘要", "图像生成", "语音生成", "视频生成"],
                    help="请选择材料支持的AI辅助功能"
                )
                content = st.text_area(
                    label="材料内容*", 
                    placeholder="请输入材料的主要内容，支持Markdown格式",
                    height=200
                )
                image = st.text_input(label="图片链接", placeholder="请输入材料相关图片的URL链接")
                video = st.text_input(label="视频链接", placeholder="请输入材料相关视频的URL链接")
                audio = st.text_input(label="音频链接", placeholder="请输入材料相关音频的URL链接")
                material_owner = st.text_input(label="负责人*", placeholder="请输入材料负责人姓名")
                submit_btn = st.form_submit_button(label="创建材料", type="primary")

            if submit_btn: 
                # 校验必填字段
                required_fields = [experiment_name, material_name, visible, content, material_owner]
                if not all(required_fields):
                    st.error("请填写所有带「*」的必填字段！")
                else:
                    # 准备插入数据
                    material_data = {
                        "experiment_name": experiment_name,
                        "material_name": material_name,
                        "visible": 0 if visible == "隐藏" else 1,
                        "ai_function": ai_function if ai_function else "",
                        "content": content,
                        "image": image if image else "",
                        "video": video if video else "",
                        "audio": audio if audio else "",
                        "author": material_owner,
                        "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "user_group": 0,
                    }
                    # 调用通用插入函数
                    status, msg = insert_data(
                        db="experiments",
                        table="materials",
                        data=material_data,
                        primary_key="material_name"
                    )
                    # 处理插入结果
                    if status:
                        st.success(f"材料「{material_name}」创建成功！")
                        time.sleep(1)
                        # 重置状态，返回实验列表
                        st.session_state.show_material_form = False
                        st.rerun()
                    else:
                        st.error(f"创建失败：{msg}")

    else:
        with content_placeholder.container():
            # 获取材料信息
            status, columns, material_info = get_info("experiments", "materials")
            if status:
                st.write("### 材料详情")
                df = pd.DataFrame(material_info, columns=columns)
                
                # 无材料数据时的提示
                if len(df) == 0:
                    st.info("当前还未设置材料。")
                else:
                    # 展示实验表格
                    st.dataframe(df, width="stretch", hide_index=True)
                    st.caption(f"当前共有 {len(df)} 个材料")
                    st.divider()

                    # 删除实验功能
                    st.write("### 删除材料")
                    if "material_name" not in df.columns:
                        st.warning("实验表缺少「material_name」字段，请检查数据库表结构！")
                    else:
                        # 选择要删除的实验
                        material_name = st.selectbox(
                            label="请选择要删除的实验名称", 
                            options=df["material_name"].to_list(),
                            key="material_name"
                        )
                        delete_button = st.button(label="删除", key="delete_material_button")
                        
                        if delete_button:
                            # 调用删除函数
                            status, message = delete_data(
                                db="experiments",
                                table="materials",
                                field="material_name",
                                id=material_name
                            )
                            
                            if status:
                                if 'df' in locals() and "material_name" in df.columns and "author" in df.columns:
                                    material_owner = df[df["material_name"] == material_name]["author"].iloc[0]
                                else:
                                    experiment_owner = st.session_state.get("current_username", "管理员")
                                s = send_163_email(
                                    username=experiment_owner,
                                    receiver_email=None,
                                    template="experiment_delete_template"
                                )
                                if s:
                                    st.error(f"邮件发送失败：{s}")
                                st.toast(message)
                                time.sleep(1)
                                st.rerun()
                            else:
                                st.warning(message)
            else:
                st.error(f"获取实验信息失败：{columns}")  # columns为错误信息
        
        st.divider()
    
def manage_participant_page():
    # 获取用户信息和实验信息
    user_status, user_columns, user_info = get_info("users", "users")
    exp_status, exp_columns, exp_info = get_info("experiments", "experiments")
    
    # 邀请参与者区域
    st.write("### 邀请参与者")
    
    # 处理实验选择列表
    experiment_options = []
    if exp_status and exp_info:  # 仅当实验数据获取成功且非空时
        exp_df = pd.DataFrame(exp_info, columns=exp_columns)
        if "experiment_name" in exp_df.columns:
            experiment_options = exp_df["experiment_name"].to_list()
        else:
            st.warning("实验表缺少「experiment_name」字段，无法加载实验列表")
    else:
        pass
    
    # 输入框和选择框（实验选择框根据选项动态禁用）
    invited_email = st.text_input(
        label="邮箱", 
        placeholder="请输入参与者邮箱", 
        key="invited_email"
    )
    invited_experiment = st.selectbox(
        label="实验", 
        options=experiment_options,
        placeholder="请选择实验",
        key="invited_experiment",
        disabled=not experiment_options  # 无实验时禁用选择
    )
    
    # 发送邀请按钮逻辑
    invite_button = st.button(label="发送邀请", key="invite_button")
    if invite_button:
        # 校验邮箱和实验选择
        if not invited_email.strip():
            st.warning("请输入有效的邮箱地址！")
        elif not experiment_options:
            st.warning("暂无可用实验，无法发送邀请！")
        elif not invited_experiment:
            st.warning("请选择要邀请参与的实验！")
        else:
            # 优化邮件参数：从用户信息中获取用户名，否则用邮箱前缀
            username = "参与者"  # 默认值
            if user_status and user_info:
                user_df = pd.DataFrame(user_info, columns=user_columns)
                if "email" in user_df.columns and "username" in user_df.columns:
                    matched = user_df[user_df["email"] == invited_email]["username"]
                    if not matched.empty:
                        username = matched.iloc[0]  # 用已存在的用户名
                else:
                    username = invited_email.split("@")[0]  # 用邮箱前缀作为用户名
            
            # 发送邀请邮件
            email_error = send_163_email(
                username=username,
                receiver_email=invited_email,
                template="invite_template",
                experiment_name=invited_experiment
            )
            
            if email_error:
                st.warning(f"邀请邮件发送失败：{str(email_error)}")
            else:
                st.success(f"已向 {invited_email} 发送实验「{invited_experiment}」的邀请！")
    
    st.divider()
    
    # 参与者详情区域
    st.write("### 参与者详情")
    if not user_status:
        st.error(f"获取参与者信息失败：{user_columns}")  # user_columns为错误信息
    else:
        user_df = pd.DataFrame(user_info, columns=user_columns)
        if len(user_df) == 0:
            st.info("当前还未招募参与者。")
        else:
            # 新增：搜索框筛选参与者
            search_email = st.text_input(
                label="搜索参与者", 
                placeholder="输入邮箱关键词筛选", 
                key="search_user"
            )
            if search_email:
                filtered_df = user_df[user_df["email"].str.contains(search_email, case=False)]
                st.dataframe(filtered_df, width="stretch", hide_index=True)
                st.caption(f"搜索结果：共 {len(filtered_df)} 位参与者（总共 {len(user_df)} 位）")
            else:
                st.dataframe(user_df, width="stretch", hide_index=True)
                st.caption(f"当前共有 {len(user_df)} 位参与者")
            
            st.divider()
            
            # 删除参与者区域
            st.write("### 删除参与者")
            if "email" not in user_df.columns:
                st.warning("参与者表缺少「email」字段，无法执行删除操作")
            else:
                deleted_email = st.selectbox(
                    label="请选择要删除的参与者邮箱",
                    options=user_df["email"].to_list(),
                    key="existing_email"
                )
                if st.button(label="删除", key="delete_user_button"):
                    confirm = st.checkbox(f"确认删除参与者「{deleted_email}」？此操作不可恢复", key="confirm_delete")
                    if confirm:
                        # 执行删除
                        del_status, del_msg = delete_data(
                            db="users",
                            table="users",
                            field="email",
                            id=deleted_email
                        )
                        if del_status:
                            # 发送删除通知邮件
                            del_username = user_df[user_df["email"] == deleted_email]["username"].iloc[0] if "username" in user_df.columns else deleted_email.split("@")[0]
                            delete_email_error = send_163_email(
                                username=del_username,
                                receiver_email=deleted_email,
                                template="delete_template"
                            )
                            if delete_email_error:
                                st.warning(f"删除通知邮件发送失败：{str(delete_email_error)}")
                            st.success(del_msg)
                            time.sleep(0.5)
                            st.rerun()
                        else:
                            st.warning(del_msg)
    
    st.divider()

def manage_assignment_page():
    st.markdown("### 新增分发")
    user_status, user_columns, user_info = get_info("users", "users")
    exp_status, exp_columns, exp_info = get_info("experiments", "experiments")
    mat_status, mat_columns, mat_info = get_info("experiments", "materials")
    if not mat_status:
        st.info("暂无材料可分发，请先创建实验材料！")
    else:
        material_name = st.selectbox(label="选择材料", options=[m[2] for m in mat_info], disabled=not mat_info)
        col1, col2 = st.columns(2)
        with col1:
            experiment_name = st.selectbox(label="选择实验", options=[e[1] for e in exp_info], disabled=not exp_info)
        with col2:
            assignment_scope = st.pills(label="分发范围", options=["按组别", "按用户"], key="assignment_scope")
    to_whom = st.selectbox(label="选择组别" if assignment_scope == "按组别" else "按用户", options=
                           sorted(set([u[10] for u in user_info])) if assignment_scope == "按组别" else 
                           [u[1] for u in user_info], disabled=not assignment_scope, key="to_whom")
    assignment_button = st.button(label="分发材料", key="assign_material_button")
    if assignment_button:
        status, msg = insert_data(db="experiments", table="assignments", data={
            "experiment_name": experiment_name,
            "email": to_whom,
            "material_name": material_name,
            "status": 0,
            "author": st.session_state.get("current_username", "管理员"),
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "completed_at": "",
            "started_at": "",
            "ended_at": "",
            },
            primary_key=["experiment_name", "email", "material_name"])
        if status:
            st.success(f"材料「{material_name}」已成功分发给「{to_whom}」！")
            time.sleep(1)
            st.rerun()
        else:
            st.warning(f"分发失败：{msg}")
    st.divider()
    
def statistic_experiment_page():
    status, columns, user_info = get_info("experiments", "experiments")
    
    if status:
        st.write("### 实验统计")
        df = pd.DataFrame(user_info, columns=columns)
        visible_experiments = df[df["visible"] == "true"]
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric(
            label="实验总数",
            value=len(df),
            delta=None,
            delta_color="normal",
            help="系统中已创建的实验总数量",
            border=True,
            width="stretch"
        )
        with col2:
            st.metric(
            label="运行中实验数",
            value=len(visible_experiments),
            delta=None,
            delta_color="normal",
            help="当前正在运行的实验数量",
            border=True,
            width="stretch"
        )
            
        with col3:
            st.badge("最新实验", color="blue")
            if len(visible_experiments) == 0:
                st.write("暂无实验")
            else:
                if "created_at" not in visible_experiments.columns:
                    st.write("暂无实验")
                else:
                    latest_experiment = visible_experiments.sort_values(by="created_at", ascending=False).iloc[0]
                    st.write(f"**{latest_experiment['experiment_name']}**")

    else:    
        st.error(f"获取实验信息失败：{columns}")