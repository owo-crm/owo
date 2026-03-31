"""inventory templates

Revision ID: 20260326_000012
Revises: 20260326_000011
Create Date: 2026-03-26 00:00:12
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260326_000012"
down_revision = "20260326_000011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "inventory_templates",
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("event_type_match", sa.Text(), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("items", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_inventory_templates_business_id"), "inventory_templates", ["business_id"], unique=False)
    op.create_index(op.f("ix_inventory_templates_event_type_match"), "inventory_templates", ["event_type_match"], unique=False)
    op.alter_column("inventory_templates", "items", server_default=None)


def downgrade() -> None:
    op.drop_index(op.f("ix_inventory_templates_event_type_match"), table_name="inventory_templates")
    op.drop_index(op.f("ix_inventory_templates_business_id"), table_name="inventory_templates")
    op.drop_table("inventory_templates")
