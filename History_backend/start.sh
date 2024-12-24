#!/bin/bash

# 启动 Redis（如果没有作为服务运行）
redis-server &

# 启动 FastAPI 应用
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2