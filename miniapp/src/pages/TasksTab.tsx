import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getLeads } from "../api/leads";
import { createTask, deleteTask, getTasks, markTaskDone, updateTask } from "../api/tasks";
import { inviteTeamMember, getTeamMembers, removeTeamMember, updateTeamMemberRole } from "../api/team";
import { SelectField } from "../components/SelectField";
import { Spinner } from "../components/Spinner";
import {
  type AppPermission,
  applyRolePreset,
  canDeleteTasks,
  canManageAllTasks,
  canManageOwnTasks,
  canManageTeam as canManageTeamPermission,
  getEffectivePermissions,
  normalizeEditablePermissions,
  permissionCatalog,
  roleLabel,
} from "../lib/permissions";
import { taskQueryKeys } from "../lib/taskQueryKeys";
import { useAuthStore } from "../store/auth";

type TasksTabProps = {
  businessId: string;
  businessName: string;
  currentRole: string;
  currentPermissions: string[];
  onOpenLead?: (uid: string) => void;
};

type MemberEditorState = {
  userId: string;
  displayName: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  position: string;
  customPermissions: string[];
};

const roleOptions = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
  { value: "observer", label: "Observer" },
];

type AccessLevel = "none" | "own" | "all" | "full";
type TernaryLevel = "none" | "view" | "manage";
type BinaryLevel = "none" | "manage";

function roleDescription(role: string) {
  switch (role) {
    case "owner":
      return "Co-owner with billing and full business control.";
    case "admin":
      return "Operates the company with broad access, including team management.";
    case "manager":
      return "Sees the whole pipeline and finances, but does not run team access by default.";
    case "member":
      return "Works on assigned leads and daily execution without company-wide control.";
    case "observer":
      return "Read-only reporting role for dashboards and financial visibility.";
    default:
      return "Custom access profile.";
  }
}

function getHumanSummary(role: string, customPermissions: string[]) {
  const effective = getEffectivePermissions(role, customPermissions);
  const lines: string[] = [];
  if (effective.has("leads.view_all")) {
    lines.push("Sees the full lead pipeline.");
  } else if (effective.has("leads.view_own")) {
    lines.push("Sees only leads assigned to this teammate.");
  } else {
    lines.push("Does not have lead access.");
  }
  if (effective.has("tasks.view_all")) {
    lines.push("Sees the shared company task pool.");
  } else if (effective.has("tasks.view_own")) {
    lines.push("Sees only personally assigned tasks.");
  } else {
    lines.push("Does not have task access.");
  }
  lines.push(effective.has("dashboard.finance.view") ? "Can open financial dashboard data." : "Cannot access financial dashboard.");
  lines.push(effective.has("expenses.manage") ? "Can create and edit expenses." : effective.has("expenses.view") ? "Can view expenses only." : "Cannot access expenses.");
  lines.push(effective.has("team.manage") ? "Can manage team access." : "Cannot change team access.");
  lines.push(effective.has("billing.view") ? "Can open billing and plan details." : "Cannot open billing.");
  return lines;
}

function getModuleAccessOverview(role: string, customPermissions: string[]) {
  const effective = getEffectivePermissions(role, customPermissions);
  return [
    {
      label: "Leads",
      value: effective.has("leads.view_all")
        ? effective.has("leads.delete")
          ? "Full manage"
          : effective.has("leads.assign")
            ? "All leads + assignment"
            : "All leads"
        : effective.has("leads.view_own")
          ? "Assigned only"
          : "No access",
    },
    {
      label: "Tasks",
      value: effective.has("tasks.manage_all")
        ? effective.has("tasks.delete")
          ? "Full manage"
          : "All tasks"
        : effective.has("tasks.manage_own")
          ? "Assigned only"
          : "No access",
    },
    {
      label: "Files",
      value: effective.has("attachments.manage_all")
        ? "All attachments"
        : effective.has("attachments.manage_own")
          ? "Assigned leads only"
          : "No access",
    },
    {
      label: "Finance",
      value: effective.has("expenses.manage")
        ? "View + manage"
        : effective.has("dashboard.finance.view")
          ? "View only"
          : "No access",
    },
    {
      label: "Billing",
      value: effective.has("billing.manage")
        ? "Manage"
        : effective.has("billing.view")
          ? "View only"
          : "No access",
    },
  ];
}

function getCompactAccessSummary(role: string, customPermissions: string[]) {
  return getModuleAccessOverview(role, customPermissions)
    .filter((row) => row.value !== "No access")
    .slice(0, 3)
    .map((row) => `${row.label}: ${row.value}`);
}

function setLevelPermissions(current: string[], permissions: AppPermission[], nextLevelPermissions: AppPermission[]) {
  const next = current.filter((permission) => !permissions.includes(permission as AppPermission));
  next.push(...nextLevelPermissions);
  return Array.from(new Set(next));
}

function getLeadsLevel(permissions: Set<string>): AccessLevel {
  if (permissions.has("leads.delete")) return "full";
  if (permissions.has("leads.view_all") || permissions.has("leads.edit_all")) return "all";
  if (permissions.has("leads.view_own") || permissions.has("leads.edit_own")) return "own";
  return "none";
}

function getTasksLevel(permissions: Set<string>): AccessLevel {
  if (permissions.has("tasks.delete")) return "full";
  if (permissions.has("tasks.view_all") || permissions.has("tasks.manage_all")) return "all";
  if (permissions.has("tasks.view_own") || permissions.has("tasks.manage_own")) return "own";
  return "none";
}

function getFilesLevel(permissions: Set<string>): AccessLevel {
  if (permissions.has("attachments.view_all") || permissions.has("attachments.manage_all")) return "all";
  if (permissions.has("attachments.view_own") || permissions.has("attachments.manage_own")) return "own";
  return "none";
}

function getFinanceLevel(permissions: Set<string>): TernaryLevel {
  if (permissions.has("expenses.manage")) return "manage";
  if (permissions.has("dashboard.finance.view") || permissions.has("expenses.view")) return "view";
  return "none";
}

function getBillingLevel(permissions: Set<string>): TernaryLevel {
  if (permissions.has("billing.manage")) return "manage";
  if (permissions.has("billing.view")) return "view";
  return "none";
}

function getTeamLevel(permissions: Set<string>): BinaryLevel {
  return permissions.has("team.manage") ? "manage" : "none";
}

function getAccessModel(customPermissions: string[]) {
  const permissions = new Set(customPermissions);
  return {
    leads: getLeadsLevel(permissions),
    tasks: getTasksLevel(permissions),
    files: getFilesLevel(permissions),
    finance: getFinanceLevel(permissions),
    billing: getBillingLevel(permissions),
    team: getTeamLevel(permissions),
  };
}

function setLeadsLevel(current: string[], level: AccessLevel) {
  const keys: AppPermission[] = ["leads.view_own", "leads.edit_own", "leads.view_all", "leads.edit_all", "leads.assign", "leads.delete"];
  const nextByLevel: Record<AccessLevel, AppPermission[]> = {
    none: [],
    own: ["leads.view_own", "leads.edit_own"],
    all: ["leads.view_own", "leads.edit_own", "leads.view_all", "leads.edit_all"],
    full: ["leads.view_own", "leads.edit_own", "leads.view_all", "leads.edit_all", "leads.assign", "leads.delete"],
  };
  return setLevelPermissions(current, keys, nextByLevel[level]);
}

function setTasksLevel(current: string[], level: AccessLevel) {
  const keys: AppPermission[] = ["tasks.view_own", "tasks.manage_own", "tasks.view_all", "tasks.manage_all", "tasks.delete"];
  const nextByLevel: Record<AccessLevel, AppPermission[]> = {
    none: [],
    own: ["tasks.view_own", "tasks.manage_own"],
    all: ["tasks.view_own", "tasks.manage_own", "tasks.view_all", "tasks.manage_all"],
    full: ["tasks.view_own", "tasks.manage_own", "tasks.view_all", "tasks.manage_all", "tasks.delete"],
  };
  return setLevelPermissions(current, keys, nextByLevel[level]);
}

function setFilesLevel(current: string[], level: AccessLevel) {
  const keys: AppPermission[] = ["attachments.view_own", "attachments.manage_own", "attachments.view_all", "attachments.manage_all"];
  const nextByLevel: Record<AccessLevel, AppPermission[]> = {
    none: [],
    own: ["attachments.view_own", "attachments.manage_own"],
    all: ["attachments.view_own", "attachments.manage_own", "attachments.view_all", "attachments.manage_all"],
    full: ["attachments.view_own", "attachments.manage_own", "attachments.view_all", "attachments.manage_all"],
  };
  return setLevelPermissions(current, keys, nextByLevel[level]);
}

function setFinanceLevel(current: string[], level: TernaryLevel) {
  const keys: AppPermission[] = ["dashboard.finance.view", "expenses.view", "expenses.manage"];
  const nextByLevel: Record<TernaryLevel, AppPermission[]> = {
    none: [],
    view: ["dashboard.finance.view", "expenses.view"],
    manage: ["dashboard.finance.view", "expenses.view", "expenses.manage"],
  };
  return setLevelPermissions(current, keys, nextByLevel[level]);
}

function setBillingLevel(current: string[], level: TernaryLevel) {
  const keys: AppPermission[] = ["billing.view", "billing.manage"];
  const nextByLevel: Record<TernaryLevel, AppPermission[]> = {
    none: [],
    view: ["billing.view"],
    manage: ["billing.view", "billing.manage"],
  };
  return setLevelPermissions(current, keys, nextByLevel[level]);
}

function setTeamLevel(current: string[], level: BinaryLevel) {
  const keys: AppPermission[] = ["team.manage"];
  const nextByLevel: Record<BinaryLevel, AppPermission[]> = {
    none: [],
    manage: ["team.manage"],
  };
  return setLevelPermissions(current, keys, nextByLevel[level]);
}

function countOverdueTasks(tasks: Array<{ done_at?: string | null; deadline?: string | null }>) {
  const now = Date.now();
  return tasks.filter((task) => !task.done_at && task.deadline && new Date(task.deadline).getTime() < now).length;
}

function formatTaskDate(value?: string | null) {
  if (!value) {
    return "No deadline";
  }

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TasksTab({ businessId, businessName, currentRole, currentPermissions, onOpenLead }: TasksTabProps) {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const [teamStatus, setTeamStatus] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string | null>(null);
  const [taskStateFilter, setTaskStateFilter] = useState("open");
  const [taskAssigneeFilter, setTaskAssigneeFilter] = useState("");

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteTelegramId, setInviteTelegramId] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [invitePosition, setInvitePosition] = useState("");
  const [invitePermissions, setInvitePermissions] = useState<string[]>(applyRolePreset("member"));
  const [isInviting, setIsInviting] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskLeadId, setTaskLeadId] = useState("");

  const [editingMember, setEditingMember] = useState<MemberEditorState | null>(null);
  const [isSavingMember, setIsSavingMember] = useState(false);
  const [roleInfoTarget, setRoleInfoTarget] = useState<null | "invite" | "edit">(null);
  const [accessEditorTarget, setAccessEditorTarget] = useState<null | "invite" | "member">(null);

  const teamQuery = useQuery({
    queryKey: ["team", businessId],
    queryFn: () => getTeamMembers(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const tasksQuery = useQuery({
    queryKey: taskQueryKeys.list(businessId, taskStateFilter, taskAssigneeFilter),
    queryFn: () => getTasks(businessId, token, undefined, taskStateFilter, taskAssigneeFilter || undefined),
    enabled: Boolean(businessId && token),
  });

  const leadsQuery = useQuery({
    queryKey: ["leads", businessId, "task-link-options"],
    queryFn: () => getLeads(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const taskSummaryQuery = useQuery({
    queryKey: taskQueryKeys.summary(businessId),
    queryFn: () => getTasks(businessId, token, undefined, "all"),
    enabled: Boolean(businessId && token),
  });

  const assigneeOptions = [
    { value: "", label: "Anyone" },
    ...((teamQuery.data?.items ?? []).map((member) => ({
      value: member.user_id,
      label: `${member.display_name} - ${roleLabel(member.role)}`,
    })) ?? []),
  ];
  const taskOwnerOptions = canManageAllTasks(currentRole, currentPermissions)
    ? assigneeOptions
    : [
        { value: "", label: "Assign to me later" },
        ...((teamQuery.data?.items ?? [])
          .filter((member) => member.user_id === currentUser?.id)
          .map((member) => ({
            value: member.user_id,
            label: `${member.display_name} - ${roleLabel(member.role)}`,
          })) ?? []),
      ];

  const taskLeadOptions = [
    { value: "", label: "No linked lead" },
    ...((leadsQuery.data?.items ?? []).map((lead) => ({
      value: lead.id,
      label: `${lead.name?.trim() || lead.uid} (${lead.uid})`,
    })) ?? []),
  ];

  const summaryTasks = taskSummaryQuery.data?.items ?? [];
  const canManageTeam = canManageTeamPermission(currentRole, currentPermissions);
  const canManageTaskPool = canManageAllTasks(currentRole, currentPermissions) || canManageOwnTasks(currentRole, currentPermissions);
  const canDeleteTaskItems = canDeleteTasks(currentRole, currentPermissions);
  const openTaskCount = summaryTasks.filter((task) => !task.done_at).length;
  const doneTaskCount = summaryTasks.filter((task) => task.done_at).length;
  const overdueTaskCount = countOverdueTasks(summaryTasks);
  const managerCount = (teamQuery.data?.items ?? []).filter((member) => ["owner", "admin", "manager"].includes(member.role)).length;

  function resetInviteForm() {
    setInviteTelegramId("");
    setInviteRole("member");
    setInvitePosition("");
    setInvitePermissions(applyRolePreset("member"));
  }

  function resetTaskForm() {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskDeadline("");
    setTaskAssignedTo("");
    setTaskLeadId("");
    setTaskStatus(null);
  }

  function openTaskEditor(taskId?: string) {
    setTaskStatus(null);
    if (!taskId) {
      setEditingTaskId(null);
      setTaskTitle("");
      setTaskDeadline("");
      setTaskAssignedTo(canManageAllTasks(currentRole, currentPermissions) ? "" : currentUser?.id ?? "");
      setTaskLeadId("");
      setIsTaskModalOpen(true);
      return;
    }

    const task = (tasksQuery.data?.items ?? []).find((item) => item.id === taskId);
    if (!task) {
      setTaskStatus("Could not open this task.");
      return;
    }
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "");
    setTaskAssignedTo(task.assigned_to ?? "");
    setTaskLeadId(task.lead_id ?? "");
    setIsTaskModalOpen(true);
  }

  function handleInviteRoleChange(nextRole: string) {
    setInviteRole(nextRole);
    setInvitePermissions(applyRolePreset(nextRole));
  }

  function openMemberEditor(userId: string) {
    const member = (teamQuery.data?.items ?? []).find((item) => item.user_id === userId);
    if (!member) {
      return;
    }
    setEditingMember({
      userId: member.user_id,
      displayName: member.display_name,
      username: member.username,
      firstName: member.first_name,
      lastName: member.last_name,
      role: member.role,
      position: member.position ?? "",
      customPermissions: normalizeEditablePermissions(member.role, member.custom_permissions ?? []),
    });
  }

  function handleEditorRoleChange(nextRole: string) {
    setEditingMember((current) =>
      current
        ? {
            ...current,
            role: nextRole,
            customPermissions: applyRolePreset(nextRole),
          }
        : current,
    );
  }

  async function handleInvite() {
    const telegramId = Number(inviteTelegramId.trim());
    if (!telegramId) {
      setTeamStatus("Enter a valid Telegram ID first.");
      return;
    }

    try {
      setIsInviting(true);
      const response = await inviteTeamMember(
        businessId,
        telegramId,
        inviteRole,
        invitePosition,
        invitePermissions,
        token,
      );
      setTeamStatus(response.message);
      resetInviteForm();
      setIsInviteModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["team", businessId] });
    } catch {
      setTeamStatus("Could not add teammate. They need to launch the bot first.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleMemberSave() {
    if (!editingMember) {
      return;
    }
    try {
      setIsSavingMember(true);
      const response = await updateTeamMemberRole(
        businessId,
        editingMember.userId,
        editingMember.role,
        editingMember.position,
        editingMember.customPermissions,
        token,
      );
      setTeamStatus(response.message);
      setEditingMember(null);
      await queryClient.invalidateQueries({ queryKey: ["team", businessId] });
    } catch {
      setTeamStatus("Could not update the team member.");
    } finally {
      setIsSavingMember(false);
    }
  }

  async function handleRemove(userId: string) {
    try {
      const response = await removeTeamMember(businessId, userId, token);
      setTeamStatus(response.message);
      setEditingMember(null);
      await queryClient.invalidateQueries({ queryKey: ["team", businessId] });
    } catch {
      setTeamStatus("Could not remove this team member.");
    }
  }

  async function handleSaveTask() {
    const title = taskTitle.trim();
    if (!title) {
      setTaskStatus("Enter a task title first.");
      return;
    }

    try {
      const task = editingTaskId
        ? await updateTask(
            editingTaskId,
            businessId,
            {
              lead_id: taskLeadId || null,
              title,
              deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
              assigned_to: taskAssignedTo || null,
            },
            token,
          )
        : await createTask(
            {
              business_id: businessId,
              lead_id: taskLeadId || null,
              title,
              deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
              assigned_to: taskAssignedTo || null,
            },
            token,
          );
      resetTaskForm();
      setTaskStatus(`${editingTaskId ? "Task updated" : "Task created"}: ${task.title}`);
      setIsTaskModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.root(businessId) });
      await tasksQuery.refetch();
    } catch {
      setTaskStatus(`Could not ${editingTaskId ? "update" : "create"} the task. Check backend access and required fields.`);
    }
  }

  async function handleMarkDone(taskId: string) {
    try {
      await markTaskDone(taskId, businessId, token);
      setTaskStatus("Task marked as done.");
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.root(businessId) });
      await tasksQuery.refetch();
    } catch {
      setTaskStatus("Could not update the task status.");
    }
  }

  async function handleDeleteTask(taskId: string, title: string) {
    try {
      await deleteTask(taskId, businessId, token);
      setTaskStatus(`Task deleted: ${title}`);
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.root(businessId) });
      await tasksQuery.refetch();
    } catch {
      setTaskStatus("Could not delete the task.");
    }
  }

  async function handleTakeTask(taskId: string, title: string) {
    if (!currentUser?.id) {
      return;
    }
    try {
      await updateTask(
        taskId,
        businessId,
        { assigned_to: currentUser.id },
        token,
      );
      setTaskStatus(`Task claimed: ${title}`);
      await queryClient.invalidateQueries({ queryKey: taskQueryKeys.root(businessId) });
      await tasksQuery.refetch();
    } catch {
      setTaskStatus("Could not take this task.");
    }
  }

  return (
    <section className="page">
      <div className="lead-screen__header">
        <div>
          <span className="section-heading__eyebrow">{businessName}</span>
          <h2>Tasks & team</h2>
          <p className="lead-screen__subcopy">{openTaskCount} open, {doneTaskCount} done, {overdueTaskCount} overdue.</p>
        </div>
        <div className="toggle-group">
          {canManageTaskPool ? (
            <button type="button" className="primary-button lead-screen__new-button" onClick={() => openTaskEditor()}>
              + Task
            </button>
          ) : null}
          {canManageTeam ? (
            <button type="button" className="ghost-button" onClick={() => setIsInviteModalOpen(true)}>
              Team
            </button>
          ) : null}
        </div>
      </div>

      <div className="tasks-summary-grid">
        <article className="metric-card">
          <span className="metric-card__label">Open</span>
          <strong>{openTaskCount}</strong>
          <p className="metric-card__delta">Tasks that still need action.</p>
        </article>
        <article className="metric-card">
          <span className="metric-card__label">Done</span>
          <strong>{doneTaskCount}</strong>
          <p className="metric-card__delta">Completed work in the current pool.</p>
        </article>
        <article className="metric-card">
          <span className="metric-card__label">Team</span>
          <strong>{teamQuery.data?.items.length ?? 0}</strong>
          <p className="metric-card__delta">{managerCount} leadership role{managerCount === 1 ? "" : "s"}.</p>
        </article>
      </div>

      <div className="content-stack">
        <article className="panel">
          <div className="section-heading section-heading--compact">
            <div>
              <h3>Tasks</h3>
              <p>Open work, due dates, and linked deals in one clean list.</p>
            </div>
            {canManageTaskPool ? (
              <button type="button" className="ghost-button" onClick={() => openTaskEditor()}>
                Add task
              </button>
            ) : null}
          </div>
          <div className="filter-row">
            <SelectField
              label="Task state"
              value={taskStateFilter}
              onChange={setTaskStateFilter}
              options={[
                { value: "open", label: "Open" },
                { value: "done", label: "Done" },
                { value: "overdue", label: "Overdue" },
                { value: "all", label: "All tasks" },
              ]}
            />
            <SelectField
              label="Assigned to"
              value={taskAssigneeFilter}
              onChange={setTaskAssigneeFilter}
              options={assigneeOptions}
              searchable
              searchPlaceholder="Search teammates..."
            />
          </div>
          {taskStatus ? <p className="settings-status">{taskStatus}</p> : null}
          <div className="stack-list stack-list--tight">
            {tasksQuery.isLoading ? <Spinner label="Loading tasks..." /> : null}
            {!tasksQuery.isLoading && (tasksQuery.data?.items ?? []).length === 0 ? (
              <article className="panel panel--subtle">
                <h3>No tasks yet</h3>
                <p>Add the first task to start running the daily workflow.</p>
              </article>
            ) : null}
            {(tasksQuery.data?.items ?? []).map((task) => (
              <article key={task.id} className="panel panel--subtle task-card">
                <div className="task-card__topline">
                  <div>
                    <strong>{task.title}</strong>
                    <p>{formatTaskDate(task.deadline)}</p>
                  </div>
                  <div className="task-card__badges">
                    {task.done_at ? (
                      <span className="chip chip--active">Done</span>
                    ) : task.deadline && new Date(task.deadline).getTime() < Date.now() ? (
                      <span className="task-tag task-tag--urgent">Overdue</span>
                    ) : (
                      <span className="task-tag">Open</span>
                    )}
                  </div>
                </div>
                <div className="task-card__meta">
                  <span className="task-card__meta-item">
                    {task.assigned_to
                      ? (teamQuery.data?.items ?? []).find((member) => member.user_id === task.assigned_to)?.display_name ?? "Assigned"
                      : "Unassigned"}
                  </span>
                  <span className="task-card__meta-item">
                    {task.lead_id ? task.lead_name || task.lead_uid || "Linked lead" : "No linked lead"}
                  </span>
                </div>
                <div className="lead-list-card__actions">
                  {task.lead_uid && onOpenLead ? (
                    <button type="button" className="chip" onClick={() => onOpenLead(task.lead_uid ?? "")}>
                      Open lead
                    </button>
                  ) : null}
                  {!task.done_at && !task.assigned_to && canManageOwnTasks(currentRole, currentPermissions) ? (
                    <button type="button" className="chip" onClick={() => void handleTakeTask(task.id, task.title)}>
                      Take task
                    </button>
                  ) : null}
                  {!task.done_at && (canManageAllTasks(currentRole, currentPermissions) || task.assigned_to === currentUser?.id) ? (
                    <button type="button" className="chip" onClick={() => void handleMarkDone(task.id)}>
                      Mark done
                    </button>
                  ) : null}
                  {canManageAllTasks(currentRole, currentPermissions) || task.assigned_to === currentUser?.id ? (
                    <button type="button" className="chip" onClick={() => openTaskEditor(task.id)}>
                      Edit
                    </button>
                  ) : null}
                  {canDeleteTaskItems ? (
                    <button type="button" className="ghost-button" onClick={() => void handleDeleteTask(task.id, task.title)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading section-heading--compact">
            <div>
              <h3>Team</h3>
              <p>
                {teamQuery.data?.items.length ?? 0} members, {managerCount} leadership role
                {managerCount === 1 ? "" : "s"}
              </p>
            </div>
            {canManageTeam ? (
              <button type="button" className="ghost-button" onClick={() => setIsInviteModalOpen(true)}>
                Add teammate
              </button>
            ) : null}
          </div>
          {teamStatus ? <p className="settings-status">{teamStatus}</p> : null}
          <div className="stack-list stack-list--tight">
            {teamQuery.isLoading ? <Spinner label="Loading team..." /> : null}
            {!teamQuery.isLoading && (teamQuery.data?.items ?? []).length === 0 ? (
              <article className="panel panel--subtle">
                <h3>No teammates yet</h3>
                <p>Add the first teammate when you are ready to share the workflow.</p>
              </article>
            ) : null}
            {(teamQuery.data?.items ?? []).map((member) => (
              <article key={member.user_id} className="panel panel--subtle team-card">
                <div className="team-card__topline">
                  <div className="team-card__identity">
                    <div className="avatar">{member.display_name.slice(0, 1)}</div>
                    <div>
                      <strong>{member.display_name}</strong>
                      <p>
                        {roleLabel(member.role)}
                        {member.position ? ` ? ${member.position}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="toggle-group">
                    {member.role === "owner" ? <span className="chip chip--active">Owner</span> : null}
                    {canManageTeam ? (
                      <button type="button" className="chip" onClick={() => openMemberEditor(member.user_id)}>
                        Open profile
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="muted">
                  {getCompactAccessSummary(member.role, member.custom_permissions).join(" ? ") || "Uses the default access profile for this role."}
                </p>
              </article>
            ))}
          </div>
        </article>
      </div>

      {isTaskModalOpen && canManageTaskPool ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="section-heading section-heading--compact">
              <div>
                <h3>{editingTaskId ? "Edit task" : "Add task"}</h3>
                <p>{editingTaskId ? "Update the task without leaving the workflow view." : "Create a task without cluttering the main team screen."}</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetTaskForm();
                  setIsTaskModalOpen(false);
                }}
              >
                Close
              </button>
            </div>
            <div className="stack-list stack-list--tight">
              <label className="input-field">
                <span className="select-field__label">Task</span>
                <input
                  className="input-field__control"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Follow up, send offer, prepare contract..."
                />
              </label>
              <label className="input-field">
                <span className="select-field__label">Deadline</span>
                <input
                  type="datetime-local"
                  className="input-field__control"
                  value={taskDeadline}
                  onChange={(event) => setTaskDeadline(event.target.value)}
                />
              </label>
              <SelectField
                label="Linked lead"
                value={taskLeadId}
                onChange={setTaskLeadId}
                options={taskLeadOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search lead by name..."
              />
              <SelectField
                label="Owner"
                value={taskAssignedTo}
                onChange={setTaskAssignedTo}
                options={taskOwnerOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search teammates..."
              />
              <div className="toggle-group">
                <button type="button" className="primary-button" onClick={() => void handleSaveTask()}>
                  {editingTaskId ? "Save changes" : "Save task"}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    resetTaskForm();
                    setIsTaskModalOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isInviteModalOpen && canManageTeam ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="section-heading section-heading--compact">
              <div>
                <h3>Add teammate</h3>
                <p>Invite by Telegram ID and choose the access profile in one short flow.</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetInviteForm();
                  setIsInviteModalOpen(false);
                }}
              >
                Close
              </button>
            </div>
            <div className="stack-list stack-list--tight">
              <label className="input-field">
                <span className="select-field__label">Telegram ID</span>
                <input
                  className="input-field__control"
                  value={inviteTelegramId}
                  onChange={(event) => setInviteTelegramId(event.target.value)}
                  placeholder="123456789"
                />
              </label>
              <div className="inline-action-row">
                <div className="inline-action-row__copy">
                  <span className="select-field__label">Role</span>
                </div>
                <button type="button" className="icon-button icon-button--small" onClick={() => setRoleInfoTarget(roleInfoTarget === "invite" ? null : "invite")}>
                  i
                </button>
              </div>
              <SelectField
                label="Role"
                value={inviteRole}
                onChange={handleInviteRoleChange}
                options={roleOptions}
                presentation="sheet"
              />
              <label className="input-field">
                <span className="select-field__label">Position</span>
                <input
                  className="input-field__control"
                  value={invitePosition}
                  onChange={(event) => setInvitePosition(event.target.value)}
                  placeholder="Seller, SMM, Coordinator..."
                />
              </label>
              <article className="panel panel--subtle">
                <div className="activity-item__topline">
                  <strong>Access overview</strong>
                  <button type="button" className="chip" onClick={() => setAccessEditorTarget("invite")}>
                    Edit access
                  </button>
                </div>
                <div className="lead-detail__meta-list">
                  {getModuleAccessOverview(inviteRole, invitePermissions).map((row) => (
                    <div key={row.label} className="lead-detail__meta-line">
                      <span className="lead-card__meta-label">{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="stack-list stack-list--tight">
                  {getHumanSummary(inviteRole, invitePermissions).slice(0, 3).map((line) => (
                    <p key={line} className="muted">{line}</p>
                  ))}
                </div>
              </article>
              <div className="toggle-group">
                <button type="button" className="primary-button" onClick={handleInvite} disabled={isInviting}>
                  {isInviting ? "Adding..." : "Add teammate"}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => {
                    resetInviteForm();
                    setIsInviteModalOpen(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingMember && canManageTeam ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="section-heading section-heading--compact">
              <div>
                <h3>Member details</h3>
                <p>{editingMember.displayName}</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setEditingMember(null)}>
                Close
              </button>
            </div>
            <div className="stack-list stack-list--tight">
              <article className="panel panel--subtle">
                <div className="lead-detail__meta-list">
                  <div className="lead-detail__meta-line">
                    <span className="lead-card__meta-label">Role</span>
                    <strong>{roleLabel(editingMember.role)}</strong>
                  </div>
                  <div className="lead-detail__meta-line">
                    <span className="lead-card__meta-label">Position</span>
                    <strong>{editingMember.position || "Not set"}</strong>
                  </div>
                  <div className="lead-detail__meta-line">
                    <span className="lead-card__meta-label">Username</span>
                    <strong>{editingMember.username ? `@${editingMember.username}` : "Not provided"}</strong>
                  </div>
                  <div className="lead-detail__meta-line">
                    <span className="lead-card__meta-label">Name</span>
                    <strong>{[editingMember.firstName, editingMember.lastName].filter(Boolean).join(" ") || "Not provided"}</strong>
                  </div>
                </div>
              </article>
              <div className="inline-action-row">
                <div className="inline-action-row__copy">
                  <span className="select-field__label">Role</span>
                </div>
                <button type="button" className="icon-button icon-button--small" onClick={() => setRoleInfoTarget(roleInfoTarget === "edit" ? null : "edit")}>
                  i
                </button>
              </div>
              <SelectField
                label="Role"
                value={editingMember.role}
                onChange={handleEditorRoleChange}
                options={roleOptions}
                presentation="sheet"
              />
              <label className="input-field">
                <span className="select-field__label">Position</span>
                <input
                  className="input-field__control"
                  value={editingMember.position}
                  onChange={(event) =>
                    setEditingMember((current) => (current ? { ...current, position: event.target.value } : current))
                  }
                  placeholder="Seller, SMM, Coordinator..."
                />
              </label>
              <article className="panel panel--subtle">
                <div className="activity-item__topline">
                  <strong>Access overview</strong>
                  <button type="button" className="chip" onClick={() => setAccessEditorTarget("member")}>
                    Edit access
                  </button>
                </div>
                <div className="lead-detail__meta-list">
                  {getModuleAccessOverview(editingMember.role, editingMember.customPermissions).map((row) => (
                    <div key={row.label} className="lead-detail__meta-line">
                      <span className="lead-card__meta-label">{row.label}</span>
                      <strong>{row.value}</strong>
                    </div>
                  ))}
                </div>
                <div className="stack-list stack-list--tight">
                  {getHumanSummary(editingMember.role, editingMember.customPermissions).slice(0, 3).map((line) => (
                    <p key={line} className="muted">{line}</p>
                  ))}
                </div>
              </article>
              <div className="toggle-group">
                <button type="button" className="primary-button" onClick={() => void handleMemberSave()} disabled={isSavingMember}>
                  {isSavingMember ? "Saving..." : "Save access"}
                </button>
                <button type="button" className="ghost-button" onClick={() => void handleRemove(editingMember.userId)}>
                  Remove teammate
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {accessEditorTarget === "invite" && canManageTeam ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="section-heading section-heading--compact">
              <div>
                <h3>Invite access</h3>
                <p>Fine-tune the access profile without stretching the teammate modal.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setAccessEditorTarget(null)}>
                Close
              </button>
            </div>
            <div className="permission-group">
              <span className="select-field__label">Access levels</span>
              <div className="permission-group__hint">Role sets the base profile. These module levels let you fine-tune how much of the company this teammate can actually see and control.</div>
              <div className="stack-list stack-list--tight">
                <SelectField
                  label="Leads"
                  value={getAccessModel(invitePermissions).leads}
                  onChange={(value) => setInvitePermissions((current) => setLeadsLevel(current, value as AccessLevel))}
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "own", label: "Assigned only" },
                    { value: "all", label: "All leads" },
                    { value: "full", label: "Full manage" },
                  ]}
                />
                <SelectField
                  label="Tasks"
                  value={getAccessModel(invitePermissions).tasks}
                  onChange={(value) => setInvitePermissions((current) => setTasksLevel(current, value as AccessLevel))}
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "own", label: "Assigned only" },
                    { value: "all", label: "All tasks" },
                    { value: "full", label: "Full manage" },
                  ]}
                />
                <SelectField
                  label="Files"
                  value={getAccessModel(invitePermissions).files}
                  onChange={(value) => setInvitePermissions((current) => setFilesLevel(current, value as AccessLevel))}
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "own", label: "Assigned only" },
                    { value: "all", label: "All files" },
                  ]}
                />
                <SelectField
                  label="Finance"
                  value={getAccessModel(invitePermissions).finance}
                  onChange={(value) => setInvitePermissions((current) => setFinanceLevel(current, value as TernaryLevel))}
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "view", label: "View only" },
                    { value: "manage", label: "Manage" },
                  ]}
                />
                <SelectField
                  label="Billing"
                  value={getAccessModel(invitePermissions).billing}
                  onChange={(value) => setInvitePermissions((current) => setBillingLevel(current, value as TernaryLevel))}
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "view", label: "View only" },
                    { value: "manage", label: "Manage" },
                  ]}
                />
                <SelectField
                  label="Team"
                  value={getAccessModel(invitePermissions).team}
                  onChange={(value) => setInvitePermissions((current) => setTeamLevel(current, value as BinaryLevel))}
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "manage", label: "Manage team" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {accessEditorTarget === "member" && editingMember && canManageTeam ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="section-heading section-heading--compact">
              <div>
                <h3>Member access</h3>
                <p>Adjust company access without overcrowding the member profile.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setAccessEditorTarget(null)}>
                Close
              </button>
            </div>
            <div className="permission-group">
              <span className="select-field__label">Access levels</span>
              <div className="permission-group__hint">Role sets the base profile. These module levels let you fine-tune how much of the company this teammate can actually see and control.</div>
              <div className="stack-list stack-list--tight">
                <SelectField
                  label="Leads"
                  value={getAccessModel(editingMember.customPermissions).leads}
                  onChange={(value) =>
                    setEditingMember((current) =>
                      current ? { ...current, customPermissions: setLeadsLevel(current.customPermissions, value as AccessLevel) } : current,
                    )
                  }
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "own", label: "Assigned only" },
                    { value: "all", label: "All leads" },
                    { value: "full", label: "Full manage" },
                  ]}
                />
                <SelectField
                  label="Tasks"
                  value={getAccessModel(editingMember.customPermissions).tasks}
                  onChange={(value) =>
                    setEditingMember((current) =>
                      current ? { ...current, customPermissions: setTasksLevel(current.customPermissions, value as AccessLevel) } : current,
                    )
                  }
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "own", label: "Assigned only" },
                    { value: "all", label: "All tasks" },
                    { value: "full", label: "Full manage" },
                  ]}
                />
                <SelectField
                  label="Files"
                  value={getAccessModel(editingMember.customPermissions).files}
                  onChange={(value) =>
                    setEditingMember((current) =>
                      current ? { ...current, customPermissions: setFilesLevel(current.customPermissions, value as AccessLevel) } : current,
                    )
                  }
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "own", label: "Assigned only" },
                    { value: "all", label: "All files" },
                  ]}
                />
                <SelectField
                  label="Finance"
                  value={getAccessModel(editingMember.customPermissions).finance}
                  onChange={(value) =>
                    setEditingMember((current) =>
                      current ? { ...current, customPermissions: setFinanceLevel(current.customPermissions, value as TernaryLevel) } : current,
                    )
                  }
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "view", label: "View only" },
                    { value: "manage", label: "Manage" },
                  ]}
                />
                <SelectField
                  label="Billing"
                  value={getAccessModel(editingMember.customPermissions).billing}
                  onChange={(value) =>
                    setEditingMember((current) =>
                      current ? { ...current, customPermissions: setBillingLevel(current.customPermissions, value as TernaryLevel) } : current,
                    )
                  }
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "view", label: "View only" },
                    { value: "manage", label: "Manage" },
                  ]}
                />
                <SelectField
                  label="Team"
                  value={getAccessModel(editingMember.customPermissions).team}
                  onChange={(value) =>
                    setEditingMember((current) =>
                      current ? { ...current, customPermissions: setTeamLevel(current.customPermissions, value as BinaryLevel) } : current,
                    )
                  }
                  presentation="sheet"
                  options={[
                    { value: "none", label: "No access" },
                    { value: "manage", label: "Manage team" },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {roleInfoTarget ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card modal-card--info">
            <div className="section-heading section-heading--compact">
              <div>
                <h3>Role guide</h3>
                <p>Quick explanation of who each role is best for and what level of business access it usually implies.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setRoleInfoTarget(null)}>
                Close
              </button>
            </div>
            <div className="role-popover">
              {roleOptions.map((role) => (
                <div key={role.value} className="role-popover__item">
                  <strong>{role.label}</strong>
                  <span>{roleDescription(role.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
