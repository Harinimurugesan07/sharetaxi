"""Add driver wallets and vehicle expenses

Revision ID: 6a2e050d00af
Revises: f8c9d0e1f2a3
Create Date: 2026-09-23 08:12:26.424122
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "6a2e050d00af"
down_revision = "f8c9d0e1f2a3"
branch_labels = None
depends_on = None


def upgrade():
    # Driver wallets
    op.create_table(
        "driver_wallets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column(
            "available_balance",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column(
            "total_earned",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column(
            "total_withdrawn",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("driver_id"),
        sa.UniqueConstraint("public_id"),
    )

    op.create_index(
        "ix_driver_wallets_public_id",
        "driver_wallets",
        ["public_id"],
        unique=True,
    )
    op.create_index(
        "ix_driver_wallets_driver_id",
        "driver_wallets",
        ["driver_id"],
        unique=False,
    )

    # Driver wallet transactions
    op.create_table(
        "driver_wallet_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("wallet_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("transaction_type", sa.String(length=30), nullable=False),
        sa.Column(
            "amount",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column(
            "balance_after",
            sa.Numeric(precision=12, scale=2),
            nullable=False,
        ),
        sa.Column("reference", sa.String(length=120), nullable=True),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="completed",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["wallet_id"],
            ["driver_wallets.id"],
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )

    op.create_index(
        "ix_driver_wallet_transactions_public_id",
        "driver_wallet_transactions",
        ["public_id"],
        unique=True,
    )
    op.create_index(
        "ix_driver_wallet_transactions_wallet_id",
        "driver_wallet_transactions",
        ["wallet_id"],
        unique=False,
    )
    op.create_index(
        "ix_driver_wallet_transactions_driver_id",
        "driver_wallet_transactions",
        ["driver_id"],
        unique=False,
    )
    op.create_index(
        "ix_driver_wallet_transactions_transaction_type",
        "driver_wallet_transactions",
        ["transaction_type"],
        unique=False,
    )
    op.create_index(
        "ix_driver_wallet_transactions_status",
        "driver_wallet_transactions",
        ["status"],
        unique=False,
    )

    # Vehicle expenses
    op.create_table(
        "vehicle_expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(length=36), nullable=False),
        sa.Column("operator_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=False),
        sa.Column("expense_type", sa.String(length=30), nullable=False),
        sa.Column(
            "amount",
            sa.Numeric(precision=10, scale=2),
            nullable=False,
        ),
        sa.Column("expense_date", sa.DateTime(), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("receipt_url", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="approved",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["operator_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["driver_id"],
            ["drivers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["vehicle_id"],
            ["vehicles.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )

    op.create_index(
        "ix_vehicle_expenses_public_id",
        "vehicle_expenses",
        ["public_id"],
        unique=True,
    )
    op.create_index(
        "ix_vehicle_expenses_operator_id",
        "vehicle_expenses",
        ["operator_id"],
        unique=False,
    )
    op.create_index(
        "ix_vehicle_expenses_driver_id",
        "vehicle_expenses",
        ["driver_id"],
        unique=False,
    )
    op.create_index(
        "ix_vehicle_expenses_vehicle_id",
        "vehicle_expenses",
        ["vehicle_id"],
        unique=False,
    )
    op.create_index(
        "ix_vehicle_expenses_expense_type",
        "vehicle_expenses",
        ["expense_type"],
        unique=False,
    )
    op.create_index(
        "ix_vehicle_expenses_expense_date",
        "vehicle_expenses",
        ["expense_date"],
        unique=False,
    )
    op.create_index(
        "ix_vehicle_expenses_status",
        "vehicle_expenses",
        ["status"],
        unique=False,
    )


def downgrade():
    op.drop_table("vehicle_expenses")
    op.drop_table("driver_wallet_transactions")
    op.drop_table("driver_wallets")