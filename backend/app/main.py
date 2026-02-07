from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .database import init_db
from .routers import papers, admin, subscribers
from .services.scheduler import start_scheduler, stop_scheduler
from .config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

settings = get_settings()


def parse_cors_origins(value: str) -> list[str]:
    """Parse comma-separated CORS origins."""
    if not value or value.strip() == "*":
        return ["*"]
    return [origin.strip() for origin in value.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting OpenReview Monitor...")
    init_db()
    start_scheduler(settings.check_interval)
    logger.info("Application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down...")
    stop_scheduler()
    logger.info("Application shutdown complete")


app = FastAPI(
    title="OpenReview Monitor",
    description="Monitor OpenReview paper submissions and get notified of reviews and decisions",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_cors_origins(settings.cors_allow_origins),
    allow_origin_regex=settings.cors_allow_origin_regex or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(papers.router)
app.include_router(admin.router)
app.include_router(subscribers.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "OpenReview Monitor",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.get("/api/health")
async def api_health_check():
    """Health check endpoint under /api for frontend health checks."""
    return {"status": "healthy"}
