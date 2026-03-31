"""add lead status semantic properties

Revision ID: 20260326_000008
Revises: 20260326_000007
Create Date: 2026-03-26 20:30:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20260326_000008"
down_revision = "20260326_000007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "lead_statuses",
        sa.Column("is_won", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "lead_statuses",
        sa.Column("is_lost", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "lead_statuses",
        sa.Column("requires_follow_up", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "lead_statuses",
        sa.Column("hide_from_active", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )

    op.execute("UPDATE lead_statuses SET requires_follow_up = true WHERE name = 'waiting_for_call'")
    op.execute("UPDATE lead_statuses SET is_won = true, hide_from_active = true WHERE name = 'won'")
    op.execute("UPDATE lead_statuses SET is_lost = true, hide_from_active = true WHERE name = 'failed'")

    op.alter_column("lead_statuses", "is_won", server_default=None)
    op.alter_column("lead_statuses", "is_lost", server_default=None)
    op.alter_column("lead_statuses", "requires_follow_up", server_default=None)
    op.alter_column("lead_statuses", "hide_from_active", server_default=None)


def downgrade() -> None:
    op.drop_column("lead_statuses", "hide_from_active")
    op.drop_column("lead_statuses", "requires_follow_up")
    op.drop_column("lead_statuses", "is_lost")
    op.drop_column("lead_statuses", "is_won")
