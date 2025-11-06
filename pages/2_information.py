import streamlit as st
from config.settings import settings
from services.user_service import register_user, is_valid_email
from services.notification_service import send_registration_email
from services.experiment_service import get_experiments


def init_session_state():
    # 初始化会话状态
    if 'submit_success' not in st.session_state:
        st.session_state.submit_success = False
    
    # 初始化表单输入
    if 'email' not in st.session_state:
        st.session_state.email = ''
    if 'name' not in st.session_state:
        st.session_state.username = ''
    if 'sex' not in st.session_state:
        st.session_state.sex = settings.SEX_OPTIONS[0]
    if 'age' not in st.session_state:
        st.session_state.age = ''
    if 'degree' not in st.session_state:
        st.session_state.degree = settings.DEGREE_OPTIONS[0]
    if 'selected_experiments' not in st.session_state:
        st.session_state.selected_experiments = []
    if 'role' not in st.session_state:
        st.session_state.role = '参与者'


def main():
    st.title('📋 个人信息登记')
    
    # 初始化会话状态
    init_session_state()
    
    # 如果提交成功，显示成功消息
    if st.session_state.submit_success:
        st.success('您的信息已成功提交！')
        st.info('请点击左侧导航栏中的 "材料阅读" 开始实验。')
        return
    
    # 创建表单
    with st.form("information_form"):
        # 个人基本信息
        st.subheader("个人基本信息*")
        
        # 邮箱（必填）
        st.session_state.email = st.text_input(
            "邮箱*", 
            placeholder="请输入您的邮箱",
            value=st.session_state.email
        )
        
        # 姓名（必填）
        st.session_state.username = st.text_input(
            "姓名*", 
            placeholder="请输入您的姓名",
            value=st.session_state.username
        )
        
        # 性别（必填）
        st.session_state.sex = st.selectbox(
            "性别*", 
            placeholder="请选择您的性别",
            options=settings.SEX_OPTIONS,
            index=None,
        )
        
        # 年龄（必填）
        st.session_state.age = st.number_input(
            "年龄*", 
            placeholder="请输入您的年龄",
            value=None,
            min_value=1,
            max_value=100,
            step=1
        )
        
        # 学历（必填）
        st.session_state.degree = st.selectbox(
            "学历*", 
            placeholder="请选择您的学历",
            options=settings.DEGREE_OPTIONS,
            index=None
        )
        
        # 职业（必填）
        st.session_state.job = st.selectbox(
            "职业*", 
            placeholder="请选择您的职业",
            options=settings.JOB_OPTIONS,
            index=None,
        )
        
        # 实验选择
        st.subheader("实验选择*")
        try:
            status, experiments, msg = get_experiments()
            if status and experiments:
                experiment_names = [exp["experiment_name"] for exp in experiments ]
            else:
                st.error(msg)
        except Exception as e:
            st.error(f"获取实验列表失败: {e}")
            
        selected_exp = st.selectbox(  
            "请选择您要参与的实验",  
            options=experiment_names,
            disabled=not experiment_names,
        )  
        st.session_state.selected_experiments = selected_exp
        
        # 角色设置
        st.subheader("角色设置")
        st.session_state.role = st.radio(
            "请选择您的角色", 
            ["参与者", "研究人员"],
            index=0 if st.session_state.role == "参与者" else 1,
            disabled=True
        )
        
        # 提交按钮
        submit_button = st.form_submit_button(
                label="提交信息",
                width="content"
            )
    
    # 处理表单提交
    if submit_button:
        # 表单验证
        if not st.session_state.email:
            st.error("邮箱不能为空！")
            return
        
        if not st.session_state.username:
            st.error("姓名不能为空！")
            return
        
        if not st.session_state.age:
            st.error("年龄不能为空！")
            return
        
        # 验证邮箱格式
        if not is_valid_email(st.session_state.email):
            st.error("请输入有效的邮箱！")
            return
        
        # 验证年龄为数字
        try:
            age = int(st.session_state.age)
            if age < 1 or age > 100:
                st.error("请输入有效的年龄！")
                return
        except ValueError:
            st.error("年龄必须为数字！")
            return
        
        # 验证至少选择一个实验
        if not st.session_state.selected_experiments:
            st.error("请至少选择一个实验！")
            return
        
        # 信息预览
        st.subheader("信息预览")
        preview_data = {
            "邮箱": st.session_state.email,
            "姓名": st.session_state.username,
            "性别": st.session_state.sex,
            "年龄": st.session_state.age,
            "职业": st.session_state.job,
            "学历": st.session_state.degree,
            "参与实验": st.session_state.selected_experiments,
            "角色": st.session_state.role
        }
        
        for key, value in preview_data.items():
            st.write(f"**{key}**: {value}")
        
        # 提交到数据库
        try:
            status, msg = register_user(
                {
                    "email": st.session_state.email,
                    "username": st.session_state.username,
                    "sex": st.session_state.sex,
                    "age": st.session_state.age,
                    "job": st.session_state.job,
                    "degree": st.session_state.degree,
                    "experiment_name": st.session_state.selected_experiments,
                    "role": st.session_state.role
                }
            )
            
            if status:
                # 发送邮件通知
                email_response = send_registration_email(
                    username=st.session_state.username,
                    receiver_email=st.session_state.email
                )
                if not email_response.success:
                    st.warning(f"邮件发送失败: {email_response.error}")
                
                # 设置会话状态，标记提交成功
                st.session_state.submit_success = True
                st.success("注册成功！系统将自动跳转...")
                
                # 存储用户信息到会话状态
                st.session_state.username = st.session_state.username
                st.session_state.email = st.session_state.email
                
                # 模拟跳转
                import time
                time.sleep(1)
                st.rerun()
            else:
                st.error(f"注册失败: {msg}")
        except Exception as e:
            st.error(f"系统错误：{str(e)}")

if __name__ == "__main__":
    main()