"""Add onboarding states, verification documents, and subscriptions.

Revision ID: f1a2b3c4d5e6
Revises: e9f4a6b7c8d9
"""
from alembic import op
import sqlalchemy as sa

revision = "f1a2b3c4d5e6"
down_revision = "e9f4a6b7c8d9"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("verification_status", sa.String(20), nullable=False, server_default="pending"))
        batch_op.add_column(sa.Column("verification_notes", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("verified_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("subscription_status", sa.String(20), nullable=False, server_default="inactive"))
        batch_op.add_column(sa.Column("subscription_plan", sa.String(40), nullable=True))
        batch_op.add_column(sa.Column("subscription_started_at", sa.DateTime(), nullable=True))
        batch_op.add_column(sa.Column("subscription_expires_at", sa.DateTime(), nullable=True))
        batch_op.create_index("ix_users_verification_status", ["verification_status"], unique=False)
        batch_op.create_index("ix_users_subscription_status", ["subscription_status"], unique=False)

    op.create_table(
        "verification_documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("document_type", sa.String(40), nullable=False),
        sa.Column("file_url", sa.String(500), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("reviewed_by", sa.Integer(), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index("ix_verification_documents_user_id", "verification_documents", ["user_id"])
    op.create_index("ix_verification_documents_status", "verification_documents", ["status"])

    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("public_id", sa.String(36), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("plan", sa.String(40), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="inactive"),
        sa.Column("payment_reference", sa.String(120), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("public_id"),
    )
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])


def downgrade():
    op.drop_table("subscriptions")
    op.drop_table("verification_documents")
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_subscription_status")
        batch_op.drop_index("ix_users_verification_status")
        batch_op.drop_column("subscription_expires_at")
        batch_op.drop_column("subscription_started_at")
        batch_op.drop_column("subscription_plan")
        batch_op.drop_column("subscription_status")
        batch_op.drop_column("verified_at")
        batch_op.drop_column("verification_notes")
        batch_op.drop_column("verification_status")