"""Add trip and trip stop tables.

Revision ID: c7e1a2b3d4f5
Revises: b4f0d8cd5667
"""
from alembic import op
import sqlalchemy as sa


revision = "c7e1a2b3d4f5"
down_revision = "b4f0d8cd5667"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "trips",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("origin_name", sa.String(length=200), nullable=False),
        sa.Column("origin_lat", sa.Float(), nullable=False),
        sa.Column("origin_lng", sa.Float(), nullable=False),
        sa.Column("destination_name", sa.String(length=200), nullable=False),
        sa.Column("destination_lat", sa.Float(), nullable=False),
        sa.Column("destination_lng", sa.Float(), nullable=False),
        sa.Column("departure_time", sa.DateTime(), nullable=False),
        sa.Column("estimated_arrival_time", sa.DateTime(), nullable=True),
        sa.Column("total_seats", sa.Integer(), nullable=False),
        sa.Column("available_seats", sa.Integer(), nullable=False),
        sa.Column("fare_per_seat", sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column(
            "status",
            sa.Enum("scheduled", "ongoing", "completed", "cancelled", name="trip_status"),
            nullable=False,
        ),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    with op.batch_alter_table("trips") as batch_op:
        batch_op.create_index("ix_trips_public_id", ["public_id"], unique=True)
        batch_op.create_index("ix_trips_driver_id", ["driver_id"], unique=False)
        batch_op.create_index("ix_trips_departure_time", ["departure_time"], unique=False)
        batch_op.create_index("ix_trips_status", ["status"], unique=False)

    op.create_table(
        "trip_stops",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.Column(
            "stop_type",
            sa.Enum("boarding", "drop", name="stop_type"),
            nullable=False,
        ),
        sa.Column("sequence_order", sa.Integer(), nullable=False),
        sa.Column("estimated_time", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    with op.batch_alter_table("trip_stops") as batch_op:
        batch_op.create_index("ix_trip_stops_public_id", ["public_id"], unique=True)
        batch_op.create_index("ix_trip_stops_trip_id", ["trip_id"], unique=False)


def downgrade():
    with op.batch_alter_table("trip_stops") as batch_op:
        batch_op.drop_index("ix_trip_stops_trip_id")
        batch_op.drop_index("ix_trip_stops_public_id")
    op.drop_table("trip_stops")

    with op.batch_alter_table("trips") as batch_op:
        batch_op.drop_index("ix_trips_status")
        batch_op.drop_index("ix_trips_departure_time")
        batch_op.drop_index("ix_trips_driver_id")
        batch_op.drop_index("ix_trips_public_id")
    op.drop_table("trips")
