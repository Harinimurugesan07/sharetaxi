"""Add booking table.

Revision ID: d8e2f3a4b5c6
Revises: c7e1a2b3d4f5
"""
from alembic import op
import sqlalchemy as sa


revision = "d8e2f3a4b5c6"
down_revision = "c7e1a2b3d4f5"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("passenger_id", sa.Integer(), nullable=False),
        sa.Column("seats_booked", sa.Integer(), nullable=False),
        sa.Column("fare_total", sa.Numeric(precision=8, scale=2), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending_payment", "confirmed", "cancelled", name="booking_status"),
            nullable=False,
        ),
        sa.Column("razorpay_order_id", sa.String(length=64), nullable=True),
        sa.Column("razorpay_payment_id", sa.String(length=64), nullable=True),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"]),
        sa.ForeignKeyConstraint(["passenger_id"], ["customers.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    with op.batch_alter_table("bookings") as batch_op:
        batch_op.create_index("ix_bookings_public_id", ["public_id"], unique=True)
        batch_op.create_index("ix_bookings_trip_id", ["trip_id"], unique=False)
        batch_op.create_index("ix_bookings_passenger_id", ["passenger_id"], unique=False)
        batch_op.create_index("ix_bookings_status", ["status"], unique=False)


def downgrade():
    with op.batch_alter_table("bookings") as batch_op:
        batch_op.drop_index("ix_bookings_status")
        batch_op.drop_index("ix_bookings_passenger_id")
        batch_op.drop_index("ix_bookings_trip_id")
        batch_op.drop_index("ix_bookings_public_id")
    op.drop_table("bookings")
