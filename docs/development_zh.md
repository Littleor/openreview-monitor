# 开发指南

[English](development.md)

本文档说明如何进行本地开发（后端 + 前端）。

## 前置要求
- Python 3.10+
- Node.js 18+
- `uv`（Python 依赖管理）
- `npm` 或 `pnpm`（前端依赖管理）

## 后端（FastAPI）
1. `cd backend`
2. `cp .env.example .env`
3. 编辑 `.env`，配置 SMTP 与 `ADMIN_PASSWORD`。
4. 可选：使用本地数据库，避免修改被 Git 跟踪的 SQLite 文件。设置 `DATABASE_URL=sqlite:///./openreview_monitor_local.db`。
5. `uv sync`
6. `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

后端默认地址：`http://localhost:8000`。

## 前端（Vite + React）
1. `cd frontend`
2. `pnpm install`（或 `npm install`）
3. `npm run dev`

前端默认地址：`http://localhost:3000`。

可选前端环境变量：
- `VITE_OFFICIAL_API_BASE_URL`：覆盖默认官方后端地址。
- `VITE_ANALYTICS_SRC`：注入一个 `async` 的统计脚本标签，`src` 取该变量的 URL。

## Lint
- `cd frontend`
- `npm run lint`

## 说明
- 本仓库暂无后端自动化测试。
- 如果你修改了前端端口，需要把新端口加入 `backend/.env` 的 `CORS_ALLOW_ORIGINS`。
