"""add lead attachments and team role metadata

Revision ID: 20260326_000006
Revises: 20260325_000005
Create Date: 2026-03-26 10:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "20260326_000006"
down_revision: Union[str, None] = "20260325_000005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("business_members", sa.Column("position", sa.Text(), nullable=True))
    op.add_column(
        "business_members",
        sa.Column("custom_permissions", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default="[]"),
    )

    op.create_table(
        "lead_attachments",
        sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("uploaded_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("original_name", sa.Text(), nullable=False),
        sa.Column("content_type", sa.Text(), nullable=True),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("storage_path", sa.Text(), nullable=False),
        sa.Column("public_url", sa.Text(), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["lead_id"], ["leads.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_lead_attachments_lead_id", "lead_attachments", ["lead_id"])
    op.create_index("ix_lead_attachments_business_id", "lead_attachments", ["business_id"])


def downgrade() -> None:
    op.drop_index("ix_lead_attachments_business_id", table_name="lead_attachments")
    op.drop_index("ix_lead_attachments_lead_id", table_name="lead_attachments")
    op.drop_table("lead_attachments")
    op.drop_column("business_members", "custom_permissions")
    op.drop_column("business_members", "position")
