"""
Central place for Flask extension instances.
Instantiated here (unbound), initialized against the app in app/__init__.py.
This avoids circular imports between models/routes/app factory.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()
cors = CORS()
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")
