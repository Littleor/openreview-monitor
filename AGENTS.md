# OpenReview Monitor Agent Guide

## Overview
OpenReview Monitor is a FastAPI + React system that tracks OpenReview papers, checks for new reviews/decisions on a schedule, and emails subscribers.

## Repo Layout
- `backend/app/main.py`: FastAPI app startup (DB init + scheduler) and router registration.
- `backend/app/routers/`: API endpoints (`papers`, `admin`, `subscribers`).
- `backend/app/services/`: OpenReview API access, scheduler logic, and email delivery.
- `backend/app/models.py`: SQLAlchemy models (Paper, Subscriber, Config).
- `backend/app/schemas.py`: Pydantic request/response models.
- `frontend/src/pages/`: Page-level routes (`Home`, `Admin`).
- `frontend/src/components/`: UI components (forms, lists, login).
- `frontend/src/lib/api.ts`: Frontend API client and shared types.
- `frontend/vite.config.ts`: Dev server and `/api` proxy to backend.

## Local Dev
### Backend (FastAPI)
- Use `uv` for Python dependencies.
- Commands:
  - `cd backend`
  - `cp .env.example .env`
  - `uv sync`
  - `uv run uvicorn app.main:app --reload`
- Runs on `http://localhost:8000`.

### Frontend (Vite + React)
- Commands:
  - `cd frontend`
  - `pnpm install` (or `npm install`)
  - `npm run dev`
- Runs on `http://localhost:3000` and proxies `/api` to the backend.

### Linting
- `cd frontend`
- `npm run lint`

## Data and Config
- SQLite database is stored at `backend/openreview_monitor.db` and is tracked in git.
  - Avoid committing local data changes. If you need a local DB, set `DATABASE_URL=sqlite:///./openreview_monitor_local.db` in `backend/.env`.
- Required config lives in `backend/.env`:
  - `ADMIN_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`, `CHECK_INTERVAL`.

## Behavior Notes
- Scheduler starts in `backend/app/main.py` and runs `check_all_papers` every `CHECK_INTERVAL` minutes.
- OpenReview access is centralized in `backend/app/services/openreview.py`.
- Email templates and SMTP delivery live in `backend/app/services/email.py`.
- Admin config updates are stored in the `Config` table and override `.env` defaults.

## Making Changes
- New backend endpoints:
  - Add/adjust Pydantic models in `backend/app/schemas.py`.
  - Implement route in `backend/app/routers/`.
  - Update frontend client types and calls in `frontend/src/lib/api.ts`.
- OpenReview logic changes should go through `OpenReviewService`.
- Email behavior changes should go through `EmailService` templates.

## Tests
- No automated backend tests are present.
- Use `npm run lint` for frontend checks.
