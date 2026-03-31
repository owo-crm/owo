import uuid
from datetime import UTC, datetime, timedelta
from datetime import date
from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.business import Business
from app.models.lead import Lead
from app.models.lead_status import LeadStatus
from app.models.task import Task
from app.schemas.lead import LeadCreate, LeadUpdate
from app.services.event_service import DomainEvent, EventService, decimal_to_string
from app.utils.additional_info import clean_additional_info_fields, mapped_additional_info_labels
from app.utils.phone import normalize_phone


class LeadService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_leads(
        self,
        business_id: uuid.UUID,
        page: int,
        page_size: int,
        status: str | None = None,
        assigned_filter: str | None = None,
        search: str | None = None,
        visible_user_id: uuid.UUID | None = None,
        status_scope: str | None = None,
        sort_by: str = "received_at",
        sort_dir: str = "desc",
    ) -> tuple[list[Lead], int]:
        filters = [Lead.business_id == business_id]
        if visible_user_id:
            filters.append(Lead.assigned_to == visible_user_id)
        if status and status != "all":
            filters.append(Lead.status == status)
        if status_scope and status_scope != "all":
            if status_scope == "follow_up":
                follow_up_statuses = await self._status_names_for_scope(business_id, status_scope)
                open_task_leads_query = (
                    select(Task.lead_id)
                    .join(Lead, Lead.id == Task.lead_id)
                    .where(
                        Lead.business_id == business_id,
                        Task.done_at.is_(None),
                        Task.lead_id.is_not(None),
                    )
                    .distinct()
                )
                open_task_lead_ids = list((await self.db.execute(open_task_leads_query)).scalars().all())
                follow_up_filters = []
                if follow_up_statuses:
                    follow_up_filters.append(Lead.status.in_(follow_up_statuses))
                if open_task_lead_ids:
                    follow_up_filters.append(Lead.id.in_(open_task_lead_ids))
                if follow_up_filters:
                    filters.append(or_(*follow_up_filters))
                else:
                    filters.append(Lead.id.is_(None))
            else:
                semantic_statuses = await self._status_names_for_scope(business_id, status_scope)
                if semantic_statuses is not None:
                    if semantic_statuses:
                        filters.append(Lead.status.in_(semantic_statuses))
                    else:
                        filters.append(Lead.id.is_(None))
        if assigned_filter == "assigned":
            filters.append(Lead.assigned_to.is_not(None))
        elif assigned_filter == "unassigned":
            filters.append(Lead.assigned_to.is_(None))
        if search and search.strip():
            query = search.strip()
            normalized_query = normalize_phone(query) or query
            filters.append(
                or_(
                    Lead.name.ilike(f"%{query}%"),
                    Lead.phone.ilike(f"%{query}%"),
                    Lead.phone.ilike(f"%{normalized_query}%"),
                    Lead.email.ilike(f"%{query}%"),
                )
            )

        total_query = select(func.count()).select_from(Lead).where(*filters)
        total = int((await self.db.execute(total_query)).scalar_one())

        sort_column = Lead.created_at if sort_by == "received_at" else Lead.updated_at
        order_by_clause = sort_column.asc() if sort_dir == "asc" else sort_column.desc()

        items_query = (
            select(Lead)
            .where(*filters)
            .order_by(order_by_clause)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list((await self.db.execute(items_query)).scalars().all())
        return items, total

    async def create_lead(
        self,
        payload: LeadCreate,
        *,
        triggered_by_user_id: uuid.UUID | None = None,
        event_source: str = "manual",
    ) -> Lead:
        allowed_additional_info_labels = await self._allowed_additional_info_labels(payload.business_id)
        name = payload.name.strip() if payload.name else None
        phone = normalize_phone(payload.phone)
        email = self._normalize_email(payload.email)
        custom_fields = clean_additional_info_fields(
            payload.custom_fields,
            allowed_labels=allowed_additional_info_labels,
        )

        matched_leads = await self._find_matching_leads(
            payload.business_id,
            phone=phone,
            email=email,
            name=name,
            event_date=payload.event_date,
        )
        if matched_leads:
            master_lead = self._pick_master_lead(matched_leads)
            duplicate_leads = [lead for lead in matched_leads if lead.id != master_lead.id]
            merged_duplicates = await self._merge_duplicate_group(
                master_lead,
                duplicate_leads,
                allowed_additional_info_labels=allowed_additional_info_labels,
            )
            was_updated = self._apply_mapped_values_to_lead(
                master_lead,
                name=name,
                phone=phone,
                email=email,
                city=payload.city,
                event_date=payload.event_date,
                event_type=payload.event_type,
                notes=payload.notes,
                contract_value=payload.contract_value,
                assigned_to=payload.assigned_to,
                custom_fields=custom_fields,
                allowed_additional_info_labels=allowed_additional_info_labels,
            )
            if was_updated or merged_duplicates:
                await EventService(self.db).emit(
                    DomainEvent(
                        business_id=master_lead.business_id,
                        event_type="lead_updated",
                        entity_type="lead",
                        entity_id=master_lead.id,
                        lead_id=master_lead.id,
                        triggered_by_user_id=triggered_by_user_id,
                        payload=self._lead_event_payload(
                            master_lead,
                            source=f"{event_source}_duplicate_merge",
                            changed_fields=["duplicate_merge"],
                            extra={"merged_duplicates": merged_duplicates},
                        ),
                    )
                )
                await self.db.commit()
                await self.db.refresh(master_lead)
            setattr(master_lead, "merged_existing", True)
            setattr(
                master_lead,
                "merge_message",
                "Matched an existing lead and merged the new details into it.",
            )
            return master_lead

        lead = Lead(
            uid=await self._generate_uid(),
            business_id=payload.business_id,
            name=name,
            phone=phone,
            email=email,
            city=payload.city,
            event_date=payload.event_date,
            event_type=payload.event_type,
            status=payload.status or "new",
            assigned_to=payload.assigned_to,
            contract_value=payload.contract_value,
            notes=payload.notes,
            next_call_at=payload.next_call_at,
            source=payload.source,
            custom_fields=custom_fields,
        )
        self.db.add(lead)
        await self.db.flush()
        await EventService(self.db).emit(
            DomainEvent(
                business_id=lead.business_id,
                event_type="lead_created",
                entity_type="lead",
                entity_id=lead.id,
                lead_id=lead.id,
                triggered_by_user_id=triggered_by_user_id,
                dedupe_key=f"lead_created:{lead.id}",
                payload=self._lead_event_payload(
                    lead,
                    source=event_source,
                    changed_fields=["name", "phone", "email", "status", "assigned_to"],
                ),
            )
        )
        await self.db.commit()
        await self.db.refresh(lead)
        return lead

    async def get_by_uid(self, business_id: uuid.UUID, uid: str) -> Lead | None:
        result = await self.db.execute(
            select(Lead).where(Lead.business_id == business_id, Lead.uid == uid)
        )
        return result.scalar_one_or_none()

    async def update_lead(
        self,
        lead: Lead,
        payload: LeadUpdate,
        *,
        triggered_by_user_id: uuid.UUID | None = None,
        event_source: str = "manual",
    ) -> Lead:
        data = payload.model_dump(exclude_unset=True, mode="python")
        if "phone" in data:
            data["phone"] = normalize_phone(data["phone"])
        if "custom_fields" in data:
            data["custom_fields"] = clean_additional_info_fields(
                data["custom_fields"],
                allowed_labels=await self._allowed_additional_info_labels(lead.business_id),
            )
        old_status = lead.status
        old_assigned_to = lead.assigned_to
        changed_fields: list[str] = []
        for key, value in data.items():
            if getattr(lead, key) != value:
                changed_fields.append(key)
            setattr(lead, key, value)

        if changed_fields:
            event_service = EventService(self.db)
            if old_assigned_to != lead.assigned_to:
                await event_service.emit(
                    DomainEvent(
                        business_id=lead.business_id,
                        event_type="lead_assigned",
                        entity_type="lead",
                        entity_id=lead.id,
                        lead_id=lead.id,
                        triggered_by_user_id=triggered_by_user_id,
                        payload=self._lead_event_payload(
                            lead,
                            source=event_source,
                            changed_fields=["assigned_to"],
                            extra={"previous_assigned_to": str(old_assigned_to) if old_assigned_to else None},
                        ),
                    )
                )
            if old_status != lead.status:
                await event_service.emit(
                    DomainEvent(
                        business_id=lead.business_id,
                        event_type="lead_status_changed",
                        entity_type="lead",
                        entity_id=lead.id,
                        lead_id=lead.id,
                        triggered_by_user_id=triggered_by_user_id,
                        payload=self._lead_event_payload(
                            lead,
                            source=event_source,
                            changed_fields=["status"],
                            extra={"previous_status": old_status},
                        ),
                    )
                )
            await event_service.emit(
                DomainEvent(
                    business_id=lead.business_id,
                    event_type="lead_updated",
                    entity_type="lead",
                    entity_id=lead.id,
                    lead_id=lead.id,
                    triggered_by_user_id=triggered_by_user_id,
                    payload=self._lead_event_payload(
                        lead,
                        source=event_source,
                        changed_fields=changed_fields,
                    ),
                )
            )
        await self.db.commit()
        await self.db.refresh(lead)
        return lead

    async def delete_lead(self, lead: Lead, *, triggered_by_user_id: uuid.UUID | None = None) -> None:
        await EventService(self.db).emit(
            DomainEvent(
                business_id=lead.business_id,
                event_type="lead_deleted",
                entity_type="lead",
                entity_id=lead.id,
                lead_id=lead.id,
                triggered_by_user_id=triggered_by_user_id,
                payload=self._lead_event_payload(lead, source="manual", changed_fields=[]),
            )
        )
        await self.db.delete(lead)
        await self.db.commit()

    async def _generate_uid(self) -> str:
        while True:
            candidate = uuid.uuid4().hex[:8]
            existing = await self.db.execute(select(Lead).where(Lead.uid == candidate))
            if existing.scalar_one_or_none() is None:
                return candidate

    async def _allowed_additional_info_labels(self, business_id: uuid.UUID) -> set[str]:
        mapping_result = await self.db.execute(
            select(Business.sheet_column_mapping).where(Business.id == business_id)
        )
        return mapped_additional_info_labels(mapping_result.scalar_one_or_none())

    async def _status_names_for_scope(self, business_id: uuid.UUID, status_scope: str) -> list[str] | None:
        query = select(LeadStatus.name).where(LeadStatus.business_id == business_id)
        if status_scope == "active":
            query = query.where(LeadStatus.hide_from_active.is_(False))
        elif status_scope == "won":
            query = query.where(LeadStatus.is_won.is_(True))
        elif status_scope == "lost":
            query = query.where(LeadStatus.is_lost.is_(True))
        elif status_scope == "follow_up":
            query = query.where(LeadStatus.requires_follow_up.is_(True))
        else:
            return None
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def _find_matching_leads(
        self,
        business_id: uuid.UUID,
        *,
        phone: str | None,
        email: str | None,
        name: str | None,
        event_date: date | None,
    ) -> list[Lead]:
        duplicate_cutoff = datetime.now(UTC) - timedelta(days=30)
        duplicate_query = select(Lead).where(
            Lead.business_id == business_id,
            Lead.created_at >= duplicate_cutoff,
        )
        duplicate_result = await self.db.execute(duplicate_query)
        recent_leads = list(duplicate_result.scalars().all())

        if phone:
            phone_matches = [candidate for candidate in recent_leads if normalize_phone(candidate.phone) == phone]
            if phone_matches:
                return self._unique_by_id(phone_matches)

        if email:
            email_matches = [candidate for candidate in recent_leads if self._normalize_email(candidate.email) == email]
            if email_matches:
                return self._unique_by_id(email_matches)

        normalized_name = self._normalize_name(name)
        if normalized_name and event_date:
            event_matches = [
                candidate
                for candidate in recent_leads
                if self._normalize_name(candidate.name) == normalized_name
                and (candidate.event_date == event_date or candidate.event_date is None)
            ]
            if event_matches:
                return self._unique_by_id(event_matches)

        if normalized_name and not phone and not email:
            name_only_matches = [
                candidate
                for candidate in recent_leads
                if self._normalize_name(candidate.name) == normalized_name
                and not normalize_phone(candidate.phone)
                and not self._normalize_email(candidate.email)
            ]
            if name_only_matches:
                return self._unique_by_id(name_only_matches)
        return []

    def _pick_master_lead(self, leads: list[Lead]) -> Lead:
        return sorted(leads, key=lambda lead: lead.created_at)[0]

    async def _merge_duplicate_group(
        self,
        master: Lead,
        duplicates: list[Lead],
        *,
        allowed_additional_info_labels: set[str],
    ) -> bool:
        changed = False
        for duplicate in duplicates:
            changed = self._apply_mapped_values_to_lead(
                master,
                name=duplicate.name,
                phone=normalize_phone(duplicate.phone),
                email=self._normalize_email(duplicate.email),
                city=duplicate.city,
                event_date=duplicate.event_date,
                event_type=duplicate.event_type,
                notes=duplicate.notes,
                contract_value=duplicate.contract_value,
                assigned_to=duplicate.assigned_to,
                custom_fields=duplicate.custom_fields or {},
                allowed_additional_info_labels=allowed_additional_info_labels,
            ) or changed
            await self.db.delete(duplicate)
            changed = True
        return changed

    def _apply_mapped_values_to_lead(
        self,
        lead: Lead,
        *,
        name: str | None,
        phone: str | None,
        email: str | None,
        city: str | None,
        event_date: date | None,
        event_type: str | None,
        notes: str | None,
        contract_value,
        assigned_to: uuid.UUID | None,
        custom_fields: dict,
        allowed_additional_info_labels: set[str],
    ) -> bool:
        changed = False
        if name and not lead.name:
            lead.name = name
            changed = True
        if phone and lead.phone != phone:
            lead.phone = phone
            changed = True
        if email and lead.email != email:
            lead.email = email
            changed = True
        if city and not lead.city:
            lead.city = city
            changed = True
        if event_date and lead.event_date != event_date:
            lead.event_date = event_date
            changed = True
        if event_type and not lead.event_type:
            lead.event_type = event_type
            changed = True
        if notes and not lead.notes:
            lead.notes = notes
            changed = True
        if contract_value is not None and lead.contract_value is None:
            lead.contract_value = contract_value
            changed = True
        if assigned_to and lead.assigned_to is None:
            lead.assigned_to = assigned_to
            changed = True

        merged_custom_fields = clean_additional_info_fields(
            dict(lead.custom_fields or {}),
            allowed_labels=allowed_additional_info_labels,
        )
        for key, value in custom_fields.items():
            cleaned_key = str(key).strip()
            if not cleaned_key:
                continue
            if cleaned_key not in merged_custom_fields or not merged_custom_fields[cleaned_key]:
                merged_custom_fields[cleaned_key] = value
        if merged_custom_fields != (lead.custom_fields or {}):
            lead.custom_fields = merged_custom_fields
            changed = True
        return changed

    def _unique_by_id(self, leads: list[Lead]) -> list[Lead]:
        seen: set[uuid.UUID] = set()
        unique_leads: list[Lead] = []
        for lead in leads:
            if lead.id in seen:
                continue
            seen.add(lead.id)
            unique_leads.append(lead)
        return unique_leads

    def _normalize_email(self, value: object) -> str | None:
        if value is None:
            return None
        text = str(value).strip().lower()
        return text or None

    def _normalize_name(self, value: object) -> str | None:
        if value is None:
            return None
        text = str(value).strip().casefold()
        return text or None

    def _lead_event_payload(
        self,
        lead: Lead,
        *,
        source: str,
        changed_fields: list[str],
        extra: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "source": source,
            "changed_fields": changed_fields,
            "lead": {
                "id": str(lead.id),
                "uid": lead.uid,
                "name": lead.name,
                "phone": lead.phone,
                "email": lead.email,
                "city": lead.city,
                "event_date": lead.event_date.isoformat() if isinstance(lead.event_date, date) else None,
                "event_type": lead.event_type,
                "status": lead.status,
                "assigned_to": str(lead.assigned_to) if lead.assigned_to else None,
                "contract_value": decimal_to_string(lead.contract_value),
            },
        }
        if extra:
            payload.update(extra)
        return payload
