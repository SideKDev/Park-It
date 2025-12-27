"""
Database Configuration
SQLAlchemy setup and connection management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL - use SQLite for development, PostgreSQL for production
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./park_it.db"
)

# Handle postgres:// vs postgresql:// for SQLAlchemy 1.4+
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # SQLite specific
    )
else:
    engine = create_engine(DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def create_tables():
    """Create all database tables"""
    # Import all models to register them with Base
    from models.user import User, SavedLocation
    from models.parking_session import ParkingSession
    from models.push_token import PushToken
    
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


def get_db():
    """
    Dependency to get database session.
    Yields a session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
