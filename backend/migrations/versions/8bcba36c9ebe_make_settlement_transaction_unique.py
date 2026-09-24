"""Make settlement transaction unique

Revision ID: 8bcba36c9ebe
Revises: 6a2e050d00af
Create Date: 2026-09-23 08:19:24.710265
"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "8bcba36c9ebe"
down_revision = "6a2e050d00af"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_index(
        "ix_operator_settlement_transactions_settlement_id",
        table_name="operator_settlement_transactions",
    )

    op.create_index(
        "ix_operator_settlement_transactions_settlement_id",
        "operator_settlement_transactions",
        ["settlement_id"],
        unique=True,
    )


def downgrade():
    op.drop_index(
        "ix_operator_settlement_transactions_settlement_id",
        table_name="operator_settlement_transactions",
    )

    op.create_index(
        "ix_operator_settlement_transactions_settlement_id",
        "operator_settlement_transactions",
        ["settlement_id"],
        unique=False,
    )