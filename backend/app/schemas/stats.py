from decimal import Decimal

from pydantic import BaseModel


class StatsSummaryResponse(BaseModel):
    total_leads: int
    won_leads: int
    failed_leads: int
    total_revenue: Decimal
    avg_deal_size: Decimal
    conversion_rate: float


class StatsPoint(BaseModel):
    label: str
    leads: int = 0
    revenue: Decimal = Decimal("0")


class StatsSeriesResponse(BaseModel):
    items: list[StatsPoint]
