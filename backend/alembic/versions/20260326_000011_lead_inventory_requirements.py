"""lead inventory requirements

Revision ID: 20260326_000011
Revises: 20260326_000010
Create Date: 2026-03-26 00:00:11
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260326_000011"
down_revision = "20260326_000010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lead_inventory_requirements",
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("item_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("required_quantity", sa.Numeric(12, 2), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["item_id"], ["inventory_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_lead_inventory_requirements_business_id"), "lead_inventory_requirements", ["business_id"], unique=False)
    op.create_index(op.f("ix_lead_inventory_requirements_item_id"), "lead_inventory_requirements", ["item_id"], unique=False)
    op.create_index(op.f("ix_lead_inventory_requirements_lead_id"), "lead_inventory_requirements", ["lead_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_lead_inventory_requirements_lead_id"), table_name="lead_inventory_requirements")
    op.drop_index(op.f("ix_lead_inventory_requirements_item_id"), table_name="lead_inventory_requirements")
    op.drop_index(op.f("ix_lead_inventory_requirements_business_id"), table_name="lead_inventory_requirements")
    op.drop_table("lead_inventory_requirements")
