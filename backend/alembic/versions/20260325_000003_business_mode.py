"""add business mode to businesses

Revision ID: 20260325_000003
Revises: 20260325_000002
Create Date: 2026-03-25 16:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260325_000003"
down_revision: Union[str, None] = "20260325_000002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "businesses",
        sa.Column("business_mode", sa.Text(), nullable=False, server_default="general_sales"),
    )
    op.execute(
        """
        update businesses
        set business_mode = 'events_bookings'
        where sheet_verified = true
        """
    )


def downgrade() -> None:
    op.drop_column("businesses", "business_mode")
