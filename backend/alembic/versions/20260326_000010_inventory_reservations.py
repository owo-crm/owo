"""inventory reservations

Revision ID: 20260326_000010
Revises: 20260326_000009
Create Date: 2026-03-26 00:00:10
"""

from alembic import op
import sqlalchemy as sa


revision = "20260326_000010"
down_revision = "20260326_000009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "inventory_items",
        sa.Column("reserved_quantity", sa.Numeric(12, 2), nullable=False, server_default="0"),
    )
    op.alter_column("inventory_items", "reserved_quantity", server_default=None)


def downgrade() -> None:
    op.drop_column("inventory_items", "reserved_quantity")
