import os
from flask import Flask, jsonify
from app.config import config_by_name
from app.extensions import db, migrate, jwt, bcrypt, cors, socketio


def create_app(config_name=None):
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    _init_extensions(app)
    _register_blueprints(app)
    _register_error_handlers(app)
    _register_socket_events(app)

    from app.services.admin_seed import seed_admin_from_env

    with app.app_context():
        seed_admin_from_env(app)
        db.create_all()

        from app.models.subscription_plan import SubscriptionPlan

        if not SubscriptionPlan.query.first():
            default_plans = [
                {
                    "slug": "weekly",
                    "name": "Weekly",
                    "label": "Weekly",
                    "tagline": "Try it out",
                    "description": "A short-term starter plan for active drivers and operators.",
                    "price": 199,
                    "duration_days": 7,
                    "features": [
                        "Unlimited trips and ride requests",
                        "Priority placement in passenger search results",
                        "Full access to earnings & trip analytics",
                    ],
                    "popular": False,
                    "active": True,
                    "max_trips": "Unlimited",
                    "priority": "Standard placement",
                    "support": "Email support",
                },
                {
                    "slug": "monthly",
                    "name": "Monthly",
                    "label": "Monthly",
                    "tagline": "Most popular",
                    "description": "The most balanced plan for active drivers and operators.",
                    "price": 599,
                    "duration_days": 30,
                    "features": [
                        "Unlimited trips and ride requests",
                        "Priority placement in passenger search results",
                        "Full access to earnings & trip analytics",
                    ],
                    "popular": True,
                    "active": True,
                    "max_trips": "Unlimited",
                    "priority": "Priority placement",
                    "support": "Priority support",
                },
                {
                    "slug": "yearly",
                    "name": "Yearly",
                    "label": "Yearly",
                    "tagline": "Best value",
                    "description": "Best value for drivers and operators who need year-round access.",
                    "price": 4999,
                    "duration_days": 365,
                    "features": [
                        "Unlimited trips and ride requests",
                        "Priority placement in passenger search results",
                        "Full access to earnings & trip analytics",
                    ],
                    "popular": False,
                    "active": True,
                    "max_trips": "Unlimited",
                    "priority": "VIP placement",
                    "support": "Dedicated support",
                },
            ]

            for data in default_plans:
                db.session.add(
                    SubscriptionPlan(
                        slug=data["slug"],
                        name=data["name"],
                        label=data["label"],
                        tagline=data["tagline"],
                        description=data["description"],
                        price=data["price"],
                        duration_days=data["duration_days"],
                        features=str(data["features"]),
                        popular=data["popular"],
                        active=data["active"],
                        max_trips=data["max_trips"],
                        priority=data["priority"],
                        support=data["support"],
                    )
                )

            db.session.commit()

    return app


def _init_extensions(app):
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )
    socketio.init_app(
        app,
        message_queue=app.config.get("SOCKETIO_MESSAGE_QUEUE"),
        cors_allowed_origins=app.config["CORS_ORIGINS"],
    )

    # Import models so SQLAlchemy/Flask-Migrate can discover them
from app.models import (
    user,
    customer,
    driver,
    vehicle,
    location,
    trip,
    trip_stop,
    trip_status_history,
    verification_document,
    subscription,
    subscription_plan,
    notification_token,
    operator_settlement,
    operator_settlement_transaction,
    vehicle_expense,
)

def _register_blueprints(app):
    from app.routes.auth_routes import auth_bp
    from app.routes.user_routes import user_bp
    from app.routes.notification_routes import notification_bp
    from app.routes.driver_routes import driver_bp
    from app.routes.vehicle_routes import vehicle_bp
    from app.routes.trip_routes import trip_bp
    from app.routes.booking_routes import booking_bp
    from app.routes.matching_routes import matching_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.operator_routes import operator_bp
    from app.routes.onboarding_routes import onboarding_bp
    from app.routes.blog_routes import blog_bp
    from app.routes.verification_routes import verification_bp
    from app.routes.razorpayx_routes import razorpayx_bp
    from app.routes.payment_split_routes import payment_split_bp


    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(user_bp, url_prefix="/api/v1/users")
    app.register_blueprint(notification_bp, url_prefix="/api/v1/notifications")
    app.register_blueprint(driver_bp, url_prefix="/api/v1/drivers")
    app.register_blueprint(vehicle_bp, url_prefix="/api/v1/vehicles")
    app.register_blueprint(trip_bp, url_prefix="/api/v1/trips")
    app.register_blueprint(booking_bp, url_prefix="/api/v1/bookings")
    app.register_blueprint(matching_bp, url_prefix="/api/v1/matching")
    app.register_blueprint(admin_bp, url_prefix="/api/v1/admin")
    app.register_blueprint(operator_bp, url_prefix="/api/v1/operator")
    app.register_blueprint(onboarding_bp, url_prefix="/api/v1/onboarding")
    app.register_blueprint(blog_bp)
    app.register_blueprint(verification_bp, url_prefix="/api/v1/verification")
    app.register_blueprint(payment_split_bp)

    
    @app.route("/api/v1/health")
    def health():
        return jsonify({"success": True, "message": "ShareTaxi API is running"}), 200

    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        from flask import send_from_directory
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
    
    @app.route("/uploads/blog_covers/<path:filename>")
    def serve_cover(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
    
    @app.route("/api/health")
    def health_root():
        return {"status": "ok"}

    app.register_blueprint(
    razorpayx_bp,
    url_prefix="/api/v1/razorpayx",
)


def _register_error_handlers(app):
    from app.utils.response import error_response

    @app.errorhandler(404)
    def not_found(e):
        return error_response("Resource not found", status_code=404)

    @app.errorhandler(405)
    def method_not_allowed(e):
        return error_response("Method not allowed", status_code=405)

    @app.errorhandler(500)
    def server_error(e):
        return error_response("Internal server error", status_code=500)

    @app.errorhandler(Exception)
    def handle_unexpected(e):
        # Let HTTP exceptions with their own codes pass through cleanly
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return error_response(e.description, status_code=e.code)
        app.logger.exception("Unhandled exception")
        return error_response("Something went wrong", status_code=500)


def _register_socket_events(app):
    # Imported for side-effect registration of @socketio.on handlers
    from app.sockets import tracking_socket  # noqa: F401
