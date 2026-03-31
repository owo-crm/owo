from typing import Any

from pydantic import BaseModel, Field


class AutomationSettingsOut(BaseModel):
    automations_enabled: bool = False
    assign_new_leads_to_owner: bool = False
    create_task_on_new_lead: bool = False
    create_task_for_follow_up_stages: bool = True
    follow_up_task_title: str = "Follow up with {lead_name}"
    follow_up_task_deadline_hours: int = 24


class AutomationSettingsUpdate(BaseModel):
    automations_enabled: bool | None = None
    assign_new_leads_to_owner: bool | None = None
    create_task_on_new_lead: bool | None = None
    create_task_for_follow_up_stages: bool | None = None
    follow_up_task_title: str | None = None
    follow_up_task_deadline_hours: int | None = None


def default_automation_settings() -> dict[str, Any]:
    return AutomationSettingsOut().model_dump(mode="python")


def normalize_automation_settings(value: dict[str, Any] | None) -> AutomationSettingsOut:
    base = default_automation_settings()
    if value:
        base.update(value)
    return AutomationSettingsOut.model_validate(base)
