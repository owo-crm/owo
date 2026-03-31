import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate
from app.services.event_service import DomainEvent, EventService, decimal_to_string


class IncomeService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_incomes(
        self,
        business_id: uuid.UUID,
        *,
        lead_id: uuid.UUID | None = None,
    ) -> list[Income]:
        query = select(Income).where(Income.business_id == business_id)
        if lead_id:
            query = query.where(Income.lead_id == lead_id)
        query = query.order_by(Income.date.desc(), Income.created_at.desc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_income(self, created_by: uuid.UUID, payload: IncomeCreate) -> Income:
        income = Income(
            business_id=payload.business_id,
            lead_id=payload.lead_id,
            created_by=created_by,
            title=payload.title,
            amount=payload.amount,
            description=payload.description,
            date=payload.date,
        )
        self.db.add(income)
        await self.db.flush()
        await EventService(self.db).emit(
            DomainEvent(
                business_id=income.business_id,
                event_type="income_created",
                entity_type="income",
                entity_id=income.id,
                lead_id=income.lead_id,
                triggered_by_user_id=created_by,
                payload=self._income_event_payload(income),
            )
        )
        await self.db.commit()
        await self.db.refresh(income)
        return income

    async def get_income(self, business_id: uuid.UUID, income_id: uuid.UUID) -> Income | None:
        result = await self.db.execute(select(Income).where(Income.business_id == business_id, Income.id == income_id))
        return result.scalar_one_or_none()

    async def update_income(self, income: Income, payload: IncomeUpdate) -> Income:
        for key, value in payload.model_dump(exclude_unset=True, mode="python").items():
            setattr(income, key, value)
        await self.db.commit()
        await self.db.refresh(income)
        return income

    async def delete_income(self, income: Income) -> None:
        await self.db.delete(income)
        await self.db.commit()

    def _income_event_payload(self, income: Income, *, extra: dict[str, Any] | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "income": {
                "id": str(income.id),
                "lead_id": str(income.lead_id) if income.lead_id else None,
                "title": income.title,
                "amount": decimal_to_string(income.amount),
                "date": income.date.isoformat(),
            }
        }
        if extra:
            payload.update(extra)
        return payload
