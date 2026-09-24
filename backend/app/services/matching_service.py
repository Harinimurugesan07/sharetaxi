from datetime import datetime, timedelta
from flask import current_app
from app.models.trip import Trip
from app.utils.constants import TripStatus
from app.utils.geo import haversine_km


class MatchingServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _nearest_boarding_distance_km(trip, lat, lng):
    """Distance from the passenger's pickup to the trip's origin OR nearest boarding stop."""
    candidates = [haversine_km(lat, lng, trip.origin_lat, trip.origin_lng)]
    for stop in trip.stops:
        if stop.stop_type == "boarding":
            candidates.append(haversine_km(lat, lng, stop.latitude, stop.longitude))
    return min(candidates)


def _nearest_drop_distance_km(trip, lat, lng):
    """Distance from the passenger's drop-off to the trip's destination OR nearest drop stop."""
    candidates = [haversine_km(lat, lng, trip.destination_lat, trip.destination_lng)]
    for stop in trip.stops:
        if stop.stop_type == "drop":
            candidates.append(haversine_km(lat, lng, stop.latitude, stop.longitude))
    return min(candidates)


def _route_similarity_score(trip, origin_lat, origin_lng, dest_lat, dest_lng):
    """
    How well the trip's overall direction matches the passenger's desired direction,
    using bearing comparison between (trip origin -> destination) and
    (passenger origin -> destination). 1.0 = identical direction, 0.0 = opposite.
    """
    import math

    def bearing(lat1, lng1, lat2, lng2):
        lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
        dlng = math.radians(lng2 - lng1)
        x = math.sin(dlng) * math.cos(lat2_r)
        y = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(dlng)
        return math.atan2(x, y)

    trip_bearing = bearing(trip.origin_lat, trip.origin_lng, trip.destination_lat, trip.destination_lng)
    passenger_bearing = bearing(origin_lat, origin_lng, dest_lat, dest_lng)

    angle_diff = abs(trip_bearing - passenger_bearing)
    if angle_diff > math.pi:
        angle_diff = 2 * math.pi - angle_diff

    return max(0.0, 1.0 - (angle_diff / math.pi))


def _detour_km(trip, origin_lat, origin_lng, dest_lat, dest_lng):
    """
    Extra distance the driver's straight route would gain by passing through the
    passenger's pickup and drop, versus the driver's direct origin->destination distance.
    """
    direct = haversine_km(trip.origin_lat, trip.origin_lng, trip.destination_lat, trip.destination_lng)
    via_passenger = (
        haversine_km(trip.origin_lat, trip.origin_lng, origin_lat, origin_lng)
        + haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
        + haversine_km(dest_lat, dest_lng, trip.destination_lat, trip.destination_lng)
    )
    return max(0.0, via_passenger - direct)


def find_matching_trips(search):
    """
    search: dict with origin_lat, origin_lng, destination_lat, destination_lng,
            departure_time (ISO string), seats_needed (int)
    Returns a list of {trip, score, breakdown} sorted by score descending,
    for trips scoring above a minimum viable threshold.
    """
    try:
        origin_lat = float(search["origin_lat"])
        origin_lng = float(search["origin_lng"])
        dest_lat = float(search["destination_lat"])
        dest_lng = float(search["destination_lng"])
    except (KeyError, ValueError, TypeError):
        raise MatchingServiceError("origin/destination lat & lng are required and must be numeric", 422)

    try:
        search_time = datetime.fromisoformat(search["departure_time"])
    except (KeyError, ValueError):
        raise MatchingServiceError(
            "departure_time must be a valid ISO 8601 datetime, e.g. 2026-09-10T08:30:00", 422
        )

    seats_needed = int(search.get("seats_needed", 1))

    max_pickup_km = current_app.config["MATCH_MAX_PICKUP_DISTANCE_KM"]
    max_detour_km = current_app.config["MATCH_MAX_DETOUR_KM"]
    time_window_min = current_app.config["MATCH_TIME_WINDOW_MIN"]

    window_start = search_time - timedelta(minutes=time_window_min)
    window_end = search_time + timedelta(minutes=time_window_min)

    candidate_trips = Trip.query.filter(
        Trip.status == TripStatus.SCHEDULED,
        Trip.available_seats >= seats_needed,
        Trip.departure_time >= window_start,
        Trip.departure_time <= window_end,
    ).all()

    results = []
    for trip in candidate_trips:
        pickup_km = _nearest_boarding_distance_km(trip, origin_lat, origin_lng)
        drop_km = _nearest_drop_distance_km(trip, dest_lat, dest_lng)
        detour_km = _detour_km(trip, origin_lat, origin_lng, dest_lat, dest_lng)

        if pickup_km > max_pickup_km or detour_km > max_detour_km:
            continue

        similarity = _route_similarity_score(trip, origin_lat, origin_lng, dest_lat, dest_lng)
        time_diff_min = abs((trip.departure_time - search_time).total_seconds()) / 60

        # Weighted scoring — each component normalized to [0, 1], then combined.
        pickup_score = max(0.0, 1.0 - (pickup_km / max_pickup_km))
        drop_score = max(0.0, 1.0 - (drop_km / max_pickup_km))
        detour_score = max(0.0, 1.0 - (detour_km / max_detour_km))
        time_score = max(0.0, 1.0 - (time_diff_min / time_window_min))

        weights = {
            "route_similarity": 0.35,
            "pickup_proximity": 0.20,
            "drop_proximity": 0.20,
            "departure_time": 0.15,
            "detour": 0.10,
        }
        overall = (
            similarity * weights["route_similarity"]
            + pickup_score * weights["pickup_proximity"]
            + drop_score * weights["drop_proximity"]
            + time_score * weights["departure_time"]
            + detour_score * weights["detour"]
        )
        match_percent = round(overall * 100)

        if match_percent < 40:
            continue  # not a meaningful match, don't clutter results

        results.append({
            "trip": trip,
            "match_percent": match_percent,
            "breakdown": {
                "pickup_distance_km": round(pickup_km, 2),
                "drop_distance_km": round(drop_km, 2),
                "detour_km": round(detour_km, 2),
                "time_difference_minutes": round(time_diff_min),
                "route_similarity": round(similarity, 2),
            },
        })

    results.sort(key=lambda r: r["match_percent"], reverse=True)
    return results