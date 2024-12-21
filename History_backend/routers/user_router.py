from fastapi import APIRouter, HTTPException, Response, Request
from schemas import UserCreate, UserLogin
from utils.auth import get_password_hash, create_access_token
from utils.database import user_register, user_login, record_usage, get_affiliation
from fastapi.responses import JSONResponse
import jwt
import datetime
import os
from passlib.context import CryptContext
import uuid


user_router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@user_router.post("/SignUp/")
async def SignUp(user: UserCreate):
    # 检查用户是否已存在（假设通过 email 唯一标识用户）
    user_data = user_login(user.email)
    if user_data:
        raise HTTPException(status_code=500, detail="邮箱已注册，请直接登录！")
    else:

    # 准备用户数据
        user_data = {
        "email": user.email,
        "user_name": user.user_name,
        "affiliation": user.affiliation,
        "invitation": user.invitation,
        "passwd": get_password_hash(user.password),
        "register_date": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
    }

    # 插入用户数据到数据库
        user_register(user_data)
        return {"msg": "用户注册成功"}

@user_router.post("/SignIn/")
async def SignIn(user: UserLogin):
    # 从数据库中查询用户信息
    user_data = user_login(user.email)

    if not user_data:
        raise HTTPException(status_code=401, detail="用户不存在！")
    
    else:
    # 解包查询结果
        email, hashed_password, user_name, affiliation = user_data

    # 验证密码
    if not pwd_context.verify(user.password, hashed_password):
        raise HTTPException(status_code=400, detail="邮箱或密码错误！")

    # 保存记录
    only_id = str(uuid.uuid4())
    login_date = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    record_usage(only_id, email, user_name, affiliation, login_date, user.ip_address)

    # 生成 token
    token = create_access_token(data={"sub": email})

    # 构建响应
    response = JSONResponse(
        content={"msg": "登录成功！", "user_info": {
            "email": email,
            "user_name": user_name,
            "affiliation": affiliation
        }},
    )
    response.set_cookie(
        key="access_token",
        value=token,
        path="/",
        httponly=True,
        secure=False,
        max_age=60 * 60 * 24,
        expires=60 * 60 * 24,
        samesite="Lax"
    )
    return response

@user_router.post("/SignOut/")
async def sign_out_endpoint(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "退出登录成功！"}

@user_router.get("/check-auth/")
async def check_auth(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="未认证用户！")

    try:
        # 解码 JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_email = payload.get("sub")
        if not user_email:
            raise HTTPException(status_code=401, detail="无效token！")

        # 从数据库中查询用户信息
        user_data = user_login(user_email)

        # 检查用户是否存在
        if not user_data:
            raise HTTPException(status_code=401, detail="用户不存在！")

        # 解包查询结果
        email, hashed_password, user_name, affiliation = user_data

        # 返回用户信息
        return {"user": {"email": email, "user_name": user_name}}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="登录已过期！")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="无效token！")
    
@user_router.get("/GetAffiliation/")
async def get_affiliation_endpoint():
    try:
        affiliations = get_affiliation()
        return affiliations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"加载失败：{str(e)}")