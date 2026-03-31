export type AppPermission =
  | "leads.view_own"
  | "leads.edit_own"
  | "dashboard.finance.view"
  | "expenses.view"
  | "expenses.manage"
  | "leads.view_all"
  | "leads.edit_all"
  | "leads.assign"
  | "leads.delete"
  | "team.manage"
  | "tasks.view_own"
  | "tasks.manage_own"
  | "tasks.view_all"
  | "tasks.manage_all"
  | "tasks.delete"
  | "attachments.view_own"
  | "attachments.manage_own"
  | "attachments.view_all"
  | "attachments.manage_all"
  | "inventory.view"
  | "inventory.manage"
  | "billing.view"
  | "billing.manage";

export const permissionCatalog: Array<{
  key: AppPermission;
  label: string;
  description: string;
}> = [
  {
    key: "leads.view_own",
    label: "View assigned leads",
    description: "Can see only leads assigned to this teammate.",
  },
  {
    key: "leads.edit_own",
    label: "Edit assigned leads",
    description: "Can update only leads assigned to this teammate.",
  },
  {
    key: "dashboard.finance.view",
    label: "View financial dashboard",
    description: "Can open revenue, net result, and money analytics.",
  },
  {
    key: "expenses.view",
    label: "View expenses",
    description: "Can see expense history and cost blocks.",
  },
  {
    key: "expenses.manage",
    label: "Manage expenses",
    description: "Can add, edit, and delete expenses.",
  },
  {
    key: "leads.view_all",
    label: "View all leads",
    description: "Can see the full company pipeline, not only assigned leads.",
  },
  {
    key: "leads.edit_all",
    label: "Edit all leads",
    description: "Can update lead fields across the whole business.",
  },
  {
    key: "leads.assign",
    label: "Assign leads",
    description: "Can reassign leads between teammates.",
  },
  {
    key: "leads.delete",
    label: "Delete leads",
    description: "Can remove leads from the CRM.",
  },
  {
    key: "team.manage",
    label: "Manage team",
    description: "Can invite teammates and change their access.",
  },
  {
    key: "tasks.view_own",
    label: "View assigned tasks",
    description: "Can see only tasks assigned to this teammate.",
  },
  {
    key: "tasks.manage_own",
    label: "Manage assigned tasks",
    description: "Can create and update tasks for this teammate's own work.",
  },
  {
    key: "tasks.view_all",
    label: "View all tasks",
    description: "Can see the shared task pool for the business.",
  },
  {
    key: "tasks.manage_all",
    label: "Manage all tasks",
    description: "Can create and update tasks for the whole business.",
  },
  {
    key: "tasks.delete",
    label: "Delete tasks",
    description: "Can permanently remove tasks.",
  },
  {
    key: "attachments.view_own",
    label: "View attachments on assigned leads",
    description: "Can open files only on leads assigned to this teammate.",
  },
  {
    key: "attachments.manage_own",
    label: "Manage attachments on assigned leads",
    description: "Can upload and remove files only on assigned leads.",
  },
  {
    key: "attachments.view_all",
    label: "View all attachments",
    description: "Can open attachments across all visible leads.",
  },
  {
    key: "attachments.manage_all",
    label: "Manage all attachments",
    description: "Can upload and remove attachments across the business.",
  },
  {
    key: "inventory.view",
    label: "View inventory",
    description: "Can open stock items and inventory movement history.",
  },
  {
    key: "inventory.manage",
    label: "Manage inventory",
    description: "Can create items and record stock in, stock out, and adjustments.",
  },
  {
    key: "billing.view",
    label: "View billing",
    description: "Can open plan details, invoices, and usage limits.",
  },
  {
    key: "billing.manage",
    label: "Manage billing",
    description: "Can control plan changes and subscription actions.",
  },
];

export const rolePermissionPresets: Record<string, AppPermission[]> = {
  owner: permissionCatalog.map((permission) => permission.key),
  admin: [
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
  ],
  manager: [
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
  ],
  member: [
    "leads.view_own",
    "leads.edit_own",
    "tasks.view_own",
    "tasks.manage_own",
    "attachments.view_own",
    "attachments.manage_own",
    "inventory.view",
  ],
  observer: ["dashboard.finance.view", "expenses.view"],
};

const permissionAliases: Record<string, AppPermission[]> = {
  "dashboard.finance": ["dashboard.finance.view"],
  "expenses.manage": ["expenses.view", "expenses.manage"],
  "leads.manage": ["leads.view_own", "leads.edit_own", "leads.view_all", "leads.edit_all", "leads.assign", "leads.delete"],
  "tasks.manage": ["tasks.view_own", "tasks.manage_own", "tasks.view_all", "tasks.manage_all", "tasks.delete"],
  "attachments.manage": ["attachments.view_own", "attachments.manage_own", "attachments.view_all", "attachments.manage_all"],
  "inventory.manage": ["inventory.view", "inventory.manage"],
  "billing.manage": ["billing.view", "billing.manage"],
  "team.manage": ["team.manage"],
};

export function roleLabel(role: string) {
  switch (role) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "manager":
      return "Manager";
    case "member":
      return "Member";
    case "observer":
      return "Observer";
    default:
      return role;
  }
}

export function applyRolePreset(role: string) {
  return [...(rolePermissionPresets[role] ?? [])];
}

export function getEffectivePermissions(role: string, customPermissions: string[] = []) {
  const permissions = new Set<string>(rolePermissionPresets[role] ?? []);
  customPermissions.forEach((permission) => {
    permissions.add(permission);
    (permissionAliases[permission] ?? []).forEach((alias) => permissions.add(alias));
  });
  return permissions;
}

export function hasPermission(role: string, customPermissions: string[] | undefined, permission: AppPermission) {
  return getEffectivePermissions(role, customPermissions ?? []).has(permission);
}

export function canViewLeads(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "leads.view_own") || hasPermission(role, customPermissions, "leads.view_all");
}

export function canManageAllLeads(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "leads.edit_all");
}

export function canAssignLeads(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "leads.assign");
}

export function canDeleteLeads(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "leads.delete");
}

export function canViewTasks(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "tasks.view_own") || hasPermission(role, customPermissions, "tasks.view_all");
}

export function canManageAllTasks(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "tasks.manage_all");
}

export function canManageOwnTasks(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "tasks.manage_own");
}

export function canDeleteTasks(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "tasks.delete");
}

export function canViewDashboard(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "dashboard.finance.view");
}

export function canViewExpenses(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "expenses.view");
}

export function canManageExpenses(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "expenses.manage");
}

export function canManageTeam(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "team.manage");
}

export function canViewAttachments(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "attachments.view_own") || hasPermission(role, customPermissions, "attachments.view_all");
}

export function canManageAttachments(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "attachments.manage_all");
}

export function normalizeEditablePermissions(role: string, customPermissions: string[] = []) {
  const effective = getEffectivePermissions(role, customPermissions);
  return permissionCatalog
    .map((permission) => permission.key)
    .filter((permission) => effective.has(permission));
}

export function canViewBilling(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "billing.view");
}

export function canViewInventory(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "inventory.view");
}

export function canManageInventory(role: string, customPermissions: string[] = []) {
  return hasPermission(role, customPermissions, "inventory.manage");
}
