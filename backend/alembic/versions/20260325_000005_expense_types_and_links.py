"""expand expenses with type and lead link

Revision ID: 20260325_000005
Revises: 20260325_000004
Create Date: 2026-03-25 23:05:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "20260325_000005"
down_revision: Union[str, None] = "20260325_000004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("expenses", sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column(
        "expenses",
        sa.Column("expense_type", sa.Text(), nullable=False, server_default="one_time"),
    )
    op.add_column(
        "expenses",
        sa.Column("title", sa.Text(), nullable=False, server_default="Expense"),
    )
    op.create_foreign_key(
        "fk_expenses_lead_id_leads",
        "expenses",
        "leads",
        ["lead_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_expenses_lead_id_leads", "expenses", type_="foreignkey")
    op.drop_column("expenses", "title")
    op.drop_column("expenses", "expense_type")
    op.drop_column("expenses", "lead_id")
