import os
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext


SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
USERS_FILE = "users.json"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm="HS256")
    return encoded_jwt