"""
ParkingSession Model
SQLAlchemy model for parking sessions
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Float, Integer, Text
from sqlalchemy.orm import relationship
from db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class ParkingSession(Base):
    __tablename__ = "parking_sessions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    zone_code = Column(String, nullable=True)
    borough = Column(String, nullable=True)
    
    # Status
    status = Column(String, nullable=False)  # green, yellow, red
    status_reason = Column(String, nullable=False)
    parking_type = Column(String, nullable=False)  # meter, street_cleaning, free, no_parking
    
    # Rules (stored as JSON string)
    rules_json = Column(Text, nullable=True)
    
    # Timestamps
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # When parking permission expires
    
    # Payment
    payment_status = Column(String, default="unpaid")  # unpaid, paid, expired
    payment_method = Column(String, nullable=True)  # parkmobile, paybyphone, coin, other
    paid_duration_minutes = Column(Integer, nullable=True)
    payment_expires_at = Column(DateTime, nullable=True)
    
    # Detection
    detection_method = Column(String, default="manual")  # manual, bluetooth, activity_recognition
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="parking_sessions")
