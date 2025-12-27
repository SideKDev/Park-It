"""
Parking Routes
Session CRUD and status endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from db.database import get_db
from api.dependencies import get_current_user
from models.user import User
from models.parking_session import ParkingSession
from services.rules_engine import get_parking_status, ParkingStatusResult


router = APIRouter()


# Request/Response Models
class Coordinates(BaseModel):
    latitude: float
    longitude: float


class CreateSessionRequest(BaseModel):
    coordinates: Coordinates
    detectionMethod: str = "manual"  # manual, bluetooth, activity_recognition


class UpdateLocationRequest(BaseModel):
    coordinates: Coordinates


class ConfirmPaymentRequest(BaseModel):
    method: str  # parkmobile, paybyphone, coin, other
    durationMinutes: int


class ParkingRuleResponse(BaseModel):
    id: str
    type: str
    description: str
    startTime: Optional[str]
    endTime: Optional[str]
    days: List[int]
    maxDuration: Optional[int]
    rate: Optional[float]


class LocationResponse(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str]
    zoneCode: Optional[str]
    borough: Optional[str]
    block: Optional[str]


class SessionResponse(BaseModel):
    id: str
    userId: str
    location: LocationResponse
    status: str
    statusReason: str
    parkingType: str
    applicableRules: List[ParkingRuleResponse]
    startedAt: datetime
    endedAt: Optional[datetime]
    expiresAt: Optional[datetime]
    paymentStatus: str
    paymentMethod: Optional[str]
    paidDurationMinutes: Optional[int]
    paymentExpiresAt: Optional[datetime]
    detectionMethod: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class PaginatedSessions(BaseModel):
    items: List[SessionResponse]
    total: int
    page: int
    pageSize: int
    hasMore: bool


@router.get("/current", response_model=Optional[SessionResponse])
async def get_current_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current active parking session for the user.
    """
    session = db.query(ParkingSession).filter(
        ParkingSession.user_id == current_user.id,
        ParkingSession.ended_at.is_(None),
    ).first()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active session",
        )
    
    return _session_to_response(session)


@router.post("/sessions", response_model=SessionResponse)
async def create_session(
    request: CreateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new parking session.
    """
    # Check if user already has an active session
    existing = db.query(ParkingSession).filter(
        ParkingSession.user_id == current_user.id,
        ParkingSession.ended_at.is_(None),
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active parking session",
        )
    
    # Get parking status for location
    status_result = get_parking_status(
        request.coordinates.latitude,
        request.coordinates.longitude,
    )
    
    # Create session
    session = ParkingSession(
        user_id=current_user.id,
        latitude=request.coordinates.latitude,
        longitude=request.coordinates.longitude,
        address=status_result.address,
        zone_code=status_result.zone_code,
        borough=status_result.borough,
        status=status_result.status,
        status_reason=status_result.reason,
        parking_type=status_result.parking_type,
        rules_json=status_result.rules_json,
        expires_at=status_result.expires_at,
        detection_method=request.detectionMethod,
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return _session_to_response(session)


@router.post("/sessions/{session_id}/end")
async def end_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    End a parking session.
    """
    session = db.query(ParkingSession).filter(
        ParkingSession.id == session_id,
        ParkingSession.user_id == current_user.id,
    ).first()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )
    
    if session.ended_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session already ended",
        )
    
    session.ended_at = datetime.utcnow()
    session.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Session ended successfully"}


@router.patch("/sessions/{session_id}/location", response_model=SessionResponse)
async def update_session_location(
    session_id: str,
    request: UpdateLocationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the location of an active session (car moved).
    """
    session = db.query(ParkingSession).filter(
        ParkingSession.id == session_id,
        ParkingSession.user_id == current_user.id,
        ParkingSession.ended_at.is_(None),
    ).first()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active session not found",
        )
    
    # Get new parking status
    status_result = get_parking_status(
        request.coordinates.latitude,
        request.coordinates.longitude,
    )
    
    # Update session
    session.latitude = request.coordinates.latitude
    session.longitude = request.coordinates.longitude
    session.address = status_result.address
    session.zone_code = status_result.zone_code
    session.borough = status_result.borough
    session.status = status_result.status
    session.status_reason = status_result.reason
    session.parking_type = status_result.parking_type
    session.rules_json = status_result.rules_json
    session.expires_at = status_result.expires_at
    session.payment_status = "unpaid"  # Reset payment on move
    session.payment_method = None
    session.paid_duration_minutes = None
    session.payment_expires_at = None
    session.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(session)
    
    return _session_to_response(session)


@router.post("/sessions/{session_id}/payment", response_model=SessionResponse)
async def confirm_payment(
    session_id: str,
    request: ConfirmPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Confirm payment for a parking session.
    """
    session = db.query(ParkingSession).filter(
        ParkingSession.id == session_id,
        ParkingSession.user_id == current_user.id,
        ParkingSession.ended_at.is_(None),
    ).first()
    
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active session not found",
        )
    
    from datetime import timedelta
    
    session.payment_status = "paid"
    session.payment_method = request.method
    session.paid_duration_minutes = request.durationMinutes
    session.payment_expires_at = datetime.utcnow() + timedelta(minutes=request.durationMinutes)
    session.status = "green"
    session.status_reason = f"Paid for {request.durationMinutes} minutes"
    session.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(session)
    
    return _session_to_response(session)


@router.get("/status")
async def get_status_for_location(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    current_user: User = Depends(get_current_user),
):
    """
    Get parking status for a specific location.
    """
    status_result = get_parking_status(lat, lng)
    
    return {
        "status": status_result.status,
        "statusReason": status_result.reason,
        "parkingType": status_result.parking_type,
        "rules": status_result.rules,
        "expiresAt": status_result.expires_at,
        "recommendations": status_result.recommendations,
    }


@router.get("/history", response_model=PaginatedSessions)
async def get_history(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get parking history for the user.
    """
    # Get total count
    total = db.query(ParkingSession).filter(
        ParkingSession.user_id == current_user.id,
        ParkingSession.ended_at.isnot(None),
    ).count()
    
    # Get paginated sessions
    sessions = db.query(ParkingSession).filter(
        ParkingSession.user_id == current_user.id,
        ParkingSession.ended_at.isnot(None),
    ).order_by(
        ParkingSession.ended_at.desc()
    ).offset(
        (page - 1) * pageSize
    ).limit(pageSize).all()
    
    return PaginatedSessions(
        items=[_session_to_response(s) for s in sessions],
        total=total,
        page=page,
        pageSize=pageSize,
        hasMore=(page * pageSize) < total,
    )


def _session_to_response(session: ParkingSession) -> SessionResponse:
    """Convert database model to response model"""
    import json
    
    rules = []
    if session.rules_json:
        try:
            rules_data = json.loads(session.rules_json) if isinstance(session.rules_json, str) else session.rules_json
            rules = [ParkingRuleResponse(**r) for r in rules_data]
        except:
            pass
    
    return SessionResponse(
        id=str(session.id),
        userId=str(session.user_id),
        location=LocationResponse(
            latitude=session.latitude,
            longitude=session.longitude,
            address=session.address,
            zoneCode=session.zone_code,
            borough=session.borough,
            block=None,
        ),
        status=session.status,
        statusReason=session.status_reason,
        parkingType=session.parking_type,
        applicableRules=rules,
        startedAt=session.started_at,
        endedAt=session.ended_at,
        expiresAt=session.expires_at,
        paymentStatus=session.payment_status,
        paymentMethod=session.payment_method,
        paidDurationMinutes=session.paid_duration_minutes,
        paymentExpiresAt=session.payment_expires_at,
        detectionMethod=session.detection_method,
        createdAt=session.created_at,
        updatedAt=session.updated_at,
    )
