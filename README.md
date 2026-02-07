# OpenReview Monitor

[中文说明](README_zh.md)

OpenReview Monitor is a clean, reliable tracker for OpenReview papers. It watches your submissions for new reviews or decisions and notifies you by email.

## Live Demo
- Frontend: [openreview-monitor.vercel.app](https://openreview-monitor.vercel.app)
- Backend API: [openreview-monitor-api.littleor.cn](https://openreview-monitor-api.littleor.cn/)

## Screenshots
![Homepage](assets/screenshot-homepage.png)
![Admin Panel](assets/screenshot-admin-panel.png)

## What It Does
- Track specific OpenReview papers by URL or ID.
- Notify you when reviews or decisions are posted.
- Offer a simple admin panel for managing papers and subscribers.

## Quick Start (Hosted)
1. Open the frontend.
2. Paste an OpenReview paper URL or ID.
3. Enter your email address.
4. Optional: provide OpenReview credentials for venues that require login.
5. Submit and wait for notifications.

## Self-host Backend (No Public Server Required)
You can run the backend on your own machine or private network. A public server is not required.

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
