from flask import request
from app.services import matching_service
from app.services.matching_service import MatchingServiceError
from app.utils.response import success_response, error_response
from app.utils.validators import validate_required_fields


def search_matches():
    """
    POST body:
    {
      "origin_lat": 13.0827, "origin_lng": 80.2707,
      "destination_lat": 12.9716, "destination_lng": 77.5946,
      "departure_time": "2026-09-10T08:30:00",
      "seats_needed": 1
    }
    Public endpoint (no auth required to browse matches — booking requires login).
    """
    data = request.get_json(silent=True) or {}
    required = ["origin_lat", "origin_lng", "destination_lat", "destination_lng", "departure_time"]
    missing = validate_required_fields(data, required)
    if missing:
        return error_response(f"Missing required fields: {', '.join(missing)}", 422)

    try:
        results = matching_service.find_matching_trips(data)
    except MatchingServiceError as e:
        return error_response(e.message, e.status_code)

    payload = [
        {
            "trip": r["trip"].to_dict(include_stops=True),
            "match_percent": r["match_percent"],
            "breakdown": r["breakdown"],
        }
        for r in results
    ]
    return success_response(payload, message=f"Found {len(payload)} matching trip(s)")