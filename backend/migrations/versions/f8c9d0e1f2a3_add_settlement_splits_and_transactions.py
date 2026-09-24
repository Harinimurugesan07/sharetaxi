"""Add settlement splits and settlement transaction history.

Revision ID: f8c9d0e1f2a3
Revises: f7b8c9d0e1f2
"""
from alembic import op
import sqlalchemy as sa


revision = "f8c9d0e1f2a3"
down_revision = "f7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("operator_settlements") as batch_op:
        batch_op.add_column(sa.Column("ride_revenue", sa.Numeric(10, 2), nullable=True))
        batch_op.add_column(sa.Column("driver_earnings", sa.Numeric(10, 2), nullable=True))
        batch_op.add_column(sa.Column("operator_share", sa.Numeric(10, 2), nullable=True))

    op.execute(
        "UPDATE operator_settlements SET ride_revenue = amount, driver_earnings = amount, operator_share = 0"
    )
    with op.batch_alter_table("operator_settlements") as batch_op:
        batch_op.alter_column("ride_revenue", existing_type=sa.Numeric(10, 2), nullable=False)
        batch_op.alter_column("driver_earnings", existing_type=sa.Numeric(10, 2), nullable=False)
        batch_op.alter_column("operator_share", existing_type=sa.Numeric(10, 2), nullable=False)
        batch_op.drop_column("amount")

    op.create_table(
        "operator_settlement_transactions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("settlement_id", sa.Integer(), nullable=False),
        sa.Column("operator_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="processed"),
        sa.Column("processed_at", sa.DateTime(), nullable=False),
        sa.Column("reference", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["settlement_id"], ["operator_settlements.id"]),
        sa.ForeignKeyConstraint(["operator_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"]),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index("ix_operator_settlement_transactions_public_id", "operator_settlement_transactions", ["public_id"], unique=True)
    op.create_index("ix_operator_settlement_transactions_settlement_id", "operator_settlement_transactions", ["settlement_id"], unique=False)
    op.create_index("ix_operator_settlement_transactions_operator_id", "operator_settlement_transactions", ["operator_id"], unique=False)
    op.create_index("ix_operator_settlement_transactions_driver_id", "operator_settlement_transactions", ["driver_id"], unique=False)
    op.create_index("ix_operator_settlement_transactions_status", "operator_settlement_transactions", ["status"], unique=False)


def downgrade():
    op.drop_index("ix_operator_settlement_transactions_status", table_name="operator_settlement_transactions")
    op.drop_index("ix_operator_settlement_transactions_driver_id", table_name="operator_settlement_transactions")
    op.drop_index("ix_operator_settlement_transactions_operator_id", table_name="operator_settlement_transactions")
    op.drop_index("ix_operator_settlement_transactions_settlement_id", table_name="operator_settlement_transactions")
    op.drop_index("ix_operator_settlement_transactions_public_id", table_name="operator_settlement_transactions")
    op.drop_table("operator_settlement_transactions")
    with op.batch_alter_table("operator_settlements") as batch_op:
        batch_op.add_column(sa.Column("amount", sa.Numeric(10, 2), nullable=True))
    op.execute("UPDATE operator_settlements SET amount = driver_earnings")
    with op.batch_alter_table("operator_settlements") as batch_op:
        batch_op.alter_column("amount", existing_type=sa.Numeric(10, 2), nullable=False)
        batch_op.drop_column("operator_share")
        batch_op.drop_column("driver_earnings")
        batch_op.drop_column("ride_revenue")