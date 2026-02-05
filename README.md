# OpenReview Monitor

[中文指南](README_zh.md)

An automated system for monitoring OpenReview paper submissions, tracking reviews, and sending email notifications.

## Features

- **Paper Monitoring**: Track status updates of specific OpenReview papers by URL or ID.
- **Email Notifications**: Receive alerts automatically when new reviews are posted or decisions are released.
- **Multi-user Support**: Multiple users can subscribe to monitor the same paper with individual preferences.
- **Admin Dashboard**: Web interface for managing papers, subscribers, and system settings.
- **Automatic Checking**: Background scheduler checks for updates periodically (default: every 30 mins).

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

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- `uv` (Python package manager)
- `npm` or `pnpm`

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your SMTP settings and Admin password
uv sync
uv run uvicorn app.main:app --reload
```
Server runs at `http://localhost:8000`.

### 2. Frontend Setup

```bash
cd frontend
pnpm install  # or npm install
npm run dev
```
UI runs at `http://localhost:5173`.

## Usage

### Monitor a Paper

1. **Find Paper**: Copy the URL or ID of the OpenReview paper you want to track.
2. **Subscribe**: On the home page, paste the URL/ID and enter your email.
3. **Submit**: Click "Add Paper to Monitor". You will receive notifications when the paper status changes.

### Admin Dashboard

Access `/admin` (e.g., `http://localhost:5173/admin`).
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
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | Email SMTP port | `587` |
| `SMTP_USER` | Email username | - |
| `SMTP_PASSWORD` | Email password (use App Password for Gmail) | - |
| `CHECK_INTERVAL` | Check interval in minutes | `30` |

## License

MIT License
