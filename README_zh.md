# OpenReview Monitor / OpenReview 论文监控助手

[English](README.md) | [中文](README_zh.md)

一个自动化的 OpenReview 论文监控系统，用于追踪论文投稿状态、新出的 Review 以及发送邮件通知。

## 功能特性

- **论文监控**：输入 OpenReview 链接或 ID，即可追踪特定论文的状态更新。
- **邮件通知**：当有新的 Review 发布、状态变更或结果公布时，系统会自动发送邮件提醒。
- **多用户支持**：支持多用户订阅同一篇论文，每个用户可单独设置通知偏好。
- **管理后台**：提供直观的 Web 界面，管理员可统一管理论文、订阅者及系统配置。
- **自动检查**：后台定时任务（默认 30 分钟）自动检查论文更新，无需人工干预。
- **后端切换**：前端支持切换官方后端或自建后端。

## 技术栈

### 后端 (Backend)
- **FastAPI**: 现代高性能 Web 框架，提供快速的 API 服务。
- **SQLAlchemy & SQLite**: 使用轻量级 SQLite 数据库，无需额外部署数据库服务。
- **APScheduler**: 强大的后台定时任务调度库。
- **OpenReview-py**: 官方 OpenReview API 客户端，确保数据获取的准确性。
- **uv**: 极速 Python 包管理器和项目管理工具。

### 前端 (Frontend)
- **React 18 & TypeScript**: 前端主流框架与类型安全保证。
- **Vite**: 极速构建工具，提供秒级热更新体验。
- **TailwindCSS**: 原子化 CSS 框架，快速构建现代界面。
- **shadcn/ui**: 优质的 UI 组件库，界面美观大气。

## 项目结构

```
openreview-monitor/
├── backend/           # Python FastAPI 后端应用
│   ├── app/
│   │   ├── main.py    # 应用入口文件
│   │   ├── routers/   # API 路由定义
│   │   └── services/  # 核心业务逻辑 (调度器, 邮件发送等)
│   ├── pyproject.toml # Python 依赖配置 (uv)
│   └── .env.example   # 环境变量配置模板
│
├── frontend/          # React 前端应用
│   ├── src/           # 源代码目录
│   ├── package.json   # Node 项目依赖配置
│   └── vite.config.ts # Vite 构建配置
│
└── README.md
```

## 本地开发

### 前置要求
- Python 3.10+
- Node.js 18+
- `uv` (推荐使用的 Python 包管理器，也可使用 pip)
- `npm` 或 `pnpm` (Node.js 包管理器)

### 1. 后端（开发）

进入后端目录并配置环境：

```bash
# 进入目录
cd backend

# 复制配置文件
cp .env.example .env

# 编辑 .env 文件
# 必须要配置的是关于邮件发送的部分，否则无法收到通知
# ADMIN_PASSWORD 建议修改为复杂的密码
vim .env 
```

安装依赖并启动服务：

```bash
# 使用 uv 同步依赖
uv sync

# 启动开发服务器
uv run python -m app.server --reload
```
后端服务默认在 `http://0.0.0.0:8000` 启动。

可选启动参数：
```bash
uv run python -m app.server --host 0.0.0.0 --port 8001 --db-path ./data/monitor.db
```

### 2. 前端（开发）

进入前端目录并启动：

```bash
# 进入目录
cd frontend

# 安装依赖 (推荐 pnpm)
pnpm install
# 或者
npm install

# 启动开发服务器
npm run dev
```
前端界面默认在 `http://localhost:3000` 启动（本仓库已在 `frontend/vite.config.ts` 固定了端口）。

可选前端环境变量：
- `VITE_OFFICIAL_API_BASE_URL`：官方后端地址，若未包含 `/api` 会自动补全。

## 使用说明

### 添加监控论文

1. **获取链接/ID**: 打开 OpenReview 网站，找到你想要监控的论文页面。复制浏览器的 URL，或者复制 URL 最后的 ID (例如 `forum?id=xxxxx` 中的 `xxxxx`)。
2. **访问首页**: 打开本系统的首页。
3. **填写信息**:
   - 在输入框中粘贴论文链接或 ID。
   - 输入你的接收邮箱地址。
   - (可选) 某些会议需要登录才能查看结果，输入账号密码。我们仅使用账号访问论文状态，风险自行承担；如需更安全，建议自建后端。
4. **提交订阅**: 点击“Add Paper to Monitor”按钮。
5. **确认**: 系统会尝试获取论文信息，如果成功，你将看到成功提示。

## 官方后端 / 自建后端切换

前端支持在官方后端与自建后端之间切换，方便用户自行部署后端。

**跨域提醒（重要）：**
如果使用自建后端，请确保后端 CORS 允许当前前端域名。本地开发默认是 `http://localhost:3000`；如果你改成 5173 或其他端口，也要加进去。

## 部署

自建后端部署（环境变量、启动方式、以及如何让前端切换到自建后端）请见 `docs/backend_deploy.md`。

### 管理后台

管理员可以通过后台管理所有数据。

1. **访问地址**: 在浏览器访问 `/admin` 路径（例如 `http://localhost:3000/admin`）。
2. **登录**: 输入 `.env` 中配置的 `ADMIN_PASSWORD`（默认为 `admin`）。
3. **功能模块**:
   - **Papers**: 查看所有正在监控的论文列表，支持手动删除不再关注的论文。
   - **Subscribers**: 查看所有订阅用户，支持移除特定用户的订阅。
   - **Configuration**: 查看当前的系统配置。
   - **Check Now**: 手动触发一次立即检查更新（用于调试或着急查看结果）。

## 配置详解

`backend/.env` 文件控制系统的核心行为：

| 变量名 | 描述 | 默认值 | 备注 |
|--------|------|--------|------|
| `ADMIN_PASSWORD` | 管理后台登录密码 | `admin` | **生产环境务必修改** |
| `DATABASE_URL` | 数据库连接字符串 | `sqlite:///./openreview_monitor.db` | 默认使用 SQLite 文件 |
| `DB_PATH` | SQLite 数据库文件路径（仅当 `DATABASE_URL` 未设置时生效） | - | |
| `SMTP_HOST` | 邮件服务器地址 | `smtp.gmail.com` | Gmail 示例 |
| `SMTP_PORT` | 邮件服务器端口 | `587` | 通常为 587 (TLS) |
| `SMTP_USER` | 发件人邮箱账号 | - | |
| `SMTP_PASSWORD` | 发件人邮箱密码/应用授权码 | - | Gmail 需使用应用专用密码 |
| `CHECK_INTERVAL` | 自动检查间隔（分钟） | `30` | 建议不低于 10 分钟 |
| `CORS_ALLOW_ORIGINS` | CORS 允许的域名列表（逗号分隔，`*` 表示全部） | `*` | |
| `APP_HOST` | 后端绑定地址（`python -m app.server` 使用） | `0.0.0.0` | |
| `APP_PORT` | 后端端口（`python -m app.server` 使用） | `8000` | |

## 常见问题

**Q: 为什么会看到 3000 和 5173 两个端口？不是应该只有一个吗？**  
A: 本仓库在 `frontend/vite.config.ts` 里把 Vite 开发端口固定为 3000。5173 是 Vite 的默认端口，只有在你移除或修改端口配置时才会出现。

**Q: 为什么收不到邮件？**
A: 请检查 `.env` 中的 SMTP 配置是否正确。如果是 Gmail，通常需要开启二步验证并生成“应用专用密码”填入 `SMTP_PASSWORD`，而不是使用你的登录密码。

**Q: 如何部署到服务器？**
A: 前端建议使用 `npm run build` 打包后通过 Nginx 托管；后端建议使用 Docker 或 Supervisor 保持后台运行。

## 许可证

MIT License
