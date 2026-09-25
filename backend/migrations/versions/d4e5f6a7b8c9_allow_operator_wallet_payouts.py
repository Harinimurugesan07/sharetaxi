"""allow operator wallet payout requests

Revision ID: d4e5f6a7b8c9
Revises: 6e0d689956bc
"""
from alembic import op
import sqlalchemy as sa


revision = "d4e5f6a7b8c9"
down_revision = "6e0d689956bc"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("driver_payout_requests") as batch_op:
        batch_op.alter_column(
            "driver_id",
            existing_type=sa.Integer(),
            nullable=True,
        )


def downgrade():
    with op.batch_alter_table("driver_payout_requests") as batch_op:
        batch_op.alter_column(
            "driver_id",
            existing_type=sa.Integer(),
            nullable=False,
        )
