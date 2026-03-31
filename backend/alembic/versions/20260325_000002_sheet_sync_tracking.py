"""add sheet sync tracking to businesses

Revision ID: 20260325_000002
Revises: 20260324_000001
Create Date: 2026-03-25 15:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260325_000002"
down_revision: Union[str, None] = "20260324_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("businesses", sa.Column("sheet_last_synced_at", sa.DateTime(timezone=True), nullable=True))
    op.execute(
        """
        update businesses
        set sheet_last_synced_at = now()
        where id in (
            select distinct business_id
            from leads
        )
        """
    )


def downgrade() -> None:
    op.drop_column("businesses", "sheet_last_synced_at")
