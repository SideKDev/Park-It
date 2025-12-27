"""
PushToken Model
SQLAlchemy model for push notification tokens
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class PushToken(Base):
    __tablename__ = "push_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    token = Column(String, unique=True, nullable=False, index=True)
    platform = Column(String, nullable=False)  # ios, android
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="push_tokens")
