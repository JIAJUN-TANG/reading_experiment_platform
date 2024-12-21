from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers.user_router import user_router
from routers.data_router import data_router
from routers.translate_router import translate_router
from routers.file_router import file_router
import os

CACHED_DIR = os.path.abspath("./cached")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/cached", StaticFiles(directory=CACHED_DIR), name="cached")

app.include_router(user_router, prefix="/user", tags=["user"])
app.include_router(data_router, prefix="/data", tags=["data"])
app.include_router(translate_router, prefix="/translate", tags=["translate"])
app.include_router(file_router, prefix="/file", tags=["file"])