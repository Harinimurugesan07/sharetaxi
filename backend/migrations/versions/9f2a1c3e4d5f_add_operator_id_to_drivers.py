"""Add operator_id to drivers.

Revision ID: 9f2a1c3e4d5f
Revises: f1a2b3c4d5e6
"""
from alembic import op
import sqlalchemy as sa


revision = "9f2a1c3e4d5f"
down_revision = "a2b3c4d5e6f7"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.add_column(sa.Column("operator_id", sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f("ix_drivers_operator_id"), ["operator_id"], unique=False)
        batch_op.create_foreign_key(
            "fk_drivers_operator_id_users",
            "users",
            ["operator_id"],
            ["id"],
        )


def downgrade():
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.drop_constraint("fk_drivers_operator_id_users", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_drivers_operator_id"))
        batch_op.drop_column("operator_id")
