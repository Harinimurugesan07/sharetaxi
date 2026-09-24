"""
Socket.IO events for live driver tracking.

Room convention: each trip has its own room named f"trip:{trip_public_id}".
Driver emits location updates into the room; passengers on that trip join
the room (read-only) to receive them. This keeps location broadcast scoped
to the relevant trip rather than fanning out globally.

Event flow (mirrors booking flow "Live Tracking" stage):
  driver:location_update   -> driver -> server -> broadcast to trip room
  trip:started              -> driver -> server -> broadcast to trip room
  trip:driver_arriving      -> driver -> server -> broadcast to trip room
  passenger:boarded         -> driver -> server -> broadcast to trip room
  passenger:dropped         -> driver -> server -> broadcast to trip room
  trip:completed             -> driver -> server -> broadcast to trip room
"""
from flask import request
from flask_socketio import join_room, leave_room, emit
from flask_jwt_extended import decode_token
from app.extensions import socketio


_socket_users = {}


def _room_for_trip(trip_public_id):
    return f"trip:{trip_public_id}"


def _authenticated_user_id(auth):
    """Socket.IO connections pass the JWT access token in the `auth` payload."""
    token = (auth or {}).get("token")
    if not token:
        return None
    try:
        decoded = decode_token(token)
        return decoded.get("sub")
    except Exception:
        return None


def _authenticated_role(auth):
    token = (auth or {}).get("token")
    if not token:
        return None
    try:
        return decode_token(token).get("role")
    except Exception:
        return None


@socketio.on("connect")
def handle_connect(auth):
    user_id = _authenticated_user_id(auth)
    if not user_id:
        return False  # reject connection
    _socket_users[request.sid] = {"user_id": user_id, "role": _authenticated_role(auth)}
    return True


@socketio.on("disconnect")
def handle_disconnect():
    _socket_users.pop(request.sid, None)


@socketio.on("join_operator")
def handle_join_operator():
    if _socket_users.get(request.sid, {}).get("role") != "operator":
        emit("error", {"message": "Operator access required"})
        return
    join_room("operator_dashboard")
    emit("joined_operator")


@socketio.on("join_trip")
def handle_join_trip(data):
    """Passenger or driver joins a trip's tracking room."""
    trip_public_id = (data or {}).get("trip_id")
    if not trip_public_id:
        emit("error", {"message": "trip_id is required"})
        return
    join_room(_room_for_trip(trip_public_id))
    emit("joined_trip", {"trip_id": trip_public_id})


@socketio.on("leave_trip")
def handle_leave_trip(data):
    trip_public_id = (data or {}).get("trip_id")
    if trip_public_id:
        leave_room(_room_for_trip(trip_public_id))


@socketio.on("driver:location_update")
def handle_driver_location(data):
    """
    Payload: { trip_id, latitude, longitude, heading?, speed? }
    Persisted separately via the REST driver_locations write (see services/
    location_service in a later phase) — this handler is the low-latency
    broadcast path, not the write path.
    """
    trip_public_id = (data or {}).get("trip_id")
    if not trip_public_id or "latitude" not in data or "longitude" not in data:
        emit("error", {"message": "trip_id, latitude and longitude are required"})
        return

    emit(
        "driver:location",
        {
            "trip_id": trip_public_id,
            "latitude": data["latitude"],
            "longitude": data["longitude"],
            "heading": data.get("heading"),
            "speed": data.get("speed"),
        },
        room=_room_for_trip(trip_public_id),
        include_self=False,
    )


@socketio.on("driver:status_update")
def handle_driver_status_update(data):
    """Translate client-side trip progress stages into the trip-room events passengers listen for."""
    trip_public_id = (data or {}).get("trip_id")
    stage = (data or {}).get("stage")

    if not trip_public_id or not stage:
        emit("error", {"message": "trip_id and stage are required"})
        return

    payload = {"trip_id": trip_public_id, "stage": stage}
    event_map = {
        "arrived": "trip:driver_arriving",
        "trip_started": "trip:started",
        "completed": "trip:completed",
    }

    event_name = event_map.get(stage)
    if not event_name:
        return

    emit(event_name, payload, room=_room_for_trip(trip_public_id), include_self=False)


def _broadcast_trip_event(event_name, data):
    trip_public_id = (data or {}).get("trip_id")
    if not trip_public_id:
        emit("error", {"message": "trip_id is required"})
        return
    emit(event_name, data, room=_room_for_trip(trip_public_id))


@socketio.on("trip:started")
def handle_trip_started(data):
    _broadcast_trip_event("trip:started", data)


@socketio.on("trip:driver_arriving")
def handle_driver_arriving(data):
    _broadcast_trip_event("trip:driver_arriving", data)


@socketio.on("passenger:boarded")
def handle_passenger_boarded(data):
    _broadcast_trip_event("passenger:boarded", data)


@socketio.on("passenger:dropped")
def handle_passenger_dropped(data):
    _broadcast_trip_event("passenger:dropped", data)


@socketio.on("trip:completed")
def handle_trip_completed(data):
    _broadcast_trip_event("trip:completed", data)
