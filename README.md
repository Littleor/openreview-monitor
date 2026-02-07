# OpenReview Monitor

[中文指南](README_zh.md)

An automated system for monitoring OpenReview paper submissions, tracking reviews, and sending email notifications.

## Features

- **Paper Monitoring**: Track status updates of specific OpenReview papers by URL or ID.
- **Email Notifications**: Receive alerts automatically when new reviews are posted or decisions are released.
- **Multi-user Support**: Multiple users can subscribe to monitor the same paper with individual preferences.
- **Admin Dashboard**: Web interface for managing papers, subscribers, and system settings.
- **Automatic Checking**: Background scheduler checks for updates periodically (default: every 30 mins).
- **Backend Switcher**: Frontend can point to the official backend or a custom deployment.

## Tech Stack

### Backend
- **FastAPI**: High-performance web framework.
- **SQLAlchemy & SQLite**: Lightweight ORM and database.
- **APScheduler**: Background task scheduling.
- **OpenReview-py**: Official OpenReview API client.
- **uv**: Fast Python package manager.

### Frontend
- **React 18 & TypeScript**: Modern UI development.
- **Vite**: Fast build tool.
- **TailwindCSS**: Utility-first CSS framework.
- **shadcn/ui**: Component library.

## Project Structure

```
openreview-monitor/
├── backend/           # FastAPI application
│   ├── app/
│   │   ├── main.py    # Entry point
│   │   └── ...
│   ├── pyproject.toml # Dependencies
│   └── .env.example   # Config template
│
├── frontend/          # React application
│   ├── src/           # Source code
│   └── ...
│
└── README.md
```

## Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- `uv` (Python package manager)
- `npm` or `pnpm`

### 1. Backend (Dev)

```bash
cd backend
cp .env.example .env
# Edit .env with your SMTP settings and Admin password
uv sync
uv run python -m app.server --reload
```
Server runs at `http://0.0.0.0:8000` by default.

Optional startup flags:
```bash
uv run python -m app.server --host 0.0.0.0 --port 8001 --db-path ./data/monitor.db
```

### 2. Frontend (Dev)

```bash
cd frontend
pnpm install  # or npm install
npm run dev
```
UI runs at `http://localhost:3000` (this repo pins Vite to port 3000 in `frontend/vite.config.ts`).

Optional frontend env:
- `VITE_OFFICIAL_API_BASE_URL`: The official backend base URL. The UI will append `/api` if missing.

## Usage

### Monitor a Paper

1. **Find Paper**: Copy the URL or ID of the OpenReview paper you want to track.
2. **Subscribe**: On the home page, paste the URL/ID and enter your email.
3. **Credentials (Optional)**: Some venues require login to access reviews or decisions. If you provide credentials, they are used only to fetch paper status. Use at your own risk, or self-host for stronger security.
4. **Submit**: Click "Add Paper to Monitor". You will receive notifications when the paper status changes.

## Backend Selection (Official vs Custom)

The frontend lets users switch between the official backend and a custom deployment. This is useful for users who prefer to self-host.

**CORS reminder (important):**
If you use a custom backend, make sure it allows the frontend origin. Local dev uses `http://localhost:3000` by default; if you change the Vite port (for example to 5173), add that origin too.

## Deployment

For self-hosted backend deployment (env, startup, and switching the frontend to your backend), see `docs/backend_deploy.md`.

### Admin Dashboard

Access `/admin` (e.g., `http://localhost:3000/admin`).
Login with the password set in `ADMIN_PASSWORD` (default: `admin`).

**Features:**
- **Manage Papers**: View all monitored papers and delete ones no longer needed.
- **Manage Subscribers**: View and remove subscribers.
- **System Check**: Manually trigger an update check via "Check Now".

## Configuration

Configure `backend/.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Admin dashboard password | `admin` |
| `DATABASE_URL` | Database path | `sqlite:///./openreview_monitor.db` |
| `DB_PATH` | SQLite DB file path (used if `DATABASE_URL` not set) | - |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email username | - |
| `SMTP_PASSWORD` | Email password (use App Password for Gmail) | - |
| `CHECK_INTERVAL` | Check interval in minutes | `30` |
| `CORS_ALLOW_ORIGINS` | CORS allowlist (comma-separated, `*` to allow all) | `*` |
| `APP_HOST` | Server bind host (used by `python -m app.server`) | `0.0.0.0` |
| `APP_PORT` | Server bind port (used by `python -m app.server`) | `8000` |

## FAQ

**Q: Why do I see both port 3000 and 5173 mentioned? Should there be only one?**
A: This project pins the Vite dev server to port 3000 in `frontend/vite.config.ts`. Port 5173 is simply Vite's default when you do not set a port. So in this repo, you should normally see only 3000 unless you remove or change that config.

## License

MIT License
