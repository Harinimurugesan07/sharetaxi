import os
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(os.path.dirname(basedir), ".env"))


class Config:
    # Core
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
    ENV = os.environ.get("FLASK_ENV", "production")
    DEBUG = os.environ.get("FLASK_DEBUG", "0") == "1"

    # Bootstrap admin (runs automatically when all four values are configured)
    ADMIN_NAME = os.environ.get("ADMIN_NAME", "")
    ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "")
    ADMIN_PHONE = os.environ.get("ADMIN_PHONE", "")
    ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")

    # Database
    DB_USER = os.environ.get("DB_USER", "root")
    DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
    DB_HOST = os.environ.get("DB_HOST", "localhost")
    DB_PORT = os.environ.get("DB_PORT", "3306")
    DB_NAME = os.environ.get("DB_NAME", "sharetaxi")

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 280,
    }

    # JWT
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me-jwt-secret")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        minutes=int(os.environ.get("JWT_ACCESS_EXPIRES_MIN", "30"))
    )
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(
        days=int(os.environ.get("JWT_REFRESH_EXPIRES_DAYS", "30"))
    )
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_ERROR_MESSAGE_KEY = "message"

    # CORS
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*").split(",")

    # Firebase
    FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")
    FIREBASE_SERVICE_ACCOUNT_JSON = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "")

    # Razorpay
    RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
    RAZORPAYX_ACCOUNT_NUMBER = os.environ.get("RAZORPAYX_ACCOUNT_NUMBER")
    RAZORPAYX_WEBHOOK_SECRET = os.environ.get(
    "RAZORPAYX_WEBHOOK_SECRET"
)

    CLOUDINARY_CLOUD_NAME = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY = os.environ.get("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET = os.environ.get("CLOUDINARY_API_SECRET", "")
    UPLOAD_FOLDER = os.environ.get(
        "UPLOAD_FOLDER", os.path.join(os.path.dirname(basedir), "uploads")
    )

    # Socket.IO
    SOCKETIO_MESSAGE_QUEUE = os.environ.get("SOCKETIO_MESSAGE_QUEUE")  # e.g. redis URL for scaling
    

    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    # Pagination
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

    # Matching engine tunables
    MATCH_MAX_DETOUR_KM = float(os.environ.get("MATCH_MAX_DETOUR_KM", "5"))
    MATCH_MAX_PICKUP_DISTANCE_KM = float(os.environ.get("MATCH_MAX_PICKUP_DISTANCE_KM", "3"))
    MATCH_TIME_WINDOW_MIN = int(os.environ.get("MATCH_TIME_WINDOW_MIN", "30"))
    OPERATOR_DRIVER_COMMISSION_RATE = float(os.environ.get("OPERATOR_DRIVER_COMMISSION_RATE", "0"))
    ADMIN_PLATFORM_FEE_RATE = float(
    os.environ.get("ADMIN_PLATFORM_FEE_RATE", "0.10")
)

OPERATOR_REVENUE_RATE = float(
    os.environ.get("OPERATOR_REVENUE_RATE", "0.10")
)


class DevelopmentConfig(Config):
    DEBUG = True
    ENV = "development"


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get("TEST_DATABASE_URL", Config.SQLALCHEMY_DATABASE_URI)


class ProductionConfig(Config):
    DEBUG = False
    ENV = "production"


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}
