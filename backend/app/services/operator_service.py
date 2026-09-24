from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError

from app.models.booking import Booking
from app.models.customer import Customer
from app.models.driver import Driver
from app.models.trip import Trip
from app.models.vehicle import Vehicle
from app.models.operator_settlement import OperatorSettlement
from app.models.operator_settlement_transaction import OperatorSettlementTransaction
from app.models.driver_wallet import DriverWallet
from app.models.driver_wallet_transaction import DriverWalletTransaction
from app.models.user import User
from app.utils.constants import BookingStatus, DriverAvailability, DriverStatus, TripStatus, UserRole, VehicleType
from app.services.onboarding_service import submit_document
from app.extensions import db
from app.utils.validators import is_valid_license_number, is_valid_registration_number
from app.models.vehicle_expense import VehicleExpense
from app.models.driver_payout_request import DriverPayoutRequest

class OperatorServiceError(Exception):
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def create_driver(data, operator_id):
    required = ["full_name", "email", "phone", "password", "license_number", "address", "city", "state", "postal_code", "country"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        raise OperatorServiceError(f"Missing required fields: {', '.join(missing)}", 422)
    if User.query.filter((User.email == data["email"].strip().lower()) | (User.phone == data["phone"].strip())).first():
        raise OperatorServiceError("An account with this email or phone already exists", 409)
    license_number = data["license_number"].strip()
    if not is_valid_license_number(license_number):
        raise OperatorServiceError("License number must be in DL-XXXXXXXXXXXX format", 422)
    if Driver.query.filter_by(license_number=license_number).first():
        raise OperatorServiceError("This license number is already registered", 409)

    user = User(full_name=data["full_name"].strip(), email=data["email"].strip().lower(), phone=data["phone"].strip(), role=UserRole.DRIVER, verification_status="pending", subscription_status="inactive")
    user.set_password(data["password"])
    driver = Driver(
        user=user,
        operator_id=operator_id,
        license_number=license_number,
        address=data["address"].strip(),
        city=data["city"].strip(),
        state=data["state"].strip(),
        postal_code=data["postal_code"].strip(),
        country=data["country"].strip(),
    )
    db.session.add_all([user, driver])
    db.session.commit()
    return user, driver, None


def submit_driver_document(driver_public_id, document_type, uploaded_file, operator_id=None):
    driver = get_driver(driver_public_id, operator_id=operator_id)
    return submit_document(driver.user, document_type, uploaded_file)


def create_trip(data, operator_id):
    driver = Driver.query.filter_by(public_id=data.get("driver_id"),operator_id=operator_id,
).first()
    if not driver:
        raise OperatorServiceError("Driver not found", 404)
    if driver.verification_status != DriverStatus.VERIFIED or driver.user.verification_status != "verified":
        raise OperatorServiceError("Driver must be verified before assignment", 403)
    vehicle = Vehicle.query.filter_by(public_id=data.get("vehicle_id"), driver_id=driver.id, is_active=True).first()
    if not vehicle:
        raise OperatorServiceError("Vehicle does not belong to this driver", 422)
    try:
        departure = datetime.fromisoformat(data["departure_time"])
        seats = int(data["available_seats"])
        fare = float(data["fare_per_seat"])
        if seats < 1 or seats > vehicle.total_seats or fare <= 0:
            raise ValueError
    except (KeyError, ValueError, TypeError):
        raise OperatorServiceError("Invalid departure time, seats, or fare", 422)
    trip = Trip(driver_id=driver.id, vehicle_id=vehicle.id, origin_name=data["origin_name"], origin_lat=float(data["origin_lat"]), origin_lng=float(data["origin_lng"]), destination_name=data["destination_name"], destination_lat=float(data["destination_lat"]), destination_lng=float(data["destination_lng"]), departure_time=departure, total_seats=vehicle.total_seats, available_seats=seats, fare_per_seat=fare)
    db.session.add(trip)
    db.session.commit()
    return trip

def create_vehicle(data, operator_id):
    driver = Driver.query.filter_by(
    public_id=data.get("driver_id"),
    operator_id=operator_id,
).first()
    if not driver:
        raise OperatorServiceError("Driver not found", 404)
    if driver.verification_status != DriverStatus.VERIFIED or driver.user.verification_status != "verified":
        raise OperatorServiceError("Driver must be verified before adding a vehicle", 403)
    required = ["registration_number", "vehicle_type", "make", "model", "total_seats"]
    missing = [field for field in required if not data.get(field)]
    if missing:
        raise OperatorServiceError(f"Missing required fields: {', '.join(missing)}", 422)
    if data["vehicle_type"] not in VehicleType.ALL:
        raise OperatorServiceError(f"vehicle_type must be one of {VehicleType.ALL}", 422)
    registration = data["registration_number"].strip().upper()
    if Vehicle.query.filter_by(registration_number=registration).first():
        raise OperatorServiceError("A vehicle with this registration number already exists", 409)
    try:
        seats = int(data["total_seats"])
        if seats < 1 or seats > 60:
            raise ValueError
    except (ValueError, TypeError):
        raise OperatorServiceError("total_seats must be between 1 and 60", 422)
    vehicle = Vehicle(driver_id=driver.id, registration_number=registration, vehicle_type=data["vehicle_type"], make=data["make"].strip(), model=data["model"].strip(), year=data.get("year"), color=data.get("color"), total_seats=seats)
    db.session.add(vehicle)
    db.session.commit()
    return vehicle


def _today_bounds():
    today = datetime.utcnow().date()
    start = datetime.combine(today, datetime.min.time())
    return start, start + timedelta(days=1)


def _trip_dict(trip, include_details=False):
    data = trip.to_dict(include_stops=True)
    data["passenger_count"] = sum(
        booking.seats_booked
        for booking in trip.bookings.all()
        if booking.status == BookingStatus.CONFIRMED
    )
    if include_details:
        data["passengers"] = [_booking_dict(booking) for booking in trip.bookings.all()]
        data["status_history"] = [entry.to_dict() for entry in trip.status_history.all()]
    return data


def _booking_dict(booking):
    customer = booking.passenger
    user = customer.user if customer else None
    return {
        "id": booking.public_id,
        "status": booking.status,
        "seats_booked": booking.seats_booked,
        "fare_total": float(booking.fare_total),
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "trip": booking.trip.to_dict() if booking.trip else None,
        "passenger": {
            "id": customer.public_id if customer else None,
            "name": user.full_name if user else None,
            "email": user.email if user else None,
            "phone": user.phone if user else None,
        },
    }


def dashboard_stats():
    start, end = _today_bounds()
    return {
        "active_trips": Trip.query.filter_by(status=TripStatus.ONGOING).count(),
        "scheduled_trips": Trip.query.filter_by(status=TripStatus.SCHEDULED).count(),
        "online_drivers": Driver.query.filter(
            Driver.availability.in_([DriverAvailability.ONLINE, DriverAvailability.ON_TRIP])
        ).count(),
        "available_drivers": Driver.query.filter_by(availability=DriverAvailability.ONLINE).count(),
        "pending_requests": Booking.query.filter_by(status=BookingStatus.PENDING_PAYMENT).count(),
        "completed_today": Trip.query.filter(
            Trip.status == TripStatus.COMPLETED,
            Trip.completed_at >= start,
            Trip.completed_at < end,
        ).count(),
        "cancelled_today": Trip.query.filter(
            Trip.status == TripStatus.CANCELLED,
            Trip.cancelled_at >= start,
            Trip.cancelled_at < end,
        ).count(),
    }


def list_live_trips():
    return Trip.query.filter_by(status=TripStatus.ONGOING).order_by(Trip.started_at.desc()).all()


def list_trips(status_filter=None):
    query = Trip.query
    if status_filter:
        if status_filter not in TripStatus.ALL:
            raise OperatorServiceError(f"status must be one of {TripStatus.ALL}", 422)
        query = query.filter_by(status=status_filter)
    return query.order_by(Trip.departure_time.desc()).all()


def get_trip(trip_public_id):
    trip = Trip.query.filter_by(public_id=trip_public_id).first()
    if not trip:
        raise OperatorServiceError("Trip not found", 404)
    return trip


def _vehicle_dict(vehicle):
    return vehicle.to_dict() if vehicle else None


def _current_trip(driver):
    return Trip.query.filter(
        Trip.driver_id == driver.id,
        Trip.status == TripStatus.ONGOING,
    ).order_by(Trip.started_at.desc()).first()


def _driver_dict(driver, include_details=False):
    user = driver.user
    vehicle = driver.vehicles.filter_by(is_active=True).order_by(Vehicle.created_at.desc()).first()
    current_trip = _current_trip(driver)
    data = {
        "id": driver.public_id,
        "user_id": user.public_id if user else None,
        "full_name": user.full_name if user else None,
        "email": user.email if user else None,
        "phone": user.phone if user else None,
        "address": driver.address,
        "city": driver.city,
        "state": driver.state,
        "postal_code": driver.postal_code,
        "country": driver.country,
        "availability": driver.availability,
        "verification_status": driver.verification_status,
        "vehicle": _vehicle_dict(vehicle),
        "current_trip": _trip_dict(current_trip) if current_trip else None,
        "rating": float(driver.average_rating) if driver.average_rating is not None else None,
        "total_trips": driver.total_trips,
    }
    if include_details:
        data["license_number"] = driver.license_number
        data["verification_notes"] = driver.verification_notes
        data["vehicles"] = [v.to_dict() for v in driver.vehicles.order_by(Vehicle.created_at.desc()).all()]
        data["verification_documents"] = [document.to_dict() for document in driver.user.verification_documents.order_by("created_at").all()]
        data["assigned_trips"] = [_trip_dict(trip) for trip in driver.trips.order_by(Trip.departure_time.desc()).all()]
    return data


def list_drivers(operator_id):
    return Driver.query.filter_by(operator_id=operator_id).order_by(Driver.created_at.desc()).all()


def get_driver(driver_public_id, operator_id=None):
    query = Driver.query.filter_by(public_id=driver_public_id)
    if operator_id is not None:
        query = query.filter_by(operator_id=operator_id)
    driver = query.first()
    if not driver:
        raise OperatorServiceError("Driver not found", 404)
    return driver


def delete_driver(driver_public_id, operator_id=None):
    driver = get_driver(driver_public_id, operator_id=operator_id)
    if driver.trips.filter(Trip.status.in_([TripStatus.ONGOING, TripStatus.SCHEDULED])).count():
        raise OperatorServiceError("Driver cannot be deleted while they have active or scheduled trips", 409)

    user = driver.user
    if user:
        user.is_active = False

    for vehicle in driver.vehicles.all():
        db.session.delete(vehicle)

    for trip in driver.trips.all():
        db.session.delete(trip)

    db.session.delete(driver)
    db.session.commit()
    return True


def list_passengers(operator_id=None):
    query = Customer.query
    if operator_id is not None:
        operator_customer_ids = (
            db.session.query(Booking.passenger_id)
            .join(Trip, Booking.trip_id == Trip.id)
            .join(Driver, Trip.driver_id == Driver.id)
            .filter(Driver.operator_id == operator_id)
            .distinct()
        )
        query = query.filter(Customer.id.in_(operator_customer_ids))
    return query.order_by(Customer.created_at.desc()).all()


def _passenger_dict(customer, operator_id=None):
    user = customer.user
    active_booking_query = Booking.query.join(Trip, Booking.trip_id == Trip.id).join(Driver, Trip.driver_id == Driver.id).filter(
        Booking.passenger_id == customer.id,
        Booking.status == BookingStatus.CONFIRMED,
        Trip.status == TripStatus.ONGOING,
    )
    if operator_id is not None:
        active_booking_query = active_booking_query.filter(Driver.operator_id == operator_id)
    active_booking = active_booking_query.order_by(Booking.created_at.desc()).first()
    return {
        "id": customer.public_id,
        "full_name": user.full_name if user else None,
        "email": user.email if user else None,
        "phone": user.phone if user else None,
        "is_active": user.is_active if user else None,
        "total_rides": customer.total_rides,
        "average_rating": float(customer.average_rating) if customer.average_rating is not None else None,
        "active_trip": _trip_dict(active_booking.trip) if active_booking else None,
    }


def list_ride_requests(operator_id=None):
    query = Booking.query.filter_by(status=BookingStatus.PENDING_PAYMENT)
    if operator_id is not None:
        query = (
            query.join(Trip, Booking.trip_id == Trip.id)
            .join(Driver, Trip.driver_id == Driver.id)
            .filter(Driver.operator_id == operator_id)
        )
    return query.order_by(Booking.created_at.desc()).all()


def list_settlements(operator_id):
    return (
        OperatorSettlement.query
        .filter_by(operator_id=operator_id)
        .order_by(OperatorSettlement.created_at.desc())
        .all()
    )


def settle_settlement(settlement_public_id, operator_id):
    settlement = OperatorSettlement.query.filter_by(
        public_id=settlement_public_id,
        operator_id=operator_id,
    ).first()

    if not settlement:
        raise OperatorServiceError(
            "Settlement not found",
            404,
        )

    if settlement.status == "settled":
        return settlement

    if settlement.driver is None:
        raise OperatorServiceError(
            "Driver associated with this settlement was not found",
            404,
        )

    amount = settlement.driver_earnings or 0

    if amount <= 0:
        raise OperatorServiceError(
            "Settlement amount must be greater than 0",
            422,
        )

    processed_at = datetime.utcnow()

    try:
        # -----------------------------------------------------
        # 1. Create operator → driver settlement transaction
        # -----------------------------------------------------
        settlement_transaction = OperatorSettlementTransaction(
            settlement=settlement,
            operator_id=settlement.operator_id,
            driver_id=settlement.driver_id,
            amount=amount,
            processed_at=processed_at,
        )

        db.session.add(settlement_transaction)

        # -----------------------------------------------------
        # 2. Get or create driver wallet
        # -----------------------------------------------------
        wallet = DriverWallet.query.filter_by(
            driver_id=settlement.driver_id
        ).first()

        if not wallet:
            wallet = DriverWallet(
                driver_id=settlement.driver_id,
                available_balance=0,
                total_earned=0,
                total_withdrawn=0,
            )
            db.session.add(wallet)
            db.session.flush()

        # -----------------------------------------------------
        # 3. Update driver wallet
        # -----------------------------------------------------
        wallet.available_balance = (
            wallet.available_balance or 0
        ) + amount

        wallet.total_earned = (
            wallet.total_earned or 0
        ) + amount

        # -----------------------------------------------------
        # 4. Create driver wallet transaction
        # -----------------------------------------------------
        wallet_transaction = DriverWalletTransaction(
            wallet=wallet,
            driver_id=settlement.driver_id,
            transaction_type="OPERATOR_SETTLEMENT",
            amount=amount,
            balance_after=wallet.available_balance,
            reference=settlement.public_id,
            description=(
                f"Settlement received from operator "
                f"for trip {settlement.trip.public_id}"
            ),
            status="completed",
        )

        db.session.add(wallet_transaction)

        # -----------------------------------------------------
        # 5. Mark settlement as settled
        # -----------------------------------------------------
        settlement.status = "settled"
        settlement.settled_at = processed_at

        # -----------------------------------------------------
        # 6. Commit everything together
        # -----------------------------------------------------
        db.session.commit()

    except IntegrityError:
        db.session.rollback()

        # Another request may have already settled this
        # settlement because settlement_id is unique.
        existing_transaction = (
            OperatorSettlementTransaction.query
            .filter_by(settlement_id=settlement.id)
            .first()
        )

        if existing_transaction:
            settlement = OperatorSettlement.query.get(
                settlement.id
            )

            if settlement and settlement.status == "settled":
                return settlement

        raise OperatorServiceError(
            "Settlement has already been processed",
            409,
        )

    except Exception:
        db.session.rollback()

        raise OperatorServiceError(
            "Failed to settle driver payment",
            500,
        )

    return settlement


def list_driver_earnings(user_id):
    driver = Driver.query.filter_by(user_id=user_id).first()
    if not driver:
        raise OperatorServiceError("Driver profile not found", 404)
    if driver.operator_id is None:
        return {"driver_type": "freelance", "summary": {"total_earnings": 0, "pending_settlement": 0, "settled_amount": 0}, "records": [], "transactions": []}

    records = OperatorSettlement.query.filter_by(driver_id=driver.id).order_by(OperatorSettlement.created_at.desc()).all()
    transactions = OperatorSettlementTransaction.query.filter_by(driver_id=driver.id).order_by(OperatorSettlementTransaction.processed_at.desc()).all()
    return {
        "driver_type": "operator",
        "operator_id": driver.operator.public_id if driver.operator else None,
        "operator_name": driver.operator.full_name if driver.operator else None,
        "summary": {
            "total_earnings": sum((record.driver_earnings or 0) for record in records),
            "pending_settlement": sum((record.driver_earnings or 0) for record in records if record.status == "pending"),
            "settled_amount": sum((transaction.amount or 0)for transaction in transactions if transaction.status in ("processed", "completed")
),
        },
        "records": [record.to_dict() for record in records],
        "transactions": [transaction.to_dict() for transaction in transactions],
    }



def create_expense(data, operator_id):
    required = [
        "driver_id",
        "vehicle_id",
        "expense_type",
        "amount",
    ]

    missing = [field for field in required if not data.get(field)]

    if missing:
        raise OperatorServiceError(
            f"Missing required fields: {', '.join(missing)}",
            422,
        )

    # ---------------------------------------------------------
    # 1. Find driver belonging to this operator
    # ---------------------------------------------------------
    driver = Driver.query.filter_by(
        public_id=data.get("driver_id"),
        operator_id=operator_id,
    ).first()

    if not driver:
        raise OperatorServiceError(
            "Driver not found or does not belong to this operator",
            404,
        )

    # ---------------------------------------------------------
    # 2. Find vehicle belonging to this driver
    # ---------------------------------------------------------
    vehicle = Vehicle.query.filter_by(
        public_id=data.get("vehicle_id"),
        driver_id=driver.id,
    ).first()

    if not vehicle:
        raise OperatorServiceError(
            "Vehicle not found or does not belong to this driver",
            404,
        )

    # ---------------------------------------------------------
    # 3. Validate expense type
    # ---------------------------------------------------------
    expense_type = str(data.get("expense_type")).strip().upper()

    allowed_expense_types = [
        "FUEL",
        "MAINTENANCE",
        "REPAIR",
        "INSURANCE",
        "TOLL",
        "PARKING",
        "OTHER",
    ]

    if expense_type not in allowed_expense_types:
        raise OperatorServiceError(
            f"expense_type must be one of {allowed_expense_types}",
            422,
        )

    # ---------------------------------------------------------
    # 4. Validate amount
    # ---------------------------------------------------------
    try:
        amount = float(data.get("amount"))

        if amount <= 0:
            raise ValueError

    except (ValueError, TypeError):
        raise OperatorServiceError(
            "amount must be greater than 0",
            422,
        )

    # ---------------------------------------------------------
    # 5. Validate expense date
    # ---------------------------------------------------------
    expense_date = datetime.utcnow()

    if data.get("expense_date"):
        try:
            expense_date = datetime.fromisoformat(
                str(data["expense_date"])
            )
        except ValueError:
            raise OperatorServiceError(
                "expense_date must be a valid ISO date/time",
                422,
            )

    # ---------------------------------------------------------
    # 6. Create expense
    # ---------------------------------------------------------
    expense = VehicleExpense(
        operator_id=operator_id,
        driver_id=driver.id,
        vehicle_id=vehicle.id,
        expense_type=expense_type,
        amount=amount,
        expense_date=expense_date,
        description=data.get("description"),
        receipt_url=data.get("receipt_url"),
        status="approved",
    )

    # ---------------------------------------------------------
    # 7. Save
    # ---------------------------------------------------------
    try:
        db.session.add(expense)
        db.session.commit()

    except Exception:
        db.session.rollback()
        raise OperatorServiceError(
            "Failed to save vehicle expense",
            500,
        )

    return expense



def list_expenses(operator_id):
    return (
        VehicleExpense.query
        .filter_by(operator_id=operator_id)
        .order_by(VehicleExpense.expense_date.desc())
        .all()
    )




def financial_summary(operator_id):
    settlements = (
        OperatorSettlement.query
        .filter_by(operator_id=operator_id)
        .all()
    )

    transactions = (
        OperatorSettlementTransaction.query
        .filter_by(
            operator_id=operator_id,
            status="processed"
        )
        .all()
    )

    expenses = (
        VehicleExpense.query
        .filter_by(
            operator_id=operator_id,
            status="approved"
        )
        .all()
    )

    total_ride_revenue = sum(
        (settlement.ride_revenue or 0)
        for settlement in settlements
    )

    total_driver_earnings = sum(
        (settlement.driver_earnings or 0)
        for settlement in settlements
    )

    total_operator_share = sum(
        (settlement.operator_share or 0)
        for settlement in settlements
    )

    total_driver_paid = sum(
        (transaction.amount or 0)
        for transaction in transactions
    )

    total_vehicle_expenses = sum(
        (expense.amount or 0)
        for expense in expenses
    )

    pending_driver_earnings = sum(
        (settlement.driver_earnings or 0)
        for settlement in settlements
        if settlement.status == "pending"
    )

    settled_operator_share = sum(
        (settlement.operator_share or 0)
        for settlement in settlements
        if settlement.status == "settled"
    )

    net_operator_amount = (
        total_operator_share - total_vehicle_expenses
    )

    return {
        "total_ride_revenue": float(total_ride_revenue),
        "total_driver_earnings": float(total_driver_earnings),
        "total_operator_share": float(total_operator_share),
        "total_driver_paid": float(total_driver_paid),
        "pending_driver_earnings": float(pending_driver_earnings),
        "settled_operator_share": float(settled_operator_share),
        "total_vehicle_expenses": float(total_vehicle_expenses),
        "net_operator_amount": float(net_operator_amount),
    }


def operator_vehicles(operator_id):
    from app.models.vehicle import Vehicle
    from app.models.driver import Driver

    vehicles = (
        Vehicle.query
        .join(Driver, Vehicle.driver_id == Driver.id)
        .filter(Driver.operator_id == operator_id)
        .order_by(Vehicle.created_at.desc())
        .all()
    )

    return vehicles




def list_driver_payout_requests(operator_id, status=None):
    query = DriverPayoutRequest.query.filter_by(
        operator_id=operator_id
    )

    if status:
        query = query.filter_by(
            status=status.strip().lower()
        )

    return (
        query
        .order_by(
            DriverPayoutRequest.created_at.desc()
        )
        .all()
    )