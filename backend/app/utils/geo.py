import math


_EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1, lng1, lat2, lng2):
    """Return the great-circle distance between two latitude/longitude points."""
    lat1_radians = math.radians(float(lat1))
    lat2_radians = math.radians(float(lat2))
    delta_lat = math.radians(float(lat2) - float(lat1))
    delta_lng = math.radians(float(lng2) - float(lng1))

    haversine = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_radians)
        * math.cos(lat2_radians)
        * math.sin(delta_lng / 2) ** 2
    )
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(haversine))
