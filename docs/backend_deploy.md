# Backend Deployment Guide

[中文](backend_deploy_zh.md)

This guide explains how to run the OpenReview Monitor backend on your laptop, a private network, or a public server, and how to point the frontend to it.

## When to Self-host
- You want to use your own SMTP / sender domain.
- You plan to enter OpenReview credentials and want to keep them under your control.
- You want to share one backend with a lab/team.

## Prerequisites
- Python 3.10+
- `uv`

## Configure the Backend
From the repo root:

```bash
cd backend
cp .env.example .env
```

Minimal configuration (example):

```bash
ADMIN_PASSWORD=change-me
SECRET_KEY=change-me-too

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user@example.com
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=your_user@example.com

CHECK_INTERVAL=30

# Use an absolute path so data persists across restarts
DATABASE_URL=sqlite:////var/lib/openreview-monitor/openreview_monitor.db

# If you use the hosted frontend, include its origin here (avoid * in production)
CORS_ALLOW_ORIGINS=https://openreview-monitor.vercel.app
```

Notes:
- `ADMIN_PASSWORD` is used to login to `/admin`. Change it in production.
- `SECRET_KEY` is used to sign JWTs. Change it in production.
- Prefer a persistent `DATABASE_URL` path for long-running deployments.
- Keep `CORS_ALLOW_ORIGINS` as an allowlist in production.

## Run the Backend
Install dependencies:

```bash
uv sync
```

Start the server (recommended launcher supports `--db-path` / `--database-url` flags):

```bash
uv run python -m app.server --host 0.0.0.0 --port 8000
```

Health checks:
- `http://<host>:8000/health`
- `http://<host>:8000/api/health`

## Point the Frontend to Your Backend
Option A (recommended): in the UI, open `Backend Settings`:
1. Select `Custom`
2. Enter your backend base URL (for example `http://localhost:8000` or `https://your-backend.example.com`)
3. Confirm (the UI appends `/api` and runs a health check)

Option B: hardcode the official backend base URL at build time:

```bash
VITE_OFFICIAL_API_BASE_URL=https://your-backend.example.com
```

Then rebuild the frontend.

## HTTPS (Recommended for LAN/Public)
If your frontend is served over HTTPS (for example on Vercel), browsers will usually block requests to a LAN/public `http://` backend (mixed content). Put the backend behind HTTPS, or run the frontend locally.

Minimal Caddy config (automatic TLS):

```caddyfile
your-backend.example.com {
  reverse_proxy 127.0.0.1:8000
}
```

## systemd (Optional)
Example service unit:

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

## FAQ
**CORS errors in the frontend?**  
Add your frontend origin to `CORS_ALLOW_ORIGINS`, for example:

```bash
CORS_ALLOW_ORIGINS=https://openreview-monitor.vercel.app,http://localhost:3000
```
