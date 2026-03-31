from collections import defaultdict
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, require_active_sub
from app.models.expense import Expense
from app.models.income import Income
from app.models.lead import Lead
from app.models.lead_status import LeadStatus
from app.schemas.stats import StatsPoint, StatsSeriesResponse, StatsSummaryResponse
from app.services.expense_service import ExpenseService

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


async def _load_business_stats_snapshot(db: AsyncSession, business_id) -> tuple[list[Lead], dict[str, LeadStatus], list[Income], list[Expense]]:
    expenses = await ExpenseService(db).stats_snapshot(business_id)
    leads_result = await db.execute(select(Lead).where(Lead.business_id == business_id))
    statuses_result = await db.execute(select(LeadStatus).where(LeadStatus.business_id == business_id))
    incomes_result = await db.execute(select(Income).where(Income.business_id == business_id))

    leads = list(leads_result.scalars().all())
    statuses = {item.name: item for item in statuses_result.scalars().all()}
    incomes = list(incomes_result.scalars().all())
    return leads, statuses, incomes, expenses


@router.get("/summary", response_model=StatsSummaryResponse)
async def get_summary(
    business_id=Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> StatsSummaryResponse:
    leads, statuses, incomes, _expenses = await _load_business_stats_snapshot(db, business_id)

    won_leads = [lead for lead in leads if statuses.get(lead.status) and statuses[lead.status].is_won]
    lost_leads = [lead for lead in leads if statuses.get(lead.status) and statuses[lead.status].is_lost]
    total_revenue = sum((income.amount or Decimal("0")) for income in incomes)
    avg_deal_size = total_revenue / len(won_leads) if won_leads else Decimal("0")
    conversion_rate = (len(won_leads) / len(leads) * 100) if leads else 0.0

    return StatsSummaryResponse(
        total_leads=len(leads),
        won_leads=len(won_leads),
        failed_leads=len(lost_leads),
        total_revenue=total_revenue,
        avg_deal_size=avg_deal_size,
        conversion_rate=round(conversion_rate, 2),
    )


@router.get("/by_period", response_model=StatsSeriesResponse)
async def get_stats_by_period(
    business_id=Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> StatsSeriesResponse:
    leads, statuses, incomes, _expenses = await _load_business_stats_snapshot(db, business_id)
    month_buckets: dict[str, dict[str, Decimal | int]] = defaultdict(lambda: {"leads": 0, "revenue": Decimal("0")})

    for lead in leads:
        created_at = lead.created_at
        if not created_at:
            continue
        bucket = created_at.astimezone(UTC).strftime("%Y-%m")
        month_buckets[bucket]["leads"] = int(month_buckets[bucket]["leads"]) + 1

    won_lead_ids = {
        lead.id
        for lead in leads
        if statuses.get(lead.status) and statuses[lead.status].is_won
    }
    for income in incomes:
        if income.lead_id and income.lead_id not in won_lead_ids:
            continue
        bucket = datetime.combine(income.date, datetime.min.time(), tzinfo=UTC).strftime("%Y-%m")
        month_buckets[bucket]["revenue"] = Decimal(month_buckets[bucket]["revenue"]) + (income.amount or Decimal("0"))

    items = [
      StatsPoint(label=label, leads=int(values["leads"]), revenue=Decimal(values["revenue"]))
      for label, values in sorted(month_buckets.items())
    ]

    return StatsSeriesResponse(items=items)


@router.get("/expenses", response_model=dict)
async def get_expense_stats(
    business_id=Depends(require_active_sub),
    db: AsyncSession = Depends(get_db),
) -> dict:
    expenses = await ExpenseService(db).stats_snapshot(business_id)
    total_expenses = sum((expense.amount or Decimal("0")) for expense in expenses)
    recurring_expenses = sum((expense.amount or Decimal("0")) for expense in expenses if expense.expense_type == "recurring")
    one_time_expenses = sum((expense.amount or Decimal("0")) for expense in expenses if expense.expense_type == "one_time")
    return {
        "total_expenses": str(total_expenses),
        "recurring_expenses": str(recurring_expenses),
        "one_time_expenses": str(one_time_expenses),
    }
