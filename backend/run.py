import os
from app import create_app
from app.extensions import socketio

app = create_app(os.environ.get("FLASK_ENV", "development"))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = app.config.get("DEBUG", False)
    # socketio.run provides the development server with Socket.IO support.
    # In production, run behind a production WSGI server, e.g.:
    #   gunicorn -w 1 run:app
    socketio.run(app,  host="0.0.0.0",
    port=5000,
    debug=False)