"""
User Model
SQLAlchemy model for users and saved locations
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    # OAuth provider IDs
    apple_id = Column(String, unique=True, nullable=True, index=True)
    google_id = Column(String, unique=True, nullable=True, index=True)
    
    # Primary provider used for registration
    provider = Column(String, nullable=False)  # 'apple' or 'google'
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    saved_locations = relationship("SavedLocation", back_populates="user", cascade="all, delete-orphan")
    parking_sessions = relationship("ParkingSession", back_populates="user", cascade="all, delete-orphan")
    push_tokens = relationship("PushToken", back_populates="user", cascade="all, delete-orphan")


class SavedLocation(Base):
    __tablename__ = "saved_locations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    name = Column(String, nullable=False)  # 'home', 'work', or custom
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="saved_locations")
