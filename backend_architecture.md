# Electron + Python 后端架构方案

## 1. 架构概述

本方案采用 Electron + Python 后端的架构，前后端通过 HTTP API 通信，使用 SQLite 作为本地数据库。

### 1.1 架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            Electron 应用                                 │
├─────────────────┬─────────────────┬─────────────────────────────────────┤
│  渲染进程 (React) │  主进程 (Node.js) │  Python 后端服务 (HTTP Server)       │
├─────────────────┼─────────────────┼─────────────────────────────────────┤
│  ┌───────────┐  │  ┌───────────┐  │  ┌───────────┐  ┌───────────────┐  │
│  │  React    │  │  │  Node.js  │  │  │  Flask    │  │  SQLite       │  │
│  │  应用     │  │  │  主进程   │  │  │  服务器   │  │  数据库       │  │
│  └───────────┘  │  └───────────┘  │  └───────────┘  └───────────────┘  │
│        │        │        │        │        │                │          │
│        └────────┼────────┘        │        └────────────────┘          │
│                 │                 │                                    │
│                 └─────────────────┼─────────────────────────────────────┘
│                                   │
│                                   ▼
│                           HTTP API 通信
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. 技术栈

### 2.1 前端技术栈

- **Electron**：跨平台桌面应用框架
- **React**：前端 UI 框架
- **TypeScript**：类型安全的 JavaScript 超集
- **Tailwind CSS**：实用优先的 CSS 框架

### 2.2 后端技术栈

- **Python 3.10+**：后端开发语言
- **Flask**：轻量级 Python Web 框架
- **SQLAlchemy**：Python ORM 库
- **SQLite**：本地数据库
- **Gunicorn**：WSGI 服务器（生产环境）

## 3. 数据库设计

### 3.1 用户表 (users)

| 字段名      | 数据类型    | 约束条件     | 描述               |
|------------|------------|-------------|--------------------|
| id         | VARCHAR(36)| PRIMARY KEY | 用户唯一标识符     |
| name       | VARCHAR(50)| NOT NULL    | 用户名             |
| role       | VARCHAR(20)| NOT NULL    | 用户角色（ADMIN/PARTICIPANT） |
| avatar_url | VARCHAR(255)| NULL        | 用户头像 URL       |
| password   | VARCHAR(255)| NULL        | 用户密码（加密存储） |
| created_at | DATETIME   | NOT NULL    | 创建时间           |
| updated_at | DATETIME   | NOT NULL    | 更新时间           |

### 3.2 其他表（预留）

- **materials**：阅读材料表
- **reading_sessions**：阅读会话表
- **log_entries**：日志表

## 4. 后端 API 设计

### 4.1 用户相关 API

| API 路径          | 方法 | 功能描述       | 请求体示例                                  | 响应体示例                                  |
|-------------------|------|----------------|---------------------------------------------|---------------------------------------------|
| `/api/users`      | GET  | 获取所有用户   | N/A                                         | `[{"id": "u1", "name": "Alice", ...}]` |
| `/api/users/:id`  | GET  | 获取单个用户   | N/A                                         | `{"id": "u1", "name": "Alice", ...}` |
| `/api/users`      | POST | 创建用户       | `{"id": "u3", "name": "Charlie", ...}` | `{"id": "u3", "name": "Charlie", ...}` |
| `/api/users/:id`  | PUT  | 更新用户       | `{"name": "Alice Smith"}`                 | `{"id": "u1", "name": "Alice Smith", ...}` |
| `/api/users/:id`  | DELETE | 删除用户     | N/A                                         | `{"success": true}`                       |
| `/api/login`      | POST | 用户登录       | `{"id": "u1", "password": "password1"}` | `{"success": true, "user": {...}}`       |

## 5. 前后端通信机制

### 5.1 通信方式

- **渲染进程 → Python 后端**：通过 HTTP 请求通信
- **主进程 → Python 后端**：通过 HTTP 请求通信
- **Python 后端 → Electron**：通过 HTTP WebSocket 或 Electron IPC 通信

### 5.2 通信协议

- **HTTP 版本**：HTTP/1.1
- **数据格式**：JSON
- **认证方式**：JWT Token（可选）

## 6. 打包方案

### 6.1 Python 后端打包

- 使用 **PyInstaller** 将 Python 解释器和依赖打包为单个可执行文件
- 配置 `pyinstaller.spec` 文件，指定入口点和依赖
- 将打包后的 Python 可执行文件与 Electron 应用一起打包

### 6.2 Electron 应用打包

- 使用 **electron-builder** 打包 Electron 应用
- 配置 `electron-builder.json` 文件，指定打包选项
- 将 Python 后端可执行文件和 SQLite 数据库包含在打包后的应用中

### 6.3 打包流程

1. 构建前端应用：`npm run build`
2. 打包 Python 后端：`pyinstaller backend.spec`
3. 将打包后的 Python 可执行文件复制到 Electron 应用目录
4. 打包 Electron 应用：`npm run build:electron`

## 7. 开发流程

### 7.1 本地开发

1. 启动 Python 后端：`python backend/app.py`
2. 启动 Electron 开发服务器：`npm run dev`
3. 在浏览器中访问 `http://localhost:3000` 或在 Electron 应用中测试

### 7.2 调试

- **前端调试**：使用 Chrome DevTools 调试渲染进程
- **后端调试**：使用 Python IDE（如 PyCharm）调试 Python 后端
- **前后端通信调试**：使用 Chrome DevTools 的 Network 面板查看 HTTP 请求和响应

## 8. 优势与劣势

### 8.1 优势

- **前后端分离**：开发和调试方便，维护成本低
- **跨平台**：可以打包为 Windows、macOS 和 Linux 应用
- **Python 生态丰富**：可以使用 Python 强大的库和工具
- **SQLite 轻量级**：无需安装数据库服务器，适合本地应用

### 8.2 劣势

- **打包后体积较大**：包含 Python 解释器和依赖
- **性能开销**：HTTP 通信有一定的性能开销
- **跨语言调试复杂**：前后端使用不同的语言，调试复杂问题时比较困难

## 9. 替代方案

### 9.1 子进程方式

- **优点**：通信速度快，无需启动 HTTP 服务器
- **缺点**：前后端耦合度高，调试复杂

### 9.2 Python 解释器嵌入方式

- **优点**：性能最好，无需单独启动后端服务
- **缺点**：开发复杂，需要 C++ 绑定，维护成本高

## 10. 结论

综合考虑开发效率、维护成本和性能，本方案推荐使用 **HTTP API 方式** 集成 Python 后端。这种方式前后端分离，开发和调试方便，适合大多数 Electron 应用场景。

对于性能要求特别高的应用，可以考虑使用 **子进程方式** 或 **Python 解释器嵌入方式**。