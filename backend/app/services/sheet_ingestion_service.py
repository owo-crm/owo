import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.business import Business
from app.models.lead import Lead
from app.services.event_service import DomainEvent, EventService, decimal_to_string
from app.services.sheet_service import SheetService
from app.utils.additional_info import clean_additional_info_fields, mapped_additional_info_labels
from app.utils.phone import normalize_phone


class SheetIngestionService:
    def __init__(self, db: AsyncSession, sheet_service: SheetService) -> None:
        self.db = db
        self.sheet_service = sheet_service

    async def ingest_row(self, business_id: uuid.UUID, row_data: dict, *, triggered_by_user_id: uuid.UUID | None = None) -> dict:
        business = await self.db.get(Business, business_id)
        if business is None:
            return {"created": False, "reason": "business_not_found"}

        return await self._ingest_row_for_business(business, row_data, triggered_by_user_id=triggered_by_user_id)

    async def sync_sheet(self, business_id: uuid.UUID, *, triggered_by_user_id: uuid.UUID | None = None) -> dict:
        business = await self.db.get(Business, business_id)
        if business is None:
            return {
                "created_count": 0,
                "skipped_count": 0,
                "skipped_reasons": {"business_not_found": 1},
                "rows_processed": 0,
                "message": "Business not found.",
            }
        if not business.sheet_id or not business.sheet_verified:
            return {
                "created_count": 0,
                "skipped_count": 0,
                "skipped_reasons": {"sheet_not_connected": 1},
                "rows_processed": 0,
                "message": "Connect and verify the Google Sheet first.",
            }

        sheet_title, selected_tab_name, rows = await self.sheet_service.get_row_records(
            business.sheet_id,
            business.sheet_tab_name,
        )

        created_count = 0
        updated_count = 0
        skipped_count = 0
        skipped_reasons: dict[str, int] = {}
        for row in rows:
            result = await self._ingest_row_for_business(business, row, triggered_by_user_id=triggered_by_user_id)
            if result.get("created"):
                created_count += 1
            elif result.get("updated"):
                updated_count += 1
            else:
                skipped_count += 1
                reason = str(result.get("reason", "unknown"))
                skipped_reasons[reason] = skipped_reasons.get(reason, 0) + 1

        summary = {
            "sheet_title": sheet_title,
            "selected_tab_name": selected_tab_name,
            "rows_processed": len(rows),
            "created_count": created_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "skipped_reasons": skipped_reasons,
            "message": "Sheet sync completed successfully.",
        }
        await EventService(self.db).emit(
            DomainEvent(
                business_id=business.id,
                event_type="sheet_sync_completed",
                entity_type="sheet_sync",
                entity_id=business.id,
                triggered_by_user_id=triggered_by_user_id,
                payload=summary,
            )
        )
        await self.db.commit()
        return summary

    async def _ingest_row_for_business(
        self,
        business: Business,
        row_data: dict,
        *,
        triggered_by_user_id: uuid.UUID | None = None,
    ) -> dict:
        mapping = business.sheet_column_mapping or self.sheet_service.suggest_mapping_from_headers(list(row_data.keys()))
        allowed_additional_info_labels = mapped_additional_info_labels(mapping)
        normalized_row = {str(key).strip(): value for key, value in row_data.items()}
        mapped_values, custom_fields = self._split_row(
            normalized_row,
            mapping,
            allowed_additional_info_labels,
        )

        name = self._string_or_none(mapped_values.get("name"))
        phone = normalize_phone(mapped_values.get("phone"))
        email = self._normalize_email(mapped_values.get("email"))
        event_date = self._parse_date(mapped_values.get("event_date"))

        if not name and not phone and not email:
            return {"created": False, "reason": "missing_identity"}

        matched_leads = await self._find_matching_leads(
            business.id,
            phone=phone,
            email=email,
            name=name,
            event_date=event_date,
        )
        if matched_leads:
            master_lead = self._pick_master_lead(matched_leads)
            duplicate_leads = [lead for lead in matched_leads if lead.id != master_lead.id]
            merged_duplicates = await self._merge_duplicate_group(
                master_lead,
                duplicate_leads,
                allowed_additional_info_labels,
            )
            was_updated = self._apply_mapped_values_to_lead(
                master_lead,
                name=name,
                phone=phone,
                email=email,
                city=self._string_or_none(mapped_values.get("city")),
                event_date=event_date,
                event_type=self._string_or_none(mapped_values.get("event_type")),
                notes=self._string_or_none(mapped_values.get("notes")),
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
                            changed_fields=["sheet_sync_update"],
                            source="sheet_sync",
                            extra={"merged_duplicates": merged_duplicates},
                        ),
                    )
                )
                await self.db.commit()
                await self.db.refresh(master_lead)
                return {
                    "created": False,
                    "updated": True,
                    "reason": "updated_existing",
                    "uid": master_lead.uid,
                }
            return {"created": False, "reason": "duplicate_skipped", "uid": master_lead.uid}

        lead = Lead(
            uid=await self._generate_uid(),
            business_id=business.id,
            name=name,
            phone=phone,
            email=email,
            city=self._string_or_none(mapped_values.get("city")),
            event_date=event_date,
            event_type=self._string_or_none(mapped_values.get("event_type")),
            notes=self._string_or_none(mapped_values.get("notes")),
            source="facebook",
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
                payload=self._lead_event_payload(lead, changed_fields=["sheet_sync_create"], source="sheet_sync"),
            )
        )
        await self.db.commit()
        await self.db.refresh(lead)
        return {"created": True, "uid": lead.uid}

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
            normalized_email = email.lower()
            email_matches = [
                candidate
                for candidate in recent_leads
                if self._normalize_email(candidate.email) == normalized_email
            ]
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
        allowed_additional_info_labels: set[str],
    ) -> bool:
        changed = False
        for duplicate in duplicates:
            changed = self._apply_mapped_values_to_lead(
                master,
                name=self._string_or_none(duplicate.name),
                phone=normalize_phone(duplicate.phone),
                email=self._normalize_email(duplicate.email),
                city=self._string_or_none(duplicate.city),
                event_date=duplicate.event_date,
                event_type=self._string_or_none(duplicate.event_type),
                notes=self._string_or_none(duplicate.notes),
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
        custom_fields: dict[str, object],
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

    def _split_row(
        self,
        row_data: dict[str, object],
        mapping: dict[str, str],
        allowed_additional_info_labels: set[str],
    ) -> tuple[dict[str, object], dict[str, object]]:
        reverse_mapping = {column_name: field_name for field_name, column_name in mapping.items()}
        mapped_values: dict[str, object] = {}
        custom_fields: dict[str, object] = {}

        for header, value in row_data.items():
            target_field = reverse_mapping.get(header)
            if target_field:
                if target_field.startswith("additional_info:"):
                    custom_fields[target_field.removeprefix("additional_info:").strip()] = value
                else:
                    mapped_values[target_field] = value

        return mapped_values, clean_additional_info_fields(
            custom_fields,
            allowed_labels=allowed_additional_info_labels,
        )

    async def _generate_uid(self) -> str:
        while True:
            candidate = uuid.uuid4().hex[:8]
            existing = await self.db.execute(select(Lead).where(Lead.uid == candidate))
            if existing.scalar_one_or_none() is None:
                return candidate

    def _string_or_none(self, value: object) -> str | None:
        if value is None:
            return None
        text = str(value).strip()
        return text or None

    def _normalize_email(self, value: object) -> str | None:
        text = self._string_or_none(value)
        return text.lower() if text else None

    def _normalize_name(self, value: object) -> str | None:
        text = self._string_or_none(value)
        return text.casefold() if text else None

    def _unique_by_id(self, leads: list[Lead]) -> list[Lead]:
        seen: set[uuid.UUID] = set()
        unique_leads: list[Lead] = []
        for lead in leads:
            if lead.id in seen:
                continue
            seen.add(lead.id)
            unique_leads.append(lead)
        return unique_leads

    def _parse_date(self, value: object) -> date | None:
        if value is None:
            return None
        text = str(value).strip()
        if not text:
            return None

        for pattern in ("%Y-%m-%d", "%d.%m.%Y", "%d/%m/%Y"):
            try:
                return datetime.strptime(text, pattern).date()
            except ValueError:
                continue
        return None

    def _lead_event_payload(
        self,
        lead: Lead,
        *,
        changed_fields: list[str],
        source: str,
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
                "status": lead.status,
                "assigned_to": str(lead.assigned_to) if lead.assigned_to else None,
                "contract_value": decimal_to_string(lead.contract_value),
            },
        }
        if extra:
            payload.update(extra)
        return payload
