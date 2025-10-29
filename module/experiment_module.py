import streamlit as st
from utils.data import insert_data, delete_data, get_experiment_info
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
            status, columns, user_info = get_experiment_info()
            if status:
                st.write("### 实验详情")
                df = pd.DataFrame(user_info, columns=columns)
                
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
                                id=experiment_name  # 补充缺失的id参数（选中的实验名称）
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

def statistic_experiment_page():
    status, columns, user_info = get_experiment_info()
    
    if status:
        st.write("### 实验统计")
        df = pd.DataFrame(user_info, columns=columns)
        visible_experiments = df[df["visible"] == "true"]
        col1, col2, col3, col4 = st.columns(4)
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