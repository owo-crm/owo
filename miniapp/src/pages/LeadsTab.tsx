import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getBusinessMembers, getLeadStatuses } from "../api/businesses";
import { createLead, getLeads, updateLead } from "../api/leads";
import { createTask, getTasks } from "../api/tasks";
import { LeadCard } from "../components/LeadCard";
import { SelectField } from "../components/SelectField";
import { Spinner } from "../components/Spinner";
import { canAssignLeads, canManageAllTasks, canManageOwnTasks } from "../lib/permissions";
import { taskQueryKeys } from "../lib/taskQueryKeys";
import { useAuthStore } from "../store/auth";

type LeadsTabProps = {
  businessId: string;
  businessName: string;
  currentRole: string;
  currentPermissions: string[];
  onOpenLead: (uid: string) => void;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LeadsTab({ businessId, businessName, currentRole, currentPermissions, onOpenLead }: LeadsTabProps) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusScope, setStatusScope] = useState("active");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortDir, setSortDir] = useState("desc");
  const [assigningLeadUid, setAssigningLeadUid] = useState<string | null>(null);
  const [actionLeadUid, setActionLeadUid] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"assign" | "task" | null>(null);
  const [actionOwnerId, setActionOwnerId] = useState("");
  const [actionTaskTitle, setActionTaskTitle] = useState("");
  const [actionTaskDeadline, setActionTaskDeadline] = useState("");
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isRunningAction, setIsRunningAction] = useState(false);
  const [isCreateLeadModalOpen, setIsCreateLeadModalOpen] = useState(false);
  const [createLeadStatus, setCreateLeadStatus] = useState<string | null>(null);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [listStatus, setListStatus] = useState<string | null>(null);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadEventType, setNewLeadEventType] = useState("");
  const [newLeadEventDate, setNewLeadEventDate] = useState("");
  const [newLeadStatus, setNewLeadStatus] = useState("");
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["leads", businessId, statusFilter, statusScope, assignedFilter, search, sortDir],
    queryFn: () => getLeads(businessId, token, statusFilter, statusScope, assignedFilter, search, "received_at", sortDir),
    enabled: Boolean(businessId && token),
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    refetchInterval: 15000,
  });

  const membersQuery = useQuery({
    queryKey: ["business-members", businessId],
    queryFn: async () => (await getBusinessMembers(businessId, token)).items,
    enabled: Boolean(businessId && token),
  });

  const tasksQuery = useQuery({
    queryKey: taskQueryKeys.hints(businessId),
    queryFn: () => getTasks(businessId, token),
    enabled: Boolean(businessId && token),
  });

  const leadStatusesQuery = useQuery({
    queryKey: ["lead-statuses", businessId],
    queryFn: async () => (await getLeadStatuses(businessId, token)).items,
    enabled: Boolean(businessId && token),
  });

  const leads = leadsQuery.data?.items ?? [];
  const statusMap = new Map((leadStatusesQuery.data ?? []).map((item) => [item.name, item]));
  const activeStatusNames = new Set((leadStatusesQuery.data ?? []).filter((item) => !item.hide_from_active).map((item) => item.name));
  const wonStatusNames = new Set((leadStatusesQuery.data ?? []).filter((item) => item.is_won).map((item) => item.name));
  const activeLeads = leads.filter((lead) => activeStatusNames.has(lead.status));
  const wonDeals = leads.filter((lead) => wonStatusNames.has(lead.status)).length;
  const activeLeadCount = statusScope === "active" ? leadsQuery.data?.total ?? 0 : activeLeads.length;
  const memberMap = new Map((membersQuery.data ?? []).map((member) => [member.user_id, member.display_name]));
  const canManageLeadAssignment = canAssignLeads(currentRole, currentPermissions);
  const canManageLeadTasks = canManageAllTasks(currentRole, currentPermissions) || canManageOwnTasks(currentRole, currentPermissions);

  const openTaskCountByLead = new Map<string, number>();
  for (const task of tasksQuery.data?.items ?? []) {
    if (task.done_at || !task.lead_id) {
      continue;
    }
    openTaskCountByLead.set(task.lead_id, (openTaskCountByLead.get(task.lead_id) ?? 0) + 1);
  }

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...((membersQuery.data ?? []).map((member) => ({
      value: member.user_id,
      label: `${member.display_name} - ${member.role}`,
    })) ?? []),
  ];
  const taskOwnerOptions = canManageAllTasks(currentRole, currentPermissions)
    ? assigneeOptions
    : [
        { value: "", label: "Assign later" },
        ...assigneeOptions.filter((option) => option.value === currentUser?.id),
      ];
  const createStatusOptions = ((leadStatusesQuery.data ?? []).map((item) => ({
    value: item.name,
    label: item.name.replace(/_/g, " "),
  })) ?? []);
  const scopeChipOptions = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "follow_up", label: "Follow-up" },
  ];
  const assignmentChipOptions = [
    { value: "all", label: "All leads" },
    { value: "assigned", label: "Assigned" },
    { value: "unassigned", label: "Unassigned" },
  ];
  const statusChipOptions = useMemo(
    () => [
      { value: "all", label: "All", color: "" },
      ...((leadStatusesQuery.data ?? []).map((item) => ({
        value: item.name,
        label: item.name.replace(/_/g, " "),
        color: item.color,
      })) ?? []),
    ],
    [leadStatusesQuery.data],
  );

  useEffect(() => {
    if (!isCreateLeadModalOpen || newLeadStatus) {
      return;
    }
    const defaultStatus =
      (leadStatusesQuery.data ?? []).find((item) => item.is_default)?.name ??
      (leadStatusesQuery.data ?? []).find((item) => !item.hide_from_active)?.name ??
      leadStatusesQuery.data?.[0]?.name ??
      "new";
    setNewLeadStatus(defaultStatus);
  }, [isCreateLeadModalOpen, leadStatusesQuery.data, newLeadStatus]);

  function resetCreateLeadForm() {
    setNewLeadName("");
    setNewLeadPhone("");
    setNewLeadEmail("");
    setNewLeadEventType("");
    setNewLeadEventDate("");
    setNewLeadStatus("");
    setCreateLeadStatus(null);
    setIsCreatingLead(false);
  }

  async function handleAssign(leadUid: string, userId: string) {
    try {
      setAssigningLeadUid(leadUid);
      await updateLead(businessId, leadUid, { assigned_to: userId || null }, token);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["leads", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["lead", businessId, leadUid] }),
      ]);
    } finally {
      setAssigningLeadUid(null);
    }
  }

  function openAssignOwnerAction(leadUid: string, currentOwnerId?: string | null) {
    setActionLeadUid(leadUid);
    setActionType("assign");
    setActionOwnerId(currentOwnerId ?? "");
    setActionTaskTitle("");
    setActionTaskDeadline("");
    setActionStatus(null);
  }

  function openNextTaskAction(leadUid: string, leadName?: string | null) {
    setActionLeadUid(leadUid);
    setActionType("task");
    setActionOwnerId(canManageAllTasks(currentRole, currentPermissions) ? "" : currentUser?.id ?? "");
    setActionTaskTitle(leadName?.trim() ? `Follow up ${leadName.trim()}` : "Follow up lead");
    setActionTaskDeadline("");
    setActionStatus(null);
  }

  function closeActionModal() {
    setActionLeadUid(null);
    setActionType(null);
    setActionOwnerId("");
    setActionTaskTitle("");
    setActionTaskDeadline("");
    setActionStatus(null);
    setIsRunningAction(false);
  }

  async function handleRunLeadAction() {
    const lead = leads.find((item) => item.uid === actionLeadUid);
    if (!lead || !actionType) {
      return;
    }

    try {
      setIsRunningAction(true);
      if (actionType === "assign") {
        if (!actionOwnerId) {
          setActionStatus("Choose an owner first.");
          return;
        }
        await handleAssign(lead.uid, actionOwnerId);
        closeActionModal();
        return;
      }

      const title = actionTaskTitle.trim();
      if (!title) {
        setActionStatus("Enter a task title first.");
        return;
      }

      await createTask(
        {
          business_id: businessId,
          lead_id: lead.id,
          title,
          deadline: actionTaskDeadline ? new Date(actionTaskDeadline).toISOString() : null,
          assigned_to: actionOwnerId || null,
        },
        token,
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskQueryKeys.root(businessId) }),
        queryClient.invalidateQueries({ queryKey: ["leads", businessId] }),
      ]);
      closeActionModal();
    } catch {
      setActionStatus(actionType === "assign" ? "Could not assign the owner." : "Could not create the next task.");
    } finally {
      setIsRunningAction(false);
    }
  }

  async function handleCreateLead() {
    if (!newLeadName.trim() && !newLeadPhone.trim() && !newLeadEmail.trim()) {
      setCreateLeadStatus("Add at least a name, phone, or email.");
      return;
    }

    try {
      setIsCreatingLead(true);
      const lead = await createLead(
        {
          business_id: businessId,
          name: newLeadName.trim() || null,
          phone: newLeadPhone.trim() || null,
          email: newLeadEmail.trim() || null,
          event_type: newLeadEventType.trim() || null,
          event_date: newLeadEventDate || null,
          status: newLeadStatus || null,
          source: "manual",
        },
        token,
      );
      await queryClient.invalidateQueries({ queryKey: ["leads", businessId] });
      setListStatus(lead.merged_existing ? lead.merge_message ?? "Merged with an existing lead." : "Lead created.");
      resetCreateLeadForm();
      setIsCreateLeadModalOpen(false);
      onOpenLead(lead.uid);
    } catch {
      setCreateLeadStatus("Could not create this lead.");
    } finally {
      setIsCreatingLead(false);
    }
  }

  return (
    <section className="page">
      <div className="lead-screen__header">
        <div>
          <span className="section-heading__eyebrow">{businessName}</span>
          <h2>Leads</h2>
          <p className="lead-screen__subcopy">
            {activeLeadCount} active · {wonDeals} won this month
          </p>
        </div>
      </div>

      <label className="lead-search" aria-label="Search leads">
        <span className="lead-search__icon">
          <SearchIcon />
        </span>
        <input
          className="lead-search__input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, phone, email..."
        />
        {search ? (
          <button type="button" className="lead-search__clear" onClick={() => setSearch("")} aria-label="Clear search">
            ×
          </button>
        ) : null}
      </label>

      <div className="lead-chip-row">
        {scopeChipOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`lead-chip${statusScope === option.value ? " lead-chip--active" : ""}`}
            onClick={() => setStatusScope(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="lead-chip-row lead-chip-row--scroll">
        {statusChipOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`lead-chip${statusFilter === option.value ? " lead-chip--active" : ""}`}
            style={option.color ? ({ "--chip-color": option.color } as CSSProperties) : undefined}
            onClick={() => setStatusFilter(option.value)}
          >
            {option.color ? <span className="lead-chip__dot" style={{ backgroundColor: option.color }} /> : null}
            {option.label}
          </button>
        ))}
      </div>

      <div className="lead-chip-row">
        {assignmentChipOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`lead-chip lead-chip--secondary${assignedFilter === option.value ? " lead-chip--active" : ""}`}
            onClick={() => setAssignedFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          className="lead-chip lead-chip--secondary"
          onClick={() => setSortDir((current) => (current === "desc" ? "asc" : "desc"))}
        >
          {sortDir === "desc" ? "Newest first" : "Oldest first"}
        </button>
        <button type="button" className="lead-chip lead-chip--secondary" onClick={() => void leadsQuery.refetch()}>
          Refresh
        </button>
      </div>

      <div className="stack-list stack-list--tight">
        {listStatus ? (
          <article className="panel panel--subtle">
            <p className="settings-status">{listStatus}</p>
          </article>
        ) : null}
        {leadsQuery.isLoading ? (
          <article className="panel panel--subtle">
            <Spinner label="Loading live leads..." />
          </article>
        ) : null}

        {leadsQuery.isFetching && !leadsQuery.isLoading ? (
          <article className="panel panel--subtle">
            <Spinner label="Refreshing live leads..." />
          </article>
        ) : null}

        {leadsQuery.isError ? (
          <article className="panel">
            <h3>Could not load leads</h3>
            <p>Check backend auth, business access, and sheet ingestion.</p>
          </article>
        ) : null}

        {!leadsQuery.isLoading && !leadsQuery.isError && leads.length === 0 ? (
          <article className="panel">
            <h3>No matching leads</h3>
            <p>Try a different search or filter, or create a new lead manually.</p>
          </article>
        ) : null}

        {leads.map((lead) => {
          const statusConfig = statusMap.get(lead.status);
          const statusTone = statusConfig?.is_won ? "won" : statusConfig?.requires_follow_up ? "warm" : "new";
          const statusLabel = (statusConfig?.name ?? lead.status).replace(/_/g, " ");
          const openLeadTaskCount = openTaskCountByLead.get(lead.id) ?? 0;
          const workflowHintData = !lead.assigned_to
            ? { message: "Needs owner", tone: "warning" as const }
            : statusConfig?.requires_follow_up && openLeadTaskCount === 0
              ? { message: "Needs next task", tone: "warning" as const }
              : statusConfig?.is_lost && !String(lead.notes ?? "").trim()
                ? { message: "Add loss reason", tone: "warning" as const }
                : statusConfig?.is_won
                  ? { message: "Won deal recorded", tone: "ok" as const }
                  : openLeadTaskCount > 0
                    ? { message: `${openLeadTaskCount} open task${openLeadTaskCount === 1 ? "" : "s"}`, tone: "soft" as const }
                    : { message: "All key info is in place", tone: "ok" as const };
          const nextAction = !lead.assigned_to && canManageLeadAssignment
            ? {
                label: "Assign owner",
                onClick: () => openAssignOwnerAction(lead.uid, lead.assigned_to),
              }
            : statusConfig?.requires_follow_up && openLeadTaskCount === 0 && canManageLeadTasks
              ? {
                  label: "Add next task",
                  onClick: () => openNextTaskAction(lead.uid, lead.name),
                }
              : statusConfig?.is_won
                ? {
                    label: "Open deal",
                    onClick: () => onOpenLead(lead.uid),
                  }
                : statusConfig?.is_lost && !String(lead.notes ?? "").trim()
                  ? {
                      label: "Add reason",
                      onClick: () => onOpenLead(lead.uid),
                    }
                  : undefined;

          return (
            <LeadCard
              key={lead.id}
              lead={lead}
              onOpen={onOpenLead}
              ownerLabel={lead.assigned_to ? memberMap.get(lead.assigned_to) ?? "Assigned" : "Unassigned"}
              openTaskCount={openLeadTaskCount}
              statusTone={statusTone}
              statusLabel={statusLabel}
              statusColor={statusConfig?.color}
              workflowHint={workflowHintData.message}
              workflowHintTone={workflowHintData.tone}
              nextActionLabel={nextAction?.label}
              onNextAction={nextAction?.onClick}
            />
          );
        })}
      </div>

      {actionLeadUid && actionType ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>{actionType === "assign" ? "Assign owner" : "Create next task"}</h3>
                <p>
                  {actionType === "assign"
                    ? "Give this lead a clear owner without opening the full card."
                    : "Add the next task without leaving the list."}
                </p>
              </div>
              <button type="button" className="ghost-button" onClick={closeActionModal}>
                Close
              </button>
            </div>

            {actionType === "assign" ? (
              <SelectField
                label="Owner"
                value={actionOwnerId}
                onChange={setActionOwnerId}
                options={assigneeOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search teammates..."
              />
            ) : (
              <div className="stack-list stack-list--tight">
                <label className="input-field">
                  <span className="select-field__label">Task title</span>
                  <input
                    className="input-field__control"
                    value={actionTaskTitle}
                    onChange={(event) => setActionTaskTitle(event.target.value)}
                    placeholder="Follow up, call back, send offer..."
                  />
                </label>
                <label className="input-field">
                  <span className="select-field__label">Deadline</span>
                  <input
                    type="datetime-local"
                    className="input-field__control"
                    value={actionTaskDeadline}
                    onChange={(event) => setActionTaskDeadline(event.target.value)}
                  />
                </label>
                <SelectField
                  label="Owner"
                  value={actionOwnerId}
                  onChange={setActionOwnerId}
                  options={taskOwnerOptions}
                  presentation="sheet"
                  searchable
                  searchPlaceholder="Search teammates..."
                />
              </div>
            )}

            {actionStatus ? <p className="settings-status">{actionStatus}</p> : null}

            <div className="toggle-group">
              <button
                type="button"
                className="primary-button"
                onClick={() => void handleRunLeadAction()}
                disabled={isRunningAction || assigningLeadUid === actionLeadUid}
              >
                {isRunningAction || assigningLeadUid === actionLeadUid
                  ? "Saving..."
                  : actionType === "assign"
                    ? "Save owner"
                    : "Create task"}
              </button>
              <button type="button" className="ghost-button" onClick={closeActionModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateLeadModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>Create lead</h3>
                <p>Add a manual lead without leaving the mobile workflow.</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetCreateLeadForm();
                  setIsCreateLeadModalOpen(false);
                }}
              >
                Close
              </button>
            </div>

            <div className="stack-list stack-list--tight">
              <label className="input-field">
                <span className="select-field__label">Client name</span>
                <input
                  className="input-field__control"
                  value={newLeadName}
                  onChange={(event) => setNewLeadName(event.target.value)}
                  placeholder="Anna Kowalska"
                />
              </label>
              <label className="input-field">
                <span className="select-field__label">Phone</span>
                <input
                  className="input-field__control"
                  value={newLeadPhone}
                  onChange={(event) => setNewLeadPhone(event.target.value)}
                  placeholder="+48 123 456 789"
                />
              </label>
              <label className="input-field">
                <span className="select-field__label">Email</span>
                <input
                  type="email"
                  className="input-field__control"
                  value={newLeadEmail}
                  onChange={(event) => setNewLeadEmail(event.target.value)}
                  placeholder="anna@example.com"
                />
              </label>
              <label className="input-field">
                <span className="select-field__label">Type</span>
                <input
                  className="input-field__control"
                  value={newLeadEventType}
                  onChange={(event) => setNewLeadEventType(event.target.value)}
                  placeholder="Wedding, shoot, service..."
                />
              </label>
              <label className="input-field">
                <span className="select-field__label">Date</span>
                <input
                  type="date"
                  className="input-field__control"
                  value={newLeadEventDate}
                  onChange={(event) => setNewLeadEventDate(event.target.value)}
                />
              </label>
              <SelectField
                label="Stage"
                value={newLeadStatus}
                onChange={setNewLeadStatus}
                options={createStatusOptions}
                presentation="sheet"
              />
            </div>

            {createLeadStatus ? <p className="settings-status">{createLeadStatus}</p> : null}

            <div className="toggle-group">
              <button type="button" className="primary-button" onClick={() => void handleCreateLead()} disabled={isCreatingLead}>
                {isCreatingLead ? "Creating..." : "Create lead"}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  resetCreateLeadForm();
                  setIsCreateLeadModalOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="fab-button fab-button--label"
        aria-label="Add lead"
        onClick={() => {
          setCreateLeadStatus(null);
          setIsCreateLeadModalOpen(true);
        }}
      >
        + New
      </button>
    </section>
  );
}
