ROLE_PERMISSION_PRESETS: dict[str, set[str]] = {
    "owner": {
        "leads.view_own",
        "leads.edit_own",
        "dashboard.finance.view",
        "expenses.view",
        "expenses.manage",
        "leads.view_all",
        "leads.edit_all",
        "leads.assign",
        "leads.delete",
        "team.manage",
        "tasks.view_own",
        "tasks.manage_own",
        "tasks.view_all",
        "tasks.manage_all",
        "tasks.delete",
        "attachments.view_own",
        "attachments.manage_own",
        "attachments.view_all",
        "attachments.manage_all",
        "inventory.view",
        "inventory.manage",
        "billing.view",
        "billing.manage",
    },
    "admin": {
        "leads.view_own",
        "leads.edit_own",
        "dashboard.finance.view",
        "expenses.view",
        "expenses.manage",
        "leads.view_all",
        "leads.edit_all",
        "leads.assign",
        "leads.delete",
        "team.manage",
        "tasks.view_own",
        "tasks.manage_own",
        "tasks.view_all",
        "tasks.manage_all",
        "tasks.delete",
        "attachments.view_own",
        "attachments.manage_own",
        "attachments.view_all",
        "attachments.manage_all",
        "inventory.view",
        "inventory.manage",
    },
    "manager": {
        "leads.view_own",
        "leads.edit_own",
        "dashboard.finance.view",
        "expenses.view",
        "expenses.manage",
        "leads.view_all",
        "leads.edit_all",
        "leads.assign",
        "tasks.view_own",
        "tasks.manage_own",
        "tasks.view_all",
        "tasks.manage_all",
        "attachments.view_own",
        "attachments.manage_own",
        "attachments.view_all",
        "attachments.manage_all",
        "inventory.view",
        "inventory.manage",
    },
    "member": {
        "leads.view_own",
        "leads.edit_own",
        "tasks.view_own",
        "tasks.manage_own",
        "attachments.view_own",
        "attachments.manage_own",
        "inventory.view",
    },
    "observer": {"dashboard.finance.view", "expenses.view"},
}

PERMISSION_ALIASES: dict[str, set[str]] = {
    "dashboard.finance": {"dashboard.finance.view"},
    "expenses.manage": {"expenses.view", "expenses.manage"},
    "leads.manage": {"leads.view_all", "leads.edit_all", "leads.assign", "leads.delete", "leads.view_own", "leads.edit_own"},
    "tasks.manage": {"tasks.view_all", "tasks.manage_all", "tasks.delete", "tasks.view_own", "tasks.manage_own"},
    "attachments.manage": {"attachments.view_all", "attachments.manage_all", "attachments.view_own", "attachments.manage_own"},
    "inventory.manage": {"inventory.view", "inventory.manage"},
    "billing.manage": {"billing.view", "billing.manage"},
    "team.manage": {"team.manage"},
}


def get_effective_permissions(role: str | None, custom_permissions: list[str] | None = None) -> set[str]:
    permissions = set(ROLE_PERMISSION_PRESETS.get(role or "", set()))
    for permission in custom_permissions or []:
        permissions.add(permission)
        permissions.update(PERMISSION_ALIASES.get(permission, set()))
    return permissions


def has_permission(role: str | None, custom_permissions: list[str] | None, permission: str) -> bool:
    return permission in get_effective_permissions(role, custom_permissions)


def can_view_dashboard(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "dashboard.finance.view")


def can_view_expenses(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "expenses.view")


def can_manage_expenses(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "expenses.manage")


def can_view_all_leads(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "leads.view_all")


def can_view_own_leads(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "leads.view_own")


def can_edit_all_leads(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "leads.edit_all")


def can_edit_own_leads(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "leads.edit_own")


def can_assign_leads(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "leads.assign")


def can_delete_leads(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "leads.delete")


def can_manage_team(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "team.manage")


def can_view_all_tasks(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "tasks.view_all")


def can_view_own_tasks(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "tasks.view_own")


def can_manage_all_tasks(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "tasks.manage_all")


def can_manage_own_tasks(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "tasks.manage_own")


def can_delete_tasks(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "tasks.delete")


def can_view_all_attachments(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "attachments.view_all")


def can_view_own_attachments(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "attachments.view_own")


def can_manage_all_attachments(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "attachments.manage_all")


def can_manage_own_attachments(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "attachments.manage_own")


def can_view_billing(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "billing.view")


def can_view_inventory(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "inventory.view")


def can_manage_inventory(role: str | None, custom_permissions: list[str] | None) -> bool:
    return has_permission(role, custom_permissions, "inventory.manage")
