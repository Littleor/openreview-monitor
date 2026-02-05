# OpenReview Monitor

A full-stack web application for monitoring OpenReview paper submissions and receiving email notifications when reviews are posted or decisions are announced.

## Features

- **Paper Monitoring**: Add OpenReview papers to monitor for updates
- **Email Notifications**: Get notified when reviews are available or decisions are announced
- **Multi-subscriber Support**: Multiple users can subscribe to the same paper
- **Admin Dashboard**: Manage papers, subscribers, and system configuration
- **Automatic Checking**: Scheduled background tasks check for updates regularly

## Tech Stack

### Backend
- **Python** with **FastAPI** - Modern, fast web framework
- **SQLAlchemy** - ORM for database operations
- **SQLite** - Lightweight database
- **APScheduler** - Background task scheduling
- **openreview-py** - OpenReview API client

### Frontend
- **React 18** with **TypeScript**
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **React Router** - Client-side routing

## Project Structure

```
openreview-monitor/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entry point
│   │   ├── config.py         # Configuration management
│   │   ├── database.py       # Database connection
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── schemas.py        # Pydantic schemas
│   │   ├── routers/          # API routes
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utility functions
│   ├── pyproject.toml
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   └── lib/              # Utilities and API client
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- uv (Python package manager)
- pnpm (Node.js package manager)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment file and configure:
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. Install dependencies and run:
   ```bash
   uv sync
   uv run uvicorn app.main:app --reload
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

The frontend will be available at `http://localhost:3000`

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_PASSWORD` | Admin login password | `admin` |
| `DATABASE_URL` | SQLite database path | `sqlite:///./openreview_monitor.db` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | SMTP username | - |
| `SMTP_PASSWORD` | SMTP password | - |
| `FROM_EMAIL` | Sender email address | - |
| `CHECK_INTERVAL` | Check interval in minutes | `30` |

## API Endpoints

### Public APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/papers` | Add a paper to monitor |
| GET | `/api/papers/{id}/status` | Get paper status |

### Admin APIs (Requires Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/papers` | List all papers |
| DELETE | `/api/admin/papers/{id}` | Delete a paper |
| PUT | `/api/admin/papers/{id}` | Update a paper |
| GET | `/api/admin/subscribers` | List all subscribers |
| DELETE | `/api/admin/subscribers/{id}` | Delete a subscriber |
| GET | `/api/admin/config` | Get configuration |
| PUT | `/api/admin/config` | Update configuration |
| POST | `/api/admin/check-now` | Trigger immediate check |

## Usage

### Adding a Paper to Monitor

1. Go to the home page
2. Enter the OpenReview URL or paper ID
3. Enter your email address
4. (Optional) Enter the paper password if required
5. Select notification preferences
6. Click "Add Paper to Monitor"

### Admin Dashboard

1. Go to `/admin`
2. Login with your admin password
3. Manage papers, subscribers, and configuration

## License

MIT
