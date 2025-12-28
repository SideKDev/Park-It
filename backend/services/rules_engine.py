"""
Rules Engine
Determines parking status based on location and NYC parking rules
"""

import json
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass


@dataclass
class ParkingRule:
    """A parking rule that applies to a location"""
    id: str
    type: str  # street_cleaning, meter, no_parking, no_standing
    description: str
    days: List[int]  # 0=Mon, 6=Sun
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    side: Optional[str] = None  # N, S, E, W
    max_duration: Optional[int] = None  # minutes
    rate: Optional[float] = None  # $/hour
    zone_code: Optional[str] = None


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
    Get parking status for a specific location in NYC.
    """
    now = datetime.now()
    day_of_week = now.weekday()  # 0 = Monday, 6 = Sunday
    current_hour = now.hour
    current_minute = now.minute
    current_decimal = current_hour + current_minute / 60
    
    # Determine borough from coordinates
    borough = _get_borough(latitude, longitude)
    
    # Get address (placeholder - would use reverse geocoding in production)
    address = f"{latitude:.4f}, {longitude:.4f}"
    
    rules = []
    recommendations = []
    zone_code = None
    
    # Check if it's a holiday (alternate side suspended)
    is_holiday = _is_holiday(now)
    holiday_name = _get_holiday_name(now) if is_holiday else None
    
    # Check for street cleaning / alternate side parking
    if not is_holiday:
        cleaning_rules = _get_street_cleaning_rules(latitude, longitude, day_of_week, borough)
        rules.extend(cleaning_rules)
    else:
        recommendations.append(f"Alternate side parking suspended ({holiday_name})")
    
    # Check for metered parking (meters still active on most holidays)
    meter_rule = _check_meter_zone(latitude, longitude, current_hour, day_of_week)
    if meter_rule:
        rules.append(meter_rule)
        zone_code = meter_rule.get("zoneCode")
    
    # Check for special restrictions (no parking, no standing)
    special_rules = _check_special_restrictions(latitude, longitude, day_of_week, current_hour)
    rules.extend(special_rules)
    
    # Determine overall status
    status, reason, parking_type, expires_at = _determine_status(rules, now, current_decimal)
    
    # Generate smart recommendations
    recommendations.extend(_generate_recommendations(status, parking_type, rules, now))
    
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


def _get_borough(lat: float, lng: float) -> str:
    """Determine NYC borough from coordinates"""
    # Simplified borough detection based on bounding boxes
    # In production, use proper polygon containment
    
    if lat > 40.85:
        return "Bronx"
    elif lng < -73.97 and lat < 40.7:
        return "Staten Island"
    elif lng > -73.87:
        return "Queens"
    elif lat < 40.7 and lng > -74.04:
        return "Brooklyn"
    else:
        return "Manhattan"


def _is_holiday(date: datetime) -> bool:
    """Check if date is a parking holiday (alternate side suspended)"""
    date_str = date.strftime("%Y-%m-%d")
    
    # Check loaded holidays
    holidays_list = HOLIDAYS.get("holidays", [])
    for holiday in holidays_list:
        if holiday.get("date") == date_str and holiday.get("alternateSideSuspended", False):
            return True
    
    return False


def _get_holiday_name(date: datetime) -> Optional[str]:
    """Get holiday name if it's a holiday"""
    date_str = date.strftime("%Y-%m-%d")
    holidays_list = HOLIDAYS.get("holidays", [])
    for holiday in holidays_list:
        if holiday.get("date") == date_str:
            return holiday.get("name")
    return None


def _get_street_cleaning_rules(lat: float, lng: float, day_of_week: int, borough: str) -> List[Dict]:
    """
    Get street cleaning rules for a location.
    
    In production, this would query a database with actual NYC DOT data.
    For MVP, we use representative schedules by borough.
    """
    rules = []
    
    # Get borough-specific schedule
    borough_schedules = CLEANING_SCHEDULE.get("boroughs", {}).get(borough, {})
    schedules = borough_schedules.get("schedules", [])
    
    for schedule in schedules:
        if day_of_week in schedule.get("days", []):
            rules.append({
                "id": f"cleaning-{borough}-{schedule.get('side', 'unknown')}",
                "type": "street_cleaning",
                "description": f"Alternate side parking - {schedule.get('side', '')} side",
                "startTime": schedule.get("startTime", "08:30"),
                "endTime": schedule.get("endTime", "10:00"),
                "days": schedule.get("days", []),
                "side": schedule.get("side"),
                "maxDuration": None,
                "rate": None,
            })
    
    # Fallback if no specific schedule found
    if not rules:
        # Default Manhattan schedule as example
        default_schedules = {
            0: {"start": "08:30", "end": "10:00", "side": "North/East"},   # Monday
            1: {"start": "11:00", "end": "12:30", "side": "South/West"},   # Tuesday
            2: {"start": "08:30", "end": "10:00", "side": "North/East"},   # Wednesday
            3: {"start": "11:00", "end": "12:30", "side": "South/West"},   # Thursday
        }
        
        if day_of_week in default_schedules:
            sched = default_schedules[day_of_week]
            rules.append({
                "id": f"cleaning-default-{day_of_week}",
                "type": "street_cleaning",
                "description": f"Alternate side parking - {sched['side']} side",
                "startTime": sched["start"],
                "endTime": sched["end"],
                "days": [day_of_week],
                "side": sched["side"],
                "maxDuration": None,
                "rate": None,
            })
    
    return rules


def _check_meter_zone(lat: float, lng: float, hour: int, day_of_week: int) -> Optional[Dict]:
    """
    Check if location is in a metered zone.
    """
    # Check if it's during meter hours (varies by zone)
    # Most NYC meters: Mon-Sat 7am-7pm, some 7am-10pm
    
    # Sunday: most meters free
    if day_of_week == 6:
        return None
    
    # Check meter zones from data file
    zones = METER_ZONES.get("zones", [])
    
    for zone in zones:
        # In production, check if point is within zone polygon
        # For MVP, use simple bounding box
        bounds = zone.get("bounds", {})
        if bounds:
            if (bounds.get("minLat", 0) <= lat <= bounds.get("maxLat", 90) and
                bounds.get("minLng", -180) <= lng <= bounds.get("maxLng", 0)):
                
                start_hour = int(zone.get("startTime", "07:00").split(":")[0])
                end_hour = int(zone.get("endTime", "19:00").split(":")[0])
                
                if start_hour <= hour < end_hour:
                    return {
                        "id": f"meter-{zone.get('code', 'unknown')}",
                        "type": "meter",
                        "description": f"Metered parking - {zone.get('name', 'Zone')}",
                        "startTime": zone.get("startTime", "07:00"),
                        "endTime": zone.get("endTime", "19:00"),
                        "days": zone.get("days", [0, 1, 2, 3, 4, 5]),
                        "maxDuration": zone.get("maxDuration", 120),
                        "rate": zone.get("rate", 3.50),
                        "zoneCode": zone.get("code"),
                    }
    
    # Default meter zone for Manhattan commercial areas
    # In production, would have actual zone boundaries
    default_rate = METER_ZONES.get("default", {}).get("rate", 3.50)
    default_max = METER_ZONES.get("default", {}).get("maxDuration", 120)
    default_start = int(METER_ZONES.get("default", {}).get("startTime", "07:00").split(":")[0])
    default_end = int(METER_ZONES.get("default", {}).get("endTime", "19:00").split(":")[0])
    
    if default_start <= hour < default_end:
        zone_code = f"{int(abs(lat * 1000) % 10000):04d}"
        return {
            "id": f"meter-{zone_code}",
            "type": "meter",
            "description": f"Metered parking zone",
            "startTime": f"{default_start:02d}:00",
            "endTime": f"{default_end:02d}:00",
            "days": [0, 1, 2, 3, 4, 5],
            "maxDuration": default_max,
            "rate": default_rate,
            "zoneCode": zone_code,
        }
    
    return None


def _check_special_restrictions(lat: float, lng: float, day_of_week: int, hour: int) -> List[Dict]:
    """
    Check for special parking restrictions (no parking, no standing, etc.)
    
    In production, would query actual sign data from NYC Open Data.
    """
    # Placeholder for special restrictions
    # Would check things like:
    # - No standing zones (bus stops, fire hydrants)
    # - No parking zones
    # - Commercial loading zones
    # - School zones during school hours
    
    return []


def _determine_status(
    rules: List[Dict[str, Any]],
    now: datetime,
    current_decimal: float,
) -> tuple[str, str, str, Optional[datetime]]:
    """
    Determine overall parking status based on rules.
    
    Priority:
    1. No parking/standing = RED
    2. Active street cleaning = RED
    3. Street cleaning soon (< 30 min) = YELLOW
    4. Metered zone = YELLOW (need to pay)
    5. Street cleaning later today = GREEN with warning
    6. No rules = GREEN
    """
    
    if not rules:
        return ("green", "Free parking - no restrictions", "free", None)
    
    # Check for no parking/standing first
    for rule in rules:
        if rule["type"] in ["no_parking", "no_standing"]:
            return (
                "red",
                f"No {rule['type'].replace('_', ' ')} zone",
                rule["type"],
                None,
            )
    
    # Check street cleaning rules
    for rule in rules:
        if rule["type"] == "street_cleaning":
            start_time = _parse_time(rule["startTime"])
            end_time = _parse_time(rule["endTime"])
            
            if start_time <= current_decimal < end_time:
                # Active cleaning - RED
                expires = _time_to_datetime(end_time, now)
                return (
                    "red",
                    f"Street cleaning until {rule['endTime']}",
                    "street_cleaning",
                    expires,
                )
            elif current_decimal < start_time:
                # Cleaning coming up
                minutes_until = int((start_time - current_decimal) * 60)
                expires = _time_to_datetime(start_time, now)
                
                if minutes_until <= 30:
                    # Very soon - YELLOW
                    return (
                        "yellow",
                        f"Street cleaning in {minutes_until} min - move your car!",
                        "street_cleaning",
                        expires,
                    )
                elif minutes_until <= 60:
                    # Coming up - YELLOW
                    return (
                        "yellow", 
                        f"Street cleaning in {minutes_until} min",
                        "street_cleaning",
                        expires,
                    )
    
    # Check metered parking
    for rule in rules:
        if rule["type"] == "meter":
            max_duration = rule.get("maxDuration", 120)
            expires = now + timedelta(minutes=max_duration) if max_duration else None
            rate = rule.get("rate", 3.50)
            
            return (
                "yellow",
                f"Metered zone - ${rate:.2f}/hr (max {max_duration} min)",
                "meter",
                expires,
            )
    
    # Street cleaning later today but not imminent
    for rule in rules:
        if rule["type"] == "street_cleaning":
            start_time = _parse_time(rule["startTime"])
            if current_decimal < start_time:
                minutes_until = int((start_time - current_decimal) * 60)
                expires = _time_to_datetime(start_time, now)
                return (
                    "green",
                    f"OK for now - cleaning at {rule['startTime']}",
                    "free",
                    expires,
                )
    
    # Default to green
    return ("green", "Free parking - no restrictions", "free", None)


def _generate_recommendations(
    status: str,
    parking_type: str,
    rules: List[Dict],
    now: datetime,
) -> List[str]:
    """Generate helpful recommendations based on parking status"""
    recommendations = []
    
    if status == "red":
        if parking_type == "street_cleaning":
            recommendations.append("Find parking on the opposite side of the street")
            recommendations.append("Check nearby blocks for available spots")
        else:
            recommendations.append("This location does not allow parking")
            recommendations.append("Look for legal parking nearby")
    
    elif status == "yellow":
        if parking_type == "meter":
            recommendations.append("Pay with ParkMobile or at the meter")
            recommendations.append("Set a reminder before time expires")
            for rule in rules:
                if rule["type"] == "meter" and rule.get("maxDuration"):
                    recommendations.append(f"Maximum parking time: {rule['maxDuration']} minutes")
        elif parking_type == "street_cleaning":
            recommendations.append("Move your car before cleaning begins")
            recommendations.append("Set a reminder to avoid a ticket")
    
    elif status == "green":
        # Check if there's cleaning later
        for rule in rules:
            if rule["type"] == "street_cleaning":
                recommendations.append(f"Remember: cleaning at {rule['startTime']}")
                break
    
    return recommendations


def _parse_time(time_str: str) -> float:
    """Parse time string (HH:MM) to decimal hours"""
    try:
        parts = time_str.split(":")
        return int(parts[0]) + int(parts[1]) / 60
    except (ValueError, IndexError):
        return 0.0


def _time_to_datetime(decimal_time: float, reference: datetime) -> datetime:
    """Convert decimal time to datetime on the reference date"""
    hours = int(decimal_time)
    minutes = int((decimal_time % 1) * 60)
    return reference.replace(hour=hours, minute=minutes, second=0, microsecond=0)
