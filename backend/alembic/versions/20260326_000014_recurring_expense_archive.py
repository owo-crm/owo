"""add archive state to recurring expense templates

Revision ID: 20260326_000014
Revises: 20260326_000013
Create Date: 2026-03-26 23:58:00
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260326_000014"
down_revision: Union[str, None] = "20260326_000013"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("expenses", sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("expenses", "archived_at")
