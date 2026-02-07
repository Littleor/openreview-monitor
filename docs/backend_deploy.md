# 自建后端部署指南

本文档说明如何在服务器上部署 OpenReview Monitor 后端，以及如何让前端切换到自建后端。

## 1. 部署步骤（后端）

### 1.1 准备环境
- 一台可访问公网的服务器
- Python 3.10+
- `uv`（推荐的 Python 包管理器）

### 1.2 拉取代码
```bash
git clone <your-repo-url> openreview-monitor
cd openreview-monitor/backend
```

### 1.3 配置环境变量
```bash
cp .env.example .env
```

编辑 `backend/.env`，重点关注以下配置：

- `ADMIN_PASSWORD`: 管理后台登录密码（生产环境务必修改）
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD` / `FROM_EMAIL`: 邮件发送配置（必须）
- `CHECK_INTERVAL`: 后台检查间隔（分钟）
- `DATABASE_URL` 或 `DB_PATH`: 数据库地址
  - 推荐使用绝对路径，例如 `DATABASE_URL=sqlite:////var/lib/openreview/openreview_monitor.db`
- `CORS_ALLOW_ORIGINS`: 允许前端访问的域名（逗号分隔）
  - 例如 `CORS_ALLOW_ORIGINS=https://your-frontend.com`
- `APP_HOST` / `APP_PORT`: 后端监听地址与端口
- `SECRET_KEY`: JWT 加密密钥（建议生产环境设置）

> 提示：`python -m app.server` 启动时会优先使用 `DATABASE_URL`，如果未设置才使用 `DB_PATH`。

### 1.4 安装依赖
```bash
uv sync
```

### 1.5 启动服务
```bash
uv run python -m app.server --host 0.0.0.0 --port 8000
```

服务启动后可通过以下地址检查健康状态：
- `http://<your-server>:8000/health`
- `http://<your-server>:8000/api/health`

### 1.6 （可选）使用 systemd 守护进程
如果希望服务开机自启，可以使用 systemd 管理：

```ini
[Unit]
Description=OpenReview Monitor Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/openreview-monitor/backend
ExecStart=/usr/bin/uv run python -m app.server --host 0.0.0.0 --port 8000
Restart=always
EnvironmentFile=/opt/openreview-monitor/backend/.env

[Install]
WantedBy=multi-user.target
```

## 2. 前端切换到自建后端

有两种方式：

### 方式 A：前端界面切换（推荐）
在前端页面中打开 `Backend Settings`：
1. 选择 `Custom`
2. 输入自建后端地址，例如 `https://your-backend.com`
3. 点击 `Confirm`

系统会自动补全 `/api` 并执行健康检查。

### 方式 B：通过环境变量固定后端
在前端构建时设置：
```
VITE_OFFICIAL_API_BASE_URL=https://your-backend.com
```

然后重新构建前端。此时 `Official` 模式会默认使用该地址。

## 3. 常见问题

**Q: 前端报跨域错误怎么办？**  
A: 在后端 `.env` 中设置 `CORS_ALLOW_ORIGINS`，把前端域名加进去，例如：
```
CORS_ALLOW_ORIGINS=https://your-frontend.com
```
