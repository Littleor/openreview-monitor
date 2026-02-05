from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class Paper(Base):
    """Paper model for tracking OpenReview submissions."""
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    openreview_id = Column(String(255), unique=True, index=True, nullable=False)
    submission_number = Column(Integer, nullable=True, index=True)  # Submission Number in the venue
    title = Column(String(500), nullable=True)
    venue = Column(String(255), nullable=True, index=True)  # e.g., "CVPR 2026", "ICLR 2026"
    # OpenReview credentials for private papers
    openreview_username = Column(String(255), nullable=True)
    openreview_password = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")  # pending, reviewed, accepted, rejected
    last_checked = Column(DateTime, nullable=True)
    review_data = Column(JSON, nullable=True)  # Cached review data
    decision_data = Column(JSON, nullable=True)  # Cached decision data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    subscribers = relationship("Subscriber", back_populates="paper", cascade="all, delete-orphan")


class Subscriber(Base):
    """Subscriber model for email notifications."""
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    email = Column(String(255), nullable=False)
    notify_on_review = Column(Boolean, default=True)
    notify_on_decision = Column(Boolean, default=True)
    notified_review = Column(Boolean, default=False)
    notified_decision = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    paper = relationship("Paper", back_populates="subscribers")


class Config(Base):
    """System configuration storage."""
    __tablename__ = "config"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)
