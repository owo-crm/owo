"""turn recurring expenses into recurring templates

Revision ID: 20260326_000013
Revises: 20260326_000012
Create Date: 2026-03-26 23:40:00
"""

from __future__ import annotations

import calendar
import uuid
from datetime import date
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "20260326_000013"
down_revision: Union[str, None] = "20260326_000012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_months(value: date, months: int = 1) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    last_day = calendar.monthrange(year, month)[1]
    day = min(value.day, last_day)
    return date(year, month, day)


def upgrade() -> None:
    op.add_column("expenses", sa.Column("is_template", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("expenses", sa.Column("recurring_interval", sa.Text(), nullable=True))
    op.add_column("expenses", sa.Column("next_due_date", sa.Date(), nullable=True))
    op.add_column("expenses", sa.Column("recurring_active", sa.Boolean(), nullable=False, server_default=sa.text("true")))
    op.add_column("expenses", sa.Column("parent_recurring_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_expenses_parent_recurring_id_expenses",
        "expenses",
        "expenses",
        ["parent_recurring_id"],
        ["id"],
        ondelete="SET NULL",
    )

    connection = op.get_bind()
    recurring_rows = connection.execute(
        sa.text(
            """
            SELECT id, business_id, lead_id, created_by, title, amount, description, date, created_at
            FROM expenses
            WHERE expense_type = 'recurring'
            """
        )
    ).mappings().all()

    for row in recurring_rows:
        next_due = _add_months(row["date"], 1)
        connection.execute(
            sa.text(
                """
                UPDATE expenses
                SET is_template = true,
                    recurring_interval = 'monthly',
                    next_due_date = :next_due,
                    recurring_active = true,
                    parent_recurring_id = NULL
                WHERE id = :expense_id
                """
            ),
            {
                "expense_id": row["id"],
                "next_due": next_due,
            },
        )
        connection.execute(
            sa.text(
                """
                INSERT INTO expenses (
                    id,
                    business_id,
                    lead_id,
                    created_by,
                    expense_type,
                    is_template,
                    recurring_interval,
                    next_due_date,
                    recurring_active,
                    parent_recurring_id,
                    title,
                    amount,
                    description,
                    date,
                    created_at
                ) VALUES (
                    :occurrence_id,
                    :business_id,
                    :lead_id,
                    :created_by,
                    'recurring',
                    false,
                    'monthly',
                    NULL,
                    true,
                    :parent_recurring_id,
                    :title,
                    :amount,
                    :description,
                    :date,
                    :created_at
                )
                """
            ),
            {
                "occurrence_id": uuid.uuid4(),
                "business_id": row["business_id"],
                "lead_id": row["lead_id"],
                "created_by": row["created_by"],
                "parent_recurring_id": row["id"],
                "title": row["title"],
                "amount": row["amount"],
                "description": row["description"],
                "date": row["date"],
                "created_at": row["created_at"],
            },
        )


def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(sa.text("DELETE FROM expenses WHERE parent_recurring_id IS NOT NULL"))
    connection.execute(
        sa.text(
            """
            UPDATE expenses
            SET is_template = false,
                recurring_interval = NULL,
                next_due_date = NULL,
                recurring_active = true,
                parent_recurring_id = NULL
            WHERE expense_type = 'recurring'
            """
        )
    )
    op.drop_constraint("fk_expenses_parent_recurring_id_expenses", "expenses", type_="foreignkey")
    op.drop_column("expenses", "parent_recurring_id")
    op.drop_column("expenses", "recurring_active")
    op.drop_column("expenses", "next_due_date")
    op.drop_column("expenses", "recurring_interval")
    op.drop_column("expenses", "is_template")
