# OpenReview Monitor / OpenReview 论文监控助手

[English](README.md)

OpenReview Monitor 是一个专业、轻量的 OpenReview 论文监控系统，自动追踪 Review 与录用结果，并通过邮件通知你。

## 在线体验
- 前端: [openreview-monitor.vercel.app](https://openreview-monitor.vercel.app)
- 后端 API: [openreview-monitor-api.littleor.cn](https://openreview-monitor-api.littleor.cn/)

## 截图
![主页](assets/screenshot-homepage.png)
![管理后台](assets/screenshot-admin-panel.png)

## 这是什么
- 通过链接或 ID 监控指定 OpenReview 论文。
- 有新 Review 或决定时自动邮件提醒。
- 提供简洁的管理后台，统一管理论文与订阅者。

## 快速使用（托管版）
1. 打开前端页面。
2. 粘贴 OpenReview 论文链接或 ID。
3. 填写接收邮箱。
4. 可选: 某些会议需要登录才能查看结果，可填写 OpenReview 账号密码。
5. 提交后等待邮件通知。

## 自建后端（无需公网服务器）
后端可以运行在本机或内网机器上，无需公网服务器。

1. `cd backend`
2. `cp .env.example .env`，填写 `SMTP_*`、`FROM_EMAIL`、`ADMIN_PASSWORD`。
3. `uv sync`
4. `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. 在前端打开 `Backend Settings`，选择 `Custom`，填写 `http://localhost:8000`（会自动补全 `/api`）。

说明:
- 如果使用官方前端，请把 `https://openreview-monitor.vercel.app` 加入 `backend/.env` 的 `CORS_ALLOW_ORIGINS`。
- 完整部署指南见 `docs/backend_deploy.md`。
- 开发文档见 `docs/development_zh.md`。

## 邮箱白名单
请将 `no_reply@littleor.cn` 加入邮箱白名单，避免漏收通知。

## 期望
期望大家多中 Paper！
