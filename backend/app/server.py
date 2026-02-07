import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
import uvicorn

DEFAULT_HOST = "0.0.0.0"
DEFAULT_PORT = 8000
DEFAULT_DB_PATH = "./openreview_monitor.db"


def _sqlite_url_from_path(path: str) -> str:
    if path == ":memory:":
        return "sqlite:///:memory:"
    if "://" in path:
        return path

    db_path = Path(path)
    if db_path.is_absolute():
        # Absolute paths need four slashes: sqlite:////absolute/path.db
        return f"sqlite:////{db_path.as_posix().lstrip('/')}"

    return f"sqlite:///{db_path.as_posix()}"


def _load_env() -> None:
    cwd_env = Path.cwd() / ".env"
    backend_env = Path(__file__).resolve().parent.parent / ".env"

    if cwd_env.exists():
        load_dotenv(cwd_env, override=False)
    if backend_env.exists() and backend_env != cwd_env:
        load_dotenv(backend_env, override=False)


def _parse_port(value: str | None) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError as exc:
        raise SystemExit(f"Invalid port: {value}") from exc


def main() -> None:
    _load_env()

    parser = argparse.ArgumentParser(description="OpenReview Monitor server")
    parser.add_argument("--host", help="Bind host (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, help="Bind port (default: 8000)")
    parser.add_argument(
        "--db-path",
        "--db",
        dest="db_path",
        help="SQLite database file path (overrides DATABASE_URL if set)",
    )
    parser.add_argument(
        "--database-url",
        "--db-url",
        dest="database_url",
        help="Full database URL (highest priority)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload (development only)",
    )
    args = parser.parse_args()

    host = args.host or os.getenv("APP_HOST") or DEFAULT_HOST
    env_port = _parse_port(os.getenv("APP_PORT"))
    port = args.port or env_port or DEFAULT_PORT

    if args.database_url:
        database_url = args.database_url
    elif args.db_path:
        database_url = _sqlite_url_from_path(args.db_path)
    elif os.getenv("DATABASE_URL"):
        database_url = os.getenv("DATABASE_URL")
    elif os.getenv("DB_PATH"):
        database_url = _sqlite_url_from_path(os.getenv("DB_PATH", ""))
    else:
        database_url = _sqlite_url_from_path(DEFAULT_DB_PATH)

    os.environ["DATABASE_URL"] = database_url

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
