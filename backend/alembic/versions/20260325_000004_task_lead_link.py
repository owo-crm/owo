"""link tasks to leads

Revision ID: 20260325_000004
Revises: 20260325_000003
Create Date: 2026-03-25 22:15:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "20260325_000004"
down_revision: Union[str, None] = "20260325_000003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("lead_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_tasks_lead_id_leads",
        "tasks",
        "leads",
        ["lead_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_tasks_lead_id_leads", "tasks", type_="foreignkey")
    op.drop_column("tasks", "lead_id")
