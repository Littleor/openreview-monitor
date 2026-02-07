# OpenReview Monitor / OpenReview 论文监控助手

[English](README.md)

OpenReview 论文更新邮件提醒。

OpenReview Monitor 用于监控指定论文的评审动态与录用结果：当有新 Review 或 Decision 发布时，系统会自动发送邮件通知。

## 在线体验
- 前端: [openreview-monitor.vercel.app](https://openreview-monitor.vercel.app)
- 后端 API: [openreview-monitor-api.littleor.cn](https://openreview-monitor-api.littleor.cn/)

## 截图
<p align="center">
  <img alt="主页" src="assets/screenshot-homepage.png" width="48%" />
  <img alt="管理后台" src="assets/screenshot-admin-panel.png" width="48%" />
</p>

## 功能亮点
- 通过链接或 ID 监控指定 OpenReview 论文。
- Review / Decision 更新自动邮件提醒。
- 管理后台（`/admin`）：管理论文与订阅者、手动触发检查。
- 可自建后端：FastAPI + SQLite + SMTP（无需公网服务器）。
- 前端支持在托管后端与自建后端之间切换。

## 工作原理
- 后端按固定间隔（`CHECK_INTERVAL`）定时检查 OpenReview 状态。
- 状态落库到 SQLite，通知通过 SMTP 邮件发送。
- 前端只是轻量客户端，可连接托管后端或你的自建后端。

## 快速开始（托管版）
1. 打开前端页面。
2. 粘贴 OpenReview 论文链接或 ID。
3. 填写接收邮箱。
4. 可选: 某些会议需要登录才能查看结果，可填写 OpenReview 账号密码。
5. 提交后等待邮件通知。

## 自建后端（无需公网服务器）
后端可以运行在本机或内网机器上，无需公网服务器。

1. `cd backend`
2. `cp .env.example .env`，填写 `SMTP_*`、`FROM_EMAIL`、`ADMIN_PASSWORD`（生产环境建议同时设置 `SECRET_KEY`）。
3. `uv sync`
4. `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. 在前端打开 `Backend Settings`，选择 `Custom`，填写 `http://localhost:8000`（会自动补全 `/api`）。

说明:
- 如果你需要填写 OpenReview 账号密码，强烈建议自建后端，把敏感信息控制在自己手里。
- 如果使用托管前端，请把 `https://openreview-monitor.vercel.app` 加入 `backend/.env` 的 `CORS_ALLOW_ORIGINS`。
- 如果后端部署在另一台机器（内网/公网），建议启用 HTTPS，详见部署文档。

## 邮箱白名单
请将 `no_reply@littleor.cn` 加入邮箱白名单，避免漏收通知。

## 文档
- 后端部署: `docs/backend_deploy_zh.md`
- 开发指南: `docs/development_zh.md`

## 贡献
欢迎提交 Issue / PR，本地开发环境见 `docs/development_zh.md`。

## 许可证
MIT。

## 免责声明
本项目与 OpenReview 官方无关。

## 祝愿
期望大家多中 Paper！
