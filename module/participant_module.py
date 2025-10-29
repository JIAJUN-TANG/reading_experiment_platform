import streamlit as st
from utils.data import get_user_info, delete_data, get_experiment_info
import pandas as pd
import time
from utils.notification import send_163_email


def manage_participant_page():
    # 获取用户信息和实验信息
    user_status, user_columns, user_info = get_user_info()
    exp_status, exp_columns, exp_info = get_experiment_info()
    
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
                st.caption(f"搜索结果：共 {len(filtered_df)} 位参与者（总 {len(user_df)} 位）")
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