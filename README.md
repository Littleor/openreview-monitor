# OpenReview Monitor

[中文说明](README_zh.md)

OpenReview Monitor is a lightweight OpenReview paper tracker. It watches for new reviews or decisions and emails you when updates appear.

## Live Demo
- Frontend: [openreview-monitor.vercel.app](https://openreview-monitor.vercel.app)
- Backend API: [openreview-monitor-api.littleor.cn](https://openreview-monitor-api.littleor.cn/)

## Screenshots
![Homepage](assets/screenshot-homepage.png)
![Admin Panel](assets/screenshot-admin-panel.png)

## What It Is
- Monitor specific OpenReview papers by URL or ID.
- Get notified when new reviews or decisions are posted.
- Manage papers and subscribers in a simple admin panel.

## How to Use
1. Open the frontend.
2. Paste an OpenReview paper URL or ID.
3. Enter your email.
4. Optional: add OpenReview credentials for venues that require login.
5. Submit and wait for notifications.

## Self-host Backend (No Public Server Required)
You can run the backend on your own machine or private network. No public server is required.

1. `cd backend`
2. `cp .env.example .env` and fill `SMTP_*`, `FROM_EMAIL`, and `ADMIN_PASSWORD`.
3. `uv sync`
4. `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
5. In the frontend, open `Backend Settings`, choose `Custom`, and set the base to `http://localhost:8000` (the UI auto-appends `/api`).

Notes:
- If you use the official frontend, add `https://openreview-monitor.vercel.app` to `CORS_ALLOW_ORIGINS` in `backend/.env`.
- Full deployment guide: `docs/backend_deploy.md`.
- Development guide: `docs/development.md`.

## Email Whitelist
Please add `no_reply@littleor.cn` to your email whitelist to avoid missing notifications.

## Wish
May you all get accepted papers and great reviews.
