"""Add address details to driver profiles.

Revision ID: a2b3c4d5e6f7
Revises: f1a2b3c4d5e6
"""
from alembic import op
import sqlalchemy as sa

revision = "a2b3c4d5e6f7"
down_revision = "f1a2b3c4d5e6"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.add_column(sa.Column("address", sa.String(500), nullable=True))
        batch_op.add_column(sa.Column("city", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("state", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("postal_code", sa.String(20), nullable=True))
        batch_op.add_column(sa.Column("country", sa.String(100), nullable=True))

    op.execute(
        "UPDATE drivers SET address = 'Not provided', city = 'Not provided', "
        "state = 'Not provided', postal_code = 'Not provided', country = 'Not provided'"
    )

    with op.batch_alter_table("drivers") as batch_op:
        batch_op.alter_column("address", existing_type=sa.String(500), nullable=False)
        batch_op.alter_column("city", existing_type=sa.String(100), nullable=False)
        batch_op.alter_column("state", existing_type=sa.String(100), nullable=False)
        batch_op.alter_column("postal_code", existing_type=sa.String(20), nullable=False)
        batch_op.alter_column("country", existing_type=sa.String(100), nullable=False)


def downgrade():
    with op.batch_alter_table("drivers") as batch_op:
        batch_op.drop_column("country")
        batch_op.drop_column("postal_code")
        batch_op.drop_column("state")
        batch_op.drop_column("city")
        batch_op.drop_column("address")