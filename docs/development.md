# Development Guide

[中文](development_zh.md)

This document covers local development for both backend and frontend.

## Prerequisites
- Python 3.10+
- Node.js 18+
- `uv` for Python dependencies
- `npm` or `pnpm` for frontend dependencies

## Backend (FastAPI)
1. `cd backend`
2. `cp .env.example .env`
3. Update `.env` with your SMTP settings and `ADMIN_PASSWORD`.
4. Optional: use a local DB to avoid modifying the tracked SQLite file. Set `DATABASE_URL=sqlite:///./openreview_monitor_local.db`.
5. `uv sync`
6. `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

The backend will be available at `http://localhost:8000`.

## Frontend (Vite + React)
1. `cd frontend`
2. `pnpm install` (or `npm install`)
3. `npm run dev`

The frontend will be available at `http://localhost:3000`.

Optional frontend env:
- `VITE_OFFICIAL_API_BASE_URL`: overrides the default official backend base URL.
- `VITE_ANALYTICS_SRC`: injects an async analytics script tag with the given `src` URL.

## Linting
- `cd frontend`
- `npm run lint`

## Notes
- There are no automated backend tests in this repo yet.
- If you change the frontend dev port, add it to `CORS_ALLOW_ORIGINS` in `backend/.env`.
