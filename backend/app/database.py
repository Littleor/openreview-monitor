from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import get_settings
from .utils.crypto import encrypt_value

settings = get_settings()

# Create engine with SQLite
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
    ensure_subscriber_columns()
    ensure_encrypted_secrets()


def ensure_subscriber_columns():
    """Lightweight migration for new subscriber flags."""
    inspector = inspect(engine)
    if "subscribers" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("subscribers")}
    if "notify_on_review_modified" not in columns:
        with engine.begin() as conn:
            conn.execute(text(
                "ALTER TABLE subscribers "
                "ADD COLUMN notify_on_review_modified BOOLEAN DEFAULT 1"
            ))
            conn.execute(text(
                "UPDATE subscribers SET notify_on_review_modified = 1 "
                "WHERE notify_on_review_modified IS NULL"
            ))


def ensure_encrypted_secrets():
    """Encrypt stored secrets in the database if needed."""
    from .models import Paper, Config
    db = SessionLocal()
    try:
        updated = False

        papers = db.query(Paper).all()
        for paper in papers:
            if paper.openreview_username:
                encrypted = encrypt_value(paper.openreview_username)
                if encrypted != paper.openreview_username:
                    paper.openreview_username = encrypted
                    updated = True
            if paper.openreview_password:
                encrypted = encrypt_value(paper.openreview_password)
                if encrypted != paper.openreview_password:
                    paper.openreview_password = encrypted
                    updated = True

        smtp_config = db.query(Config).filter(Config.key == "smtp_password").first()
        if smtp_config and smtp_config.value:
            encrypted = encrypt_value(smtp_config.value)
            if encrypted != smtp_config.value:
                smtp_config.value = encrypted
                updated = True

        if updated:
            db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
