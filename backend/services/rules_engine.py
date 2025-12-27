"""
Rules Engine
Determines parking status based on location and rules
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass


@dataclass
class ParkingStatusResult:
    """Result from parking status check"""
    status: str  # green, yellow, red
    reason: str
    parking_type: str  # meter, street_cleaning, free, no_parking
    rules: List[Dict[str, Any]]
    rules_json: str
    expires_at: Optional[datetime]
    address: Optional[str]
    zone_code: Optional[str]
    borough: Optional[str]
    recommendations: List[str]


# Load static data
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_json_data(filename: str) -> Dict[str, Any]:
    """Load JSON data file"""
    filepath = os.path.join(DATA_DIR, filename)
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: Data file not found: {filepath}")
        return {}


# Load data on module import
CLEANING_SCHEDULE = load_json_data("nyc_cleaning.json")
METER_ZONES = load_json_data("meter_zones.json")
HOLIDAYS = load_json_data("holidays.json")


def get_parking_status(latitude: float, longitude: float) -> ParkingStatusResult:
    """
    Get parking status for a specific location.
    
    This is a simplified implementation for MVP.
    In production, you would:
    1. Use a proper geocoding service
    2. Query actual NYC parking rules data
    3. Use PostGIS for efficient spatial queries
    """
    now = datetime.now()
    day_of_week = now.weekday()  # 0 = Monday, 6 = Sunday
    current_hour = now.hour
    
    # Default values
    address = f"{latitude:.4f}, {longitude:.4f}"  # Placeholder
    zone_code = None
    borough = "Manhattan"  # Placeholder
    
    rules = []
    recommendations = []
    
    # Check if it's a holiday (no street cleaning)
    is_holiday = _is_holiday(now)
    
    # Check for street cleaning
    cleaning_rule = _check_street_cleaning(day_of_week, current_hour, is_holiday)
    if cleaning_rule:
        rules.append(cleaning_rule)
    
    # Check for metered parking
    meter_rule = _check_meter_zone(latitude, longitude, current_hour, day_of_week)
    if meter_rule:
        rules.append(meter_rule)
        zone_code = meter_rule.get("zoneCode")
    
    # Determine overall status
    status, reason, parking_type, expires_at = _determine_status(rules, now)
    
    # Generate recommendations
    if status == "yellow" and parking_type == "meter":
        recommendations.append("Pay for parking to avoid a ticket")
        recommendations.append("Maximum parking time may be limited")
    elif status == "yellow" and parking_type == "street_cleaning":
        recommendations.append("Move your car before street cleaning begins")
    elif status == "red":
        recommendations.append("Find an alternative parking spot")
    
    return ParkingStatusResult(
        status=status,
        reason=reason,
        parking_type=parking_type,
        rules=rules,
        rules_json=json.dumps(rules),
        expires_at=expires_at,
        address=address,
        zone_code=zone_code,
        borough=borough,
        recommendations=recommendations,
    )


def _is_holiday(date: datetime) -> bool:
    """Check if date is a parking holiday"""
    date_str = date.strftime("%Y-%m-%d")
    
    # Check loaded holidays
    if HOLIDAYS.get("dates"):
        return date_str in HOLIDAYS["dates"]
    
    # Fallback: check for major US holidays
    # In production, use actual NYC alternate side parking calendar
    major_holidays = [
        "01-01",  # New Year's Day
        "07-04",  # Independence Day
        "12-25",  # Christmas
    ]
    
    return date.strftime("%m-%d") in major_holidays


def _check_street_cleaning(day_of_week: int, hour: int, is_holiday: bool) -> Optional[Dict[str, Any]]:
    """
    Check for street cleaning rules.
    
    Simplified logic - in production, would check actual block-level rules.
    """
    if is_holiday:
        return None
    
    # Example: Most NYC streets have alternate side parking
    # This is a simplified example
    
    # Monday, Wednesday: 8:30am - 10am (one side)
    # Tuesday, Thursday: 8:30am - 10am (other side)
    
    cleaning_days = {
        0: {"start": 8.5, "end": 10, "side": "North"},  # Monday
        2: {"start": 8.5, "end": 10, "side": "North"},  # Wednesday
        1: {"start": 11, "end": 12.5, "side": "South"},  # Tuesday
        3: {"start": 11, "end": 12.5, "side": "South"},  # Thursday
    }
    
    if day_of_week in cleaning_days:
        schedule = cleaning_days[day_of_week]
        
        return {
            "id": f"cleaning-{day_of_week}",
            "type": "street_cleaning",
            "description": f"Street cleaning {schedule['side']} side",
            "startTime": f"{int(schedule['start'])}:{int((schedule['start'] % 1) * 60):02d}",
            "endTime": f"{int(schedule['end'])}:{int((schedule['end'] % 1) * 60):02d}",
            "days": [day_of_week],
            "maxDuration": None,
            "rate": None,
        }
    
    return None


def _check_meter_zone(lat: float, lng: float, hour: int, day_of_week: int) -> Optional[Dict[str, Any]]:
    """
    Check if location is in a metered zone.
    
    Simplified logic - in production, would use actual meter zone data.
    """
    # Assume meters are active Mon-Sat 7am-7pm in most of Manhattan
    is_meter_active = day_of_week < 6 and 7 <= hour < 19
    
    if not is_meter_active:
        return None
    
    # Simplified: assume all Manhattan locations below 96th St are metered
    # In production, check actual meter zone data
    
    # Generate a fake zone code based on location
    zone_code = f"{int(abs(lat * 1000) % 10000)}"
    
    return {
        "id": f"meter-{zone_code}",
        "type": "meter",
        "description": f"Metered parking - Zone {zone_code}",
        "startTime": "07:00",
        "endTime": "19:00",
        "days": [0, 1, 2, 3, 4, 5],  # Mon-Sat
        "maxDuration": 120,  # 2 hours
        "rate": 3.50,  # $3.50/hour
        "zoneCode": zone_code,
    }


def _determine_status(
    rules: List[Dict[str, Any]],
    now: datetime,
) -> tuple[str, str, str, Optional[datetime]]:
    """
    Determine overall parking status based on rules.
    
    Returns: (status, reason, parking_type, expires_at)
    """
    if not rules:
        # No rules apply - free parking
        return ("green", "Free parking - no restrictions", "free", None)
    
    # Check for active street cleaning
    for rule in rules:
        if rule["type"] == "street_cleaning":
            start_time = _parse_time(rule["startTime"])
            end_time = _parse_time(rule["endTime"])
            current_time = now.hour + now.minute / 60
            
            if start_time <= current_time < end_time:
                # Active cleaning - can't park
                return (
                    "red",
                    f"Street cleaning in progress until {rule['endTime']}",
                    "street_cleaning",
                    _time_to_datetime(end_time, now),
                )
            elif current_time < start_time:
                # Cleaning coming up
                minutes_until = int((start_time - current_time) * 60)
                if minutes_until <= 60:
                    return (
                        "yellow",
                        f"Street cleaning starts in {minutes_until} minutes",
                        "street_cleaning",
                        _time_to_datetime(start_time, now),
                    )
    
    # Check for metered parking
    for rule in rules:
        if rule["type"] == "meter":
            return (
                "yellow",
                f"Metered zone - ${rule['rate']}/hr, max {rule['maxDuration']} min",
                "meter",
                now + timedelta(minutes=rule["maxDuration"]) if rule["maxDuration"] else None,
            )
    
    # Default to green
    return ("green", "Parking allowed", "free", None)


def _parse_time(time_str: str) -> float:
    """Parse time string (HH:MM) to decimal hours"""
    parts = time_str.split(":")
    return int(parts[0]) + int(parts[1]) / 60


def _time_to_datetime(decimal_time: float, reference: datetime) -> datetime:
    """Convert decimal time to datetime on the reference date"""
    hours = int(decimal_time)
    minutes = int((decimal_time % 1) * 60)
    return reference.replace(hour=hours, minute=minutes, second=0, microsecond=0)
