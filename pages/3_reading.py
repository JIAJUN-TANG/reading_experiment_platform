import streamlit as st
from services.user_service import login_user
from services.experiment_service import get_user_assignments, read_assignment, get_material_by_name


st.title("🔍 材料阅读")

# 初始化session_state
if "username" not in st.session_state: 
    st.session_state["username"] = None  # 未登录时为None
if "email" not in st.session_state: 
    st.session_state["email"] = None  # 未登录时为None
# 添加阅读模式状态变量
if "reading_mode" not in st.session_state:
    st.session_state["reading_mode"] = False  # False表示显示材料列表，True表示显示阅读内容
if "current_material" not in st.session_state:
    st.session_state["current_material"] = None  # 当前正在阅读的材料信息


# 登录状态判断
if st.session_state["username"] in [None, ""]:
    with st.form("login_form"):
        email = st.text_input(
            label="请输入您的邮箱以验证身份", 
            value=st.session_state["email"] or "",  # 保留已输入的邮箱
            key="email_input"
        )
        submit_button = st.form_submit_button(label="确认")

        if submit_button:
            email_clean = email.strip()
            if not email_clean:
                st.warning("邮箱不能为空，请输入！")
            else:
                # 使用服务层的validate_user函数
                status, username, msg = login_user(email_clean)
                
                if status:
                    # 验证成功：更新session状态
                    st.session_state["email"] = email_clean
                    st.session_state["username"] = username
                    st.success(f"验证成功！欢迎，{username}")
                    st.rerun()  # 刷新页面生效
                else:
                    # 显示具体错误信息
                    st.warning(msg)

else:
    # 已登录状态
    st.markdown(f"欢迎回来，**{st.session_state['username']}**！")
    
    # 定义返回材料列表的函数
    def back_to_list():
        st.session_state["reading_mode"] = False
        st.session_state["current_material"] = None
    
    # 定义开始阅读材料的函数
    def start_reading(material):
        st.session_state["current_material"] = material
        st.session_state["reading_mode"] = True
    
    try:
        # 阅读模式判断
        if not st.session_state["reading_mode"]:
            # 材料列表模式
            # 使用服务层获取用户材料分配
            status, assignments, msg = get_user_assignments(st.session_state["email"])
            
            if status and assignments is not None:
                # 计算阅读统计
                read_count = 0
                remain_count = 0
                
                # 确保assignments是列表并且非空
                if isinstance(assignments, list):
                    read_count = len([assign for assign in assignments if isinstance(assign, dict) and (assign.get("status") == 2 or assign.get("status") == "已完成")])
                    remain_count = len([assign for assign in assignments if isinstance(assign, dict) and (assign.get("status") == 0 or assign.get("status") != "已完成")])
                
                # 显示阅读统计
                col1, col2 = st.columns(2)
                with col1:
                    st.metric(
                        label="已阅读",
                        value=read_count,
                        border=True
                    )
                with col2:
                    st.metric(
                        label="待阅读",
                        value=remain_count,
                        border=True
                    )
                
                st.divider()

                if remain_count > 0:
                    st.markdown("### 您收到的阅读材料如下：")
                    # 获取待阅读材料
                    pending_materials = []
                    if isinstance(assignments, list):
                        pending_materials = [assign for assign in assignments if isinstance(assign, dict) and (assign.get("status") == 0 or assign.get("status") != "已完成")]
                    
                    for idx, material in enumerate(pending_materials):
                        with st.expander(f"📄 {idx+1}-{material.get('material_name', '未命名材料')}"):
                            st.markdown(f"**开始日期：** {material.get('started_at', material.get('assigned_at', '未知')).split(' ')[0]}")
                            st.markdown(f"**截止日期：** {material.get('ended_at', '未知').split(' ')[0]}")
                            
                            # 修改为普通按钮，点击后切换到阅读模式
                            if st.button(f"开始阅读", key=f"read_{idx}", width="content"):
                                start_reading(material)
                                st.rerun()
                else:
                    st.success("您已完成所有阅读材料！感谢您的参与！")
                    st.balloons()
            else:
                st.toast(body="您的阅读材料已全部完成，感谢！", icon="🎉")
                st.info("您目前没有待阅读的材料。")
        else:
            # 阅读内容模式
            current_material = st.session_state["current_material"]
            
            if current_material:
                material_name = current_material.get("material_name", "未命名材料")
                
                # 记录用户点击阅读行为
                read_assignment(st.session_state["email"], material_name, 1)  # 状态为1表示正在阅读
            
                
                # 获取材料详情
                status, material_details, error_msg = get_material_by_name(material_name)
                
                # 设置页面标题
                st.title(f"阅读材料: {material_name}")
                
                # 显示材料内容
                st.markdown("---")
                st.markdown("### 材料内容")
                if status and material_details:
                    st.markdown(material_details.get('content', '暂无内容'))
                    
                    # AI功能提示（如果有）
                    ai_function = material_details.get('ai_function', '')
                    if ai_function:
                        st.markdown("---")
                        st.markdown("### AI功能")
                        st.info(ai_function)
                else:
                    st.warning(f"获取材料详情时出现问题: {error_msg or '未知错误'}")
                    st.info("材料内容暂时无法加载，请稍后再试。")
                
                # 显示操作按钮
                st.markdown("---")
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("标记为已完成", width="content"):
                        with st.spinner("正在更新状态..."):
                            try:
                                success, msg = read_assignment(st.session_state["email"], material_name, 1)
                                if success:
                                    st.success("已成功标记为完成！")
                                    # 延迟后返回材料列表
                                    import time
                                    time.sleep(1.5)
                                    back_to_list()
                                    st.rerun()
                                else:
                                    st.error(f"更新失败: {msg}")
                            except Exception as e:
                                st.error(f"更新状态时发生错误: {str(e)}")
                with col2:
                    st.button("返回材料列表", on_click=back_to_list, width="content")
            else:
                st.error("未找到阅读材料信息")
                st.button("返回材料列表", on_click=back_to_list, width="content")
                
    except Exception as e:
        st.error(f"获取材料失败：{str(e)}")
        # 添加恢复选项
        if st.button("重试获取材料"):
            st.rerun()