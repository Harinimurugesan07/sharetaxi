"""Add operator settlement records for completed operator trips.

Revision ID: f7b8c9d0e1f2
Revises: 9f2a1c3e4d5f, 7e1aeb297adf
"""
from alembic import op
import sqlalchemy as sa


revision = "f7b8c9d0e1f2"
down_revision = ("9f2a1c3e4d5f", "7e1aeb297adf")
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "operator_settlements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("operator_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("settled_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["operator_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"]),
        sa.UniqueConstraint("public_id"),
        sa.UniqueConstraint("trip_id"),
    )
    op.create_index("ix_operator_settlements_public_id", "operator_settlements", ["public_id"], unique=True)
    op.create_index("ix_operator_settlements_operator_id", "operator_settlements", ["operator_id"], unique=False)
    op.create_index("ix_operator_settlements_driver_id", "operator_settlements", ["driver_id"], unique=False)
    op.create_index("ix_operator_settlements_trip_id", "operator_settlements", ["trip_id"], unique=True)
    op.create_index("ix_operator_settlements_status", "operator_settlements", ["status"], unique=False)


def downgrade():
    op.drop_index("ix_operator_settlements_status", table_name="operator_settlements")
    op.drop_index("ix_operator_settlements_trip_id", table_name="operator_settlements")
    op.drop_index("ix_operator_settlements_driver_id", table_name="operator_settlements")
    op.drop_index("ix_operator_settlements_operator_id", table_name="operator_settlements")
    op.drop_index("ix_operator_settlements_public_id", table_name="operator_settlements")
    op.drop_table("operator_settlements")