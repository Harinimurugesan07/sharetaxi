"""Add operator role and trip status history.

Revision ID: e9f4a6b7c8d9
Revises: d8e2f3a4b5c6
"""
from alembic import op
import sqlalchemy as sa


revision = "e9f4a6b7c8d9"
down_revision = "d8e2f3a4b5c6"
branch_labels = None
depends_on = None


def upgrade():
    if op.get_bind().dialect.name == "mysql":
        op.execute(
            "ALTER TABLE users MODIFY COLUMN role "
            "ENUM('passenger', 'driver', 'admin', 'operator') NOT NULL"
        )

    op.create_table(
        "trip_status_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("changed_by_user_id", sa.Integer(), nullable=False),
        sa.Column("old_status", sa.String(length=20), nullable=True),
        sa.Column("new_status", sa.String(length=20), nullable=False),
        sa.Column("changed_at", sa.DateTime(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"]),
        sa.ForeignKeyConstraint(["changed_by_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("trip_status_history") as batch_op:
        batch_op.create_index("ix_trip_status_history_trip_id", ["trip_id"], unique=False)
        batch_op.create_index("ix_trip_status_history_changed_by_user_id", ["changed_by_user_id"], unique=False)


def downgrade():
    with op.batch_alter_table("trip_status_history") as batch_op:
        batch_op.drop_index("ix_trip_status_history_changed_by_user_id")
        batch_op.drop_index("ix_trip_status_history_trip_id")
    op.drop_table("trip_status_history")
    if op.get_bind().dialect.name == "mysql":
        op.execute(
            "ALTER TABLE users MODIFY COLUMN role "
            "ENUM('passenger', 'driver', 'admin') NOT NULL"
        )
