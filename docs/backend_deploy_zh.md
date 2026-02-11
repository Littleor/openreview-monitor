# 后端部署指南（自建后端）

[English](backend_deploy.md)

本文档介绍如何在本机 / 内网 / 公网部署 OpenReview Monitor 后端，以及如何让前端使用你的后端服务。

## 适用场景
- 你希望使用自己的 SMTP 与发件域名。
- 你会填写 OpenReview 账号密码，希望敏感信息只在自己环境内保存。
- 你想在实验室/团队内共享一个后端服务。

## 准备工作
- Python 3.10+
- `uv`（推荐）

## 配置后端
进入后端目录并准备 `.env`：

```bash
cd backend
cp .env.example .env
```

最小可用配置（示例）：

```bash
ADMIN_PASSWORD=change-me
SECRET_KEY=change-me-too

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user@example.com
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=your_user@example.com

CHECK_INTERVAL=30

# 推荐使用绝对路径，确保重启后数据仍在
DATABASE_URL=sqlite:////var/lib/openreview-monitor/openreview_monitor.db

# 如果使用托管前端，务必加入该 Origin；生产环境建议不要使用 *
CORS_ALLOW_ORIGINS=https://openreview-monitor.vercel.app
```

说明:
- `ADMIN_PASSWORD` 用于后台 `/admin` 登录，生产环境务必设置强密码。
- `SECRET_KEY` 用于 JWT 签名，生产环境务必修改。
- `DATABASE_URL` 建议指向可持久化的位置（尤其是 systemd / Docker / 服务器部署）。
- `CORS_ALLOW_ORIGINS` 建议使用白名单，不要在公网环境使用 `*`。

## 启动后端
安装依赖：

```bash
uv sync
```

启动服务（推荐使用内置启动器，支持 `--db-path` / `--database-url` 等参数）：

```bash
uv run python -m app.server --host 0.0.0.0 --port 8000
```

健康检查：
- `http://<host>:8000/health`
- `http://<host>:8000/api/health`

## 让前端使用你的后端
方式 A（推荐）：在前端页面打开 `Backend Settings`：
1. 选择 `Custom`
2. 输入后端地址（例如 `http://localhost:8000` 或 `https://your-backend.example.com`）
3. 点击 `Confirm`（会自动补全 `/api` 并做健康检查）

方式 B：构建前端时固定后端地址：

```bash
VITE_OFFICIAL_API_BASE_URL=https://your-backend.example.com
```

然后重新构建前端。

可选：构建前端时注入统计脚本：

```bash
VITE_ANALYTICS_SRC=https://statistics.littleor.cn/track.js?site=your-site-id
```

会生成 `<script async src="..."></script>`。

## HTTPS 建议（内网/公网部署）
如果前端在 HTTPS 域名下（例如 Vercel 托管），浏览器通常会阻止访问内网/公网的 `http://` 后端（混合内容）。建议为后端加一层反向代理并启用 HTTPS（或改为本地运行前端）。

一个简单的 Caddy 示例（自动申请证书）：

```caddyfile
your-backend.example.com {
  reverse_proxy 127.0.0.1:8000
}
```

## systemd（可选）
用于开机自启/崩溃重启（示例）：

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

## 常见问题
**Q: 前端报跨域错误怎么办？**  
A: 把前端域名加入 `CORS_ALLOW_ORIGINS`，例如：

```bash
CORS_ALLOW_ORIGINS=https://openreview-monitor.vercel.app,http://localhost:3000
```

**Q: 托管前端能连上我本机的后端吗？**  
A: 通常可以（使用 `http://localhost:8000` / `http://127.0.0.1:8000`），但不同浏览器策略可能有差异；遇到限制时，可本地运行前端或给后端加 HTTPS。
