"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  History,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client-session";
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/ui/kanban";
import Loader4 from "@/components/ui/loader-4";
import type { LeadDetailDto, LeadDto, TeamMemberDto } from "@/lib/types/domain";
import { EntityDrawer } from "./EntityDrawer";

type LeadsResponse = { ok: boolean; leads: LeadDto[] };
type LeadDetailResponse = { ok: boolean; detail: LeadDetailDto };
type CreateLeadResponse = { ok: boolean; action: "created" | "merged"; lead: LeadDto };
type PatchLeadResponse = { ok: boolean; lead: LeadDto };
type TeamResponse = { ok: boolean; members: TeamMemberDto[] };

type LeadDraft = {
  full_name: string;
  phone: string;
  email: string;
  note: string;
  owner_id: string;
  status_id: string;
};

type TaskDraft = {
  title: string;
  note: string;
  due_at: string;
};

type LeadViewMode = "cards" | "table" | "kanban";
type KanbanColumnsState = Record<string, LeadDto[]>;

const emptyLeadDraft: LeadDraft = { full_name: "", phone: "", email: "", note: "", owner_id: "", status_id: "" };
const emptyTaskDraft: TaskDraft = { title: "", note: "", due_at: "" };
const NO_STATUS_COLUMN = "__NO_STATUS__";
const LEADS_VIEW_MODE_KEY = "owocrm-leads-view-mode";
const LEADS_KANBAN_COLUMN_ORDER_KEY = "owocrm-leads-kanban-column-order";
const STATUS_FALLBACK_COLORS: Record<string, string> = {
  new: "#3b82f6",
  contacted: "#06b6d4",
  follow_up: "#f59e0b",
  qualified: "#8b5cf6",
  won: "#16a34a",
  lost: "#ef4444",
  archived: "#64748b",
};

const prettySource = (source: LeadDto["source"]) => source.replaceAll("_", " ");
const fmtDate = (v: string | null) => (v ? new Date(v).toLocaleDateString() : "Not set");
const fmtDateTime = (v: string | null) => (v ? new Date(v).toLocaleString() : "Not set");
const normalizeStatusKey = (value: string | null | undefined) => (value ?? "").trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace("#", "");
  const isShort = normalized.length === 3;
  const safe = isShort
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized;
  const int = Number.parseInt(safe, 16);
  if (!Number.isFinite(int)) return `rgba(100, 116, 139, ${alpha})`;
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const getStatusColor = (status: LeadDto["status"] | null | undefined) => {
  if (status?.color_hex?.trim()) return status.color_hex;
  const key = normalizeStatusKey(status?.key);
  return STATUS_FALLBACK_COLORS[key] ?? "#64748b";
};
const getStatusTone = (status: LeadDto["status"] | null | undefined) => {
  const color = getStatusColor(status);
  return {
    dotColor: color,
    chipStyle: {
      color,
      borderColor: hexToRgba(color, 0.35),
      backgroundColor: hexToRgba(color, 0.12),
    } as const,
    columnStyle: {
      borderTopColor: color,
      boxShadow: `inset 0 1px 0 ${hexToRgba(color, 0.28)}`,
    } as const,
  };
};
const normalizePercent = (value: number | null | undefined) => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
};

function getProgressVisual(value: number | null | undefined): {
  percent: number;
  tone: "danger" | "warn" | "ready" | "done";
  barClass: string;
} {
  const percent = normalizePercent(value);
  if (percent <= 20) {
    return {
      percent,
      tone: "danger",
      barClass: "bg-gradient-to-r from-rose-500 to-pink-500",
    };
  }
  if (percent <= 60) {
    return {
      percent,
      tone: "warn",
      barClass: "bg-gradient-to-r from-amber-400 to-yellow-500",
    };
  }
  if (percent <= 99) {
    return {
      percent,
      tone: "ready",
      barClass: "bg-gradient-to-r from-lime-400 to-green-500",
    };
  }
  return {
    percent,
    tone: "done",
    barClass: "bg-gradient-to-r from-green-500 to-emerald-500",
  };
}
const initials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

function getActivityAccent(type: string) {
  if (type.includes("note")) {
    return {
      bgClass: "bg-violet-500/15",
      iconClass: "text-violet-600 dark:text-violet-300",
      Icon: MessageSquare,
    };
  }
  if (type.includes("archived")) {
    return {
      bgClass: "bg-amber-500/15",
      iconClass: "text-amber-600 dark:text-amber-300",
      Icon: History,
    };
  }
  return {
    bgClass: "bg-[#2D5CFE]/15",
    iconClass: "text-[#2D5CFE]",
    Icon: UserRound,
  };
}

function areKanbanColumnsEqual(a: KanbanColumnsState, b: KanbanColumnsState) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i += 1) {
    if (aKeys[i] !== bKeys[i]) return false;
    const aItems = a[aKeys[i]] ?? [];
    const bItems = b[bKeys[i]] ?? [];
    if (aItems.length !== bItems.length) return false;
    for (let j = 0; j < aItems.length; j += 1) {
      if (aItems[j]?.uid !== bItems[j]?.uid) return false;
    }
  }
  return true;
}

type KanbanLeadCardProps = {
  lead: LeadDto;
  isTouchDevice: boolean;
  dragDisabled: boolean;
  isMenuOpen: boolean;
  kanbanColumns: Array<{ id: string; label: string }>;
  statusById: Map<string, NonNullable<LeadDto["status"]>>;
  onOpenLead: (uid: string) => void;
  onToggleMenu: (uid: string) => void;
  onChangeStatus: (leadUid: string, targetStatusId: string | null) => void;
};

function KanbanLeadCard({
  lead,
  isTouchDevice,
  dragDisabled,
  isMenuOpen,
  kanbanColumns,
  statusById,
  onOpenLead,
  onToggleMenu,
  onChangeStatus,
}: KanbanLeadCardProps) {
  const progressVisual = getProgressVisual(lead.progress.percent);
  const leadTone = getStatusTone(lead.status);

  return (
    <KanbanItem
      value={`lead:${lead.uid}`}
      disabled={isTouchDevice || dragDisabled}
      className="rounded-xl border border-[var(--app-border)] bg-[var(--app-muted-surface)] transition hover:border-[#2D5CFE]/50 hover:bg-[var(--app-surface)]"
    >
      <article
        onClick={() => onOpenLead(lead.uid)}
        className="cursor-pointer p-3"
        role="button"
        tabIndex={0}
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-[var(--app-text)]">{lead.full_name}</p>
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: leadTone.dotColor }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: leadTone.dotColor }} />
              {lead.status?.label ?? "No status"}
            </span>
            {!isTouchDevice ? (
              <KanbanItemHandle asChild>
                <button
                  type="button"
                  aria-label="Drag lead"
                  className={`rounded p-0.5 text-[var(--app-muted)] hover:bg-[var(--app-surface)] ${
                    dragDisabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"
                  }`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <GripVertical size={14} />
                </button>
              </KanbanItemHandle>
            ) : null}
          </div>
        </div>
        <p className="truncate text-xs text-[var(--app-muted)]">
          {[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact"}
        </p>
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--app-muted)]">
            <span>{progressVisual.percent}%</span>
            <span>
              {lead.progress.completed}/{lead.progress.total}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--app-border)]">
            <div className={`h-full rounded-full ${progressVisual.barClass}`} style={{ width: `${progressVisual.percent}%` }} />
          </div>
        </div>
        {isTouchDevice ? (
          <div className="mt-2 flex justify-end">
            <div className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleMenu(lead.uid);
                }}
                className="rounded-md border border-[var(--app-border)] px-2 py-1 text-[11px] text-[var(--app-muted)] hover:text-[var(--app-text)]"
              >
                Change status
              </button>
              {isMenuOpen ? (
                <div
                  className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-lg"
                  onClick={(event) => event.stopPropagation()}
                >
                  {kanbanColumns.map((targetColumn) => {
                    const targetStatusId = targetColumn.id === NO_STATUS_COLUMN ? null : targetColumn.id;
                    return (
                      <button
                        key={`${lead.uid}-${targetColumn.id}`}
                        type="button"
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-[var(--app-text)] hover:bg-[var(--app-muted-surface)]"
                        onClick={() => onChangeStatus(lead.uid, targetStatusId)}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: getStatusTone(targetStatusId ? statusById.get(targetStatusId) ?? null : null).dotColor }}
                        />
                        {targetColumn.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </article>
    </KanbanItem>
  );
}

export function LeadsPage() {
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<LeadViewMode>("cards");
  const deferredSearch = useDeferredValue(searchTerm);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newLead, setNewLead] = useState<LeadDraft>(emptyLeadDraft);

  const [selectedLeadUid, setSelectedLeadUid] = useState<string | null>(null);
  const [selectedLeadDetail, setSelectedLeadDetail] = useState<LeadDetailDto | null>(null);
  const [leadDetailsLoading, setLeadDetailsLoading] = useState(false);
  const [leadDetailsError, setLeadDetailsError] = useState<string | null>(null);
  const [patching, setPatching] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState<LeadDraft>(emptyLeadDraft);
  const [drawerMode, setDrawerMode] = useState<"overview" | "edit">("overview");
  const [showAllTasksInProgress, setShowAllTasksInProgress] = useState(false);
  const [showAllTaskActivities, setShowAllTaskActivities] = useState(false);
  const [showCreateTaskForm, setShowCreateTaskForm] = useState(false);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyTaskDraft);
  const [taskCreating, setTaskCreating] = useState(false);

  const [noteDraft, setNoteDraft] = useState("");
  const [noteCreating, setNoteCreating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteDeletingId, setNoteDeletingId] = useState<string | null>(null);
  const [kanbanColumnsState, setKanbanColumnsState] = useState<KanbanColumnsState>({});
  const [activeKanbanDrag, setActiveKanbanDrag] = useState<{ id: string; variant: "item" | "column" } | null>(null);
  const [mobileStatusMenuOpenLeadUid, setMobileStatusMenuOpenLeadUid] = useState<string | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [kanbanColumnOrder, setKanbanColumnOrder] = useState<string[]>([]);

  const statuses = useMemo(() => {
    const map = new Map<string, NonNullable<LeadDto["status"]>>();
    for (const lead of leads) if (lead.status?.id) map.set(lead.status.id, lead.status);
    return Array.from(map.values());
  }, [leads]);
  const statusById = useMemo(() => new Map(statuses.map((status) => [status.id, status])), [statuses]);
  const statusLabels = useMemo(() => ["All", ...statuses.map((item) => item.label)], [statuses]);
  const filteredLeads = useMemo(() => leads.filter((lead) => statusFilter === "All" || lead.status?.label === statusFilter), [leads, statusFilter]);
  const kanbanColumns = useMemo(
    () => [...statuses, { id: NO_STATUS_COLUMN, label: "No status" }],
    [statuses],
  );
  const orderedKanbanColumns = useMemo(() => {
    if (!kanbanColumnOrder.length) return kanbanColumns;
    const byId = new Map(kanbanColumns.map((column) => [column.id, column]));
    const ordered = kanbanColumnOrder.map((id) => byId.get(id)).filter(Boolean) as typeof kanbanColumns;
    const missing = kanbanColumns.filter((column) => !kanbanColumnOrder.includes(column.id));
    return [...ordered, ...missing];
  }, [kanbanColumns, kanbanColumnOrder]);
  const leadByUid = useMemo(() => new Map(leads.map((lead) => [lead.uid, lead])), [leads]);
  const derivedKanbanColumnsState = useMemo(() => {
    const grouped: KanbanColumnsState = {};
    for (const column of orderedKanbanColumns) {
      grouped[column.id] = [];
    }
    for (const lead of filteredLeads) {
      const columnId = lead.status?.id ?? NO_STATUS_COLUMN;
      if (!grouped[columnId]) {
        grouped[columnId] = [];
      }
      grouped[columnId].push(lead);
    }
    return grouped;
  }, [filteredLeads, orderedKanbanColumns]);

  async function fetchLeads(search: string) {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (search.trim()) params.set("search", search.trim());
      const response = await apiFetch(`/api/v1/leads?${params.toString()}`);
      const json = (await response.json()) as LeadsResponse | { ok: false };
      if (!response.ok || !json.ok) throw new Error("Failed to load leads");
      setLeads(json.leads);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeam() {
    const response = await apiFetch("/api/v1/team");
    const json = (await response.json()) as TeamResponse | { ok: false };
    if (response.ok && json.ok) setTeamMembers(json.members);
  }

  async function fetchLeadDetails(uid: string) {
    setLeadDetailsLoading(true);
    setLeadDetailsError(null);
    setPatchError(null);
    try {
      const response = await apiFetch(`/api/v1/leads/${uid}/detail`);
      const json = (await response.json()) as LeadDetailResponse | { ok: false };
      if (!response.ok || !json.ok) throw new Error("Failed to load lead details");
      setSelectedLeadDetail(json.detail);
      setDetailDraft({
        full_name: json.detail.lead.full_name,
        phone: json.detail.lead.phone ?? "",
        email: json.detail.lead.email ?? "",
        note: json.detail.lead.note ?? "",
        owner_id: json.detail.lead.owner?.id ?? "",
        status_id: json.detail.lead.status?.id ?? "",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load lead details";
      setLeadDetailsError(msg);
      setPatchError(msg);
      setSelectedLeadDetail(null);
    } finally {
      setLeadDetailsLoading(false);
    }
  }

  async function refreshAndKeepSelection(search: string) {
    await fetchLeads(search);
    await fetchTeam();
    if (selectedLeadUid) await fetchLeadDetails(selectedLeadUid);
  }

  async function createLead() {
    if (!newLead.full_name.trim()) return setCreateError("Full name is required.");
    setCreating(true);
    setCreateError(null);
    try {
      const response = await apiFetch("/api/v1/leads", {
        method: "POST",
        body: JSON.stringify({
          full_name: newLead.full_name.trim(),
          phone: newLead.phone.trim() || null,
          email: newLead.email.trim() || null,
          note: newLead.note.trim() || null,
          owner_id: newLead.owner_id || null,
          status_id: newLead.status_id || null,
        }),
      });
      const json = (await response.json()) as CreateLeadResponse | { ok: false };
      if (!response.ok || !json.ok) throw new Error("Failed to create lead");
      setShowCreateModal(false);
      setNewLead(emptyLeadDraft);
      setSelectedLeadUid(json.lead.uid);
      setDrawerMode("overview");
      await refreshAndKeepSelection(deferredSearch);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create lead");
    } finally {
      setCreating(false);
    }
  }

  async function saveLeadDetails() {
    if (!selectedLeadUid) return;
    if (!detailDraft.full_name.trim()) return setPatchError("Full name is required.");
    setPatching(true);
    setPatchError(null);
    try {
      const response = await apiFetch(`/api/v1/leads/${selectedLeadUid}`, {
        method: "PATCH",
        body: JSON.stringify({
          full_name: detailDraft.full_name.trim(),
          phone: detailDraft.phone.trim() || null,
          email: detailDraft.email.trim() || null,
          owner_id: detailDraft.owner_id || null,
          status_id: detailDraft.status_id || null,
        }),
      });
      const json = (await response.json()) as PatchLeadResponse | { ok: false };
      if (!response.ok || !json.ok) throw new Error("Failed to update lead");
      setDrawerMode("overview");
      await refreshAndKeepSelection(deferredSearch);
      setSelectedLeadDetail((prev) => (prev ? { ...prev, lead: json.lead } : prev));
    } catch (e) {
      setPatchError(e instanceof Error ? e.message : "Failed to update lead");
    } finally {
      setPatching(false);
    }
  }

  async function createTaskFromLead() {
    if (!selectedLeadDetail) return;
    const title = taskDraft.title.trim();
    if (!title) {
      setPatchError("Task title is required.");
      return;
    }

    setTaskCreating(true);
    setPatchError(null);
    try {
      const response = await apiFetch("/api/v1/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          note: taskDraft.note.trim() || null,
          lead_uid: selectedLeadDetail.lead.uid,
          assignee_id: selectedLeadDetail.lead.owner?.id ?? null,
          due_at: taskDraft.due_at ? new Date(taskDraft.due_at).toISOString() : null,
        }),
      });
      const json = (await response.json()) as { ok: boolean };
      if (!response.ok || !json.ok) throw new Error("Failed to create task");
      setTaskDraft(emptyTaskDraft);
      setShowCreateTaskForm(false);
      await refreshAndKeepSelection(deferredSearch);
    } catch (e) {
      setPatchError(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setTaskCreating(false);
    }
  }

  async function markTaskDone(taskId: string) {
    try {
      const response = await apiFetch(`/api/v1/tasks/${taskId}/done`, { method: "POST" });
      const json = (await response.json()) as { ok: boolean };
      if (!response.ok || !json.ok) throw new Error("Failed to mark task done");
      await refreshAndKeepSelection(deferredSearch);
    } catch (e) {
      setPatchError(e instanceof Error ? e.message : "Failed to mark task done");
    }
  }

  async function createNote() {
    if (!selectedLeadUid) return;
    const text = noteDraft.trim();
    if (!text) return;
    setNoteCreating(true);
    try {
      const response = await apiFetch(`/api/v1/leads/${selectedLeadUid}/notes`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      const json = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "LEAD_NOTE_CREATE_FAILED");
      }
      setNoteDraft("");
      await fetchLeadDetails(selectedLeadUid);
    } catch (e) {
      const message = e instanceof Error ? e.message : "LEAD_NOTE_CREATE_FAILED";
      if (message === "LEAD_NOTES_NOT_READY") {
        setPatchError("Lead notes storage is not ready. Run `npx prisma migrate deploy` and retry.");
      } else if (message === "INVALID_AUTHOR") {
        setPatchError("Current session user is invalid for note author.");
      } else if (message === "LEAD_NOT_FOUND") {
        setPatchError("Lead not found.");
      } else if (message === "TEXT_REQUIRED") {
        setPatchError("Note text is required.");
      } else {
        setPatchError("Failed to create note.");
      }
    } finally {
      setNoteCreating(false);
    }
  }

  async function saveNote(noteId: string) {
    if (!selectedLeadUid) return;
    const text = editingNoteText.trim();
    if (!text) return;
    setNoteSaving(true);
    try {
      const response = await apiFetch(`/api/v1/leads/${selectedLeadUid}/notes/${noteId}`, {
        method: "PATCH",
        body: JSON.stringify({ text }),
      });
      const json = (await response.json()) as { ok: boolean };
      if (!response.ok || !json.ok) throw new Error("Failed to update note");
      setEditingNoteId(null);
      setEditingNoteText("");
      await fetchLeadDetails(selectedLeadUid);
    } catch (e) {
      setPatchError(e instanceof Error ? e.message : "Failed to update note");
    } finally {
      setNoteSaving(false);
    }
  }

  async function removeNote(noteId: string) {
    if (!selectedLeadUid) return;
    setNoteDeletingId(noteId);
    try {
      const response = await apiFetch(`/api/v1/leads/${selectedLeadUid}/notes/${noteId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { ok: boolean };
      if (!response.ok || !json.ok) throw new Error("Failed to delete note");
      await fetchLeadDetails(selectedLeadUid);
    } catch (e) {
      setPatchError(e instanceof Error ? e.message : "Failed to delete note");
    } finally {
      setNoteDeletingId(null);
    }
  }

  function resetUiCache() {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lowered = key.toLowerCase();
      if (lowered.includes("owo") || lowered.includes("crm") || lowered.includes("lead") || lowered.includes("task")) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) localStorage.removeItem(key);
    sessionStorage.clear();

    setSearchTerm("");
    setStatusFilter("All");
    setSelectedLeadUid(null);
    setSelectedLeadDetail(null);
    setShowAllTasksInProgress(false);
    setShowAllTaskActivities(false);
    setShowCreateTaskForm(false);
    setTaskDraft(emptyTaskDraft);
    setNoteDraft("");
    setActiveKanbanDrag(null);
    setKanbanColumnsState({});
    setViewMode("cards");
    setPatchError(null);
    localStorage.removeItem(LEADS_VIEW_MODE_KEY);
    localStorage.removeItem(LEADS_KANBAN_COLUMN_ORDER_KEY);
    void fetchLeads("");
    void fetchTeam();
  }

  function updateLeadStatusOptimistic(leadUid: string, targetStatusId: string | null) {
    const targetStatus = targetStatusId ? statusById.get(targetStatusId) ?? null : null;
    setLeads((prev) =>
      prev.map((lead) =>
        lead.uid === leadUid
          ? {
              ...lead,
              status: targetStatus,
            }
          : lead,
      ),
    );
    setSelectedLeadDetail((prev) =>
      prev && prev.lead.uid === leadUid
        ? {
            ...prev,
            lead: {
            ...prev.lead,
              status: targetStatus,
            },
          }
        : prev,
    );
    setDetailDraft((prev) => ({ ...prev, status_id: targetStatusId ?? "" }));
  }

  async function applyLeadStatusChange(leadUid: string, targetStatusId: string | null) {
    const previousLeads = leads;
    updateLeadStatusOptimistic(leadUid, targetStatusId);
    try {
      const response = await apiFetch(`/api/v1/leads/${leadUid}`, {
        method: "PATCH",
        body: JSON.stringify({ status_id: targetStatusId }),
      });
      const json = (await response.json()) as PatchLeadResponse | { ok: false };
      if (!response.ok || !json.ok) throw new Error("Failed to update lead status");
      if (selectedLeadUid === leadUid) {
        await fetchLeadDetails(leadUid);
      }
    } catch (e) {
      setLeads(previousLeads);
      const message = e instanceof Error ? e.message : "Failed to update lead status";
      setError(message);
      setPatchError(message);
    } finally {
      setActiveKanbanDrag(null);
      setMobileStatusMenuOpenLeadUid(null);
    }
  }

  useEffect(() => {
    void fetchLeads(deferredSearch);
    void fetchTeam();
  }, [deferredSearch]);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const sync = () => setIsTouchDevice(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(LEADS_VIEW_MODE_KEY);
    if (stored === "cards" || stored === "table" || stored === "kanban") {
      setViewMode(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LEADS_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    const raw = localStorage.getItem(LEADS_KANBAN_COLUMN_ORDER_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) {
        setKanbanColumnOrder(parsed);
      }
    } catch {
      // ignore malformed local storage payload
    }
  }, []);

  useEffect(() => {
    if (!kanbanColumns.length) return;
    setKanbanColumnOrder((prev) => {
      const known = new Set(kanbanColumns.map((column) => column.id));
      const kept = prev.filter((id) => known.has(id));
      const missing = kanbanColumns.map((column) => column.id).filter((id) => !kept.includes(id));
      const next = [...kept, ...missing];
      if (next.length === prev.length && next.every((value, index) => value === prev[index])) {
        return prev;
      }
      return next;
    });
  }, [kanbanColumns]);

  useEffect(() => {
    if (!kanbanColumnOrder.length) return;
    localStorage.setItem(LEADS_KANBAN_COLUMN_ORDER_KEY, JSON.stringify(kanbanColumnOrder));
  }, [kanbanColumnOrder]);

  useEffect(() => {
    setMobileStatusMenuOpenLeadUid(null);
  }, [statusFilter, deferredSearch, viewMode]);

  useEffect(() => {
    if (!selectedLeadUid) {
      setSelectedLeadDetail(null);
      setDrawerMode("overview");
      setPatchError(null);
      setLeadDetailsError(null);
      return;
    }
    void fetchLeadDetails(selectedLeadUid);
  }, [selectedLeadUid]);

  useEffect(() => {
    if (!selectedLeadUid) return;
    if (!filteredLeads.some((lead) => lead.uid === selectedLeadUid)) {
      setSelectedLeadUid(null);
      setSelectedLeadDetail(null);
      setDrawerMode("overview");
    }
  }, [filteredLeads, selectedLeadUid]);

  useEffect(() => {
    setKanbanColumnsState((prev) => (areKanbanColumnsEqual(prev, derivedKanbanColumnsState) ? prev : derivedKanbanColumnsState));
  }, [derivedKanbanColumnsState]);

  function handleKanbanValueChange(next: KanbanColumnsState) {
    setKanbanColumnsState(next);
    const nextOrder = Object.keys(next);
    setKanbanColumnOrder((prev) => {
      if (prev.length === nextOrder.length && prev.every((value, index) => value === nextOrder[index])) {
        return prev;
      }
      return nextOrder;
    });
  }

  function handleKanbanMove(move: KanbanMoveEvent) {
    const activeId = String(move.event.active.id);
    if (!activeId.startsWith("lead:")) return;
    if (move.activeContainer === move.overContainer) return;
    const leadUid = activeId.slice(5);
    const targetStatusId = move.overContainer === NO_STATUS_COLUMN ? null : move.overContainer;
    void applyLeadStatusChange(leadUid, targetStatusId);
  }

  const drawerFooter = (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]"
        onClick={() => setDrawerMode("overview")}
      >
        Cancel
      </button>
      <button
        type="button"
        className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        onClick={() => void saveLeadDetails()}
        disabled={patching || leadDetailsLoading}
      >
        {patching ? "Saving..." : "Save changes"}
      </button>
    </div>
  );

  const progressTasks = selectedLeadDetail?.tasks ?? [];
  const visibleProgressTasks = showAllTasksInProgress ? progressTasks : progressTasks.slice(0, 5);
  const latestActivities = selectedLeadDetail?.latest_activities ?? [];
  const visibleLatestActivities = showAllTaskActivities ? latestActivities : latestActivities.slice(0, 3);
  const drawerProgressVisual = getProgressVisual(selectedLeadDetail?.progress.percent ?? 0);
  const kanbanMenuColumns = useMemo(
    () =>
      Object.keys(kanbanColumnsState).map((columnId) => ({
        id: columnId,
        label: columnId === NO_STATUS_COLUMN ? "No status" : statusById.get(columnId)?.label ?? "Unknown status",
      })),
    [kanbanColumnsState, statusById],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--app-text)]">Leads</h1>
          <p className="mt-1 text-[var(--app-muted)]">Live pipeline from API.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244ee2]"
        >
          <Plus size={18} />
          New
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetUiCache}
                className="rounded-md border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-xs font-medium text-[var(--app-muted)] hover:text-[var(--app-text)]"
              >
                Reset UI cache
              </button>
              <div className="inline-flex rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-surface)] p-1">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  viewMode === "cards" ? "bg-[#2D5CFE] text-white" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                }`}
              >
                <LayoutGrid size={14} />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  viewMode === "table" ? "bg-[#2D5CFE] text-white" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                }`}
              >
                <List size={14} />
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${
                  viewMode === "kanban" ? "bg-[#2D5CFE] text-white" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                }`}
              >
                <CalendarDays size={14} />
                Kanban
              </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-[var(--app-muted)]" size={18} />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-surface)] py-2 pl-9 pr-3 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)] focus:border-[#2D5CFE]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {statusLabels.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    statusFilter === status
                      ? "border-[#2D5CFE] bg-[#2D5CFE] text-white"
                      : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-[var(--app-muted)]">Loading leads...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-500">{error}</div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-[var(--app-border)] bg-[var(--app-muted-surface)]">
                  {["Lead", "Contact", "Status", "Owner", "Source", "Progress", "Next Task"].map((header) => (
                    <th key={header} className="px-5 py-4 text-left text-sm font-semibold text-[var(--app-muted)]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="cursor-pointer border-b border-[var(--app-border)] hover:bg-[var(--app-muted-surface)]"
                    onClick={() => {
                      setDrawerMode("overview");
                      setSelectedLeadUid(lead.uid);
                    }}
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--app-text)]">{lead.full_name}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--app-muted)]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail size={13} className="text-[var(--app-muted)]" />
                          {lead.email ?? "Not set"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-[var(--app-muted)]" />
                          {lead.phone ?? "Not set"}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="rounded-full border px-3 py-1 text-xs font-semibold"
                        style={getStatusTone(lead.status).chipStyle}
                      >
                        {lead.status?.label ?? "No status"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--app-muted)]">{lead.owner?.display_name ?? "Unassigned"}</td>
                    <td className="px-5 py-4 text-sm text-[var(--app-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} className="text-[var(--app-muted)]" />
                        {prettySource(lead.source)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm">
                      <div className="w-28">
                        <div className="mb-1 flex items-center justify-between text-xs text-[var(--app-muted)]">
                          <span>{getProgressVisual(lead.progress.percent).percent}%</span>
                          <span>{lead.progress.completed}/{lead.progress.total}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--app-muted-surface)]">
                          <div
                            className={`h-full rounded-full ${getProgressVisual(lead.progress.percent).barClass}`}
                            style={{ width: `${getProgressVisual(lead.progress.percent).percent}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--app-muted)]">
                      {lead.next_task ? (
                        <>
                          <p className="font-medium text-[var(--app-text)]">{lead.next_task.title}</p>
                          <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--app-muted)]">
                            <CalendarDays size={12} />
                            {lead.next_task.due_at ? new Date(lead.next_task.due_at).toLocaleDateString() : "No due date"}
                          </p>
                        </>
                      ) : (
                        "No open task"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === "kanban" ? (
          <div className="overflow-x-auto p-4">
            <Kanban
              value={kanbanColumnsState}
              onValueChange={handleKanbanValueChange}
              getItemValue={(item) => `lead:${item.uid}`}
              onMove={handleKanbanMove}
              onActiveChange={setActiveKanbanDrag}
            >
              <KanbanBoard>
                {Object.entries(kanbanColumnsState).map(([columnId, columnLeads]) => {
                  const columnStatus = columnId === NO_STATUS_COLUMN ? null : statusById.get(columnId) ?? null;
                  const columnTone = getStatusTone(columnStatus);
                  const columnLabel = columnId === NO_STATUS_COLUMN ? "No status" : columnStatus?.label ?? "Unknown status";
                  return (
                    <KanbanColumn
                      key={columnId}
                      value={columnId}
                      disabled={isTouchDevice}
                      className="w-[312px] rounded-xl border border-t-2 border-[var(--app-border)] bg-[var(--app-surface)] p-3"
                      style={{ borderTopColor: columnTone.dotColor, boxShadow: `inset 0 1px 0 ${hexToRgba(columnTone.dotColor, 0.28)}` }}
                    >
                      <header
                        className="mb-3 flex items-center justify-between rounded-lg border px-2 py-1.5"
                        style={{
                          borderColor: hexToRgba(columnTone.dotColor, 0.28),
                          backgroundColor: hexToRgba(columnTone.dotColor, 0.12),
                        }}
                      >
                        <div className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: columnTone.dotColor }} />
                          <h3 className="text-sm font-semibold" style={{ color: columnTone.dotColor }}>{columnLabel}</h3>
                          <span className="text-sm font-semibold" style={{ color: columnTone.dotColor }}>
                            {columnLeads.length}
                          </span>
                        </div>
                        <KanbanColumnHandle asChild>
                          <button
                            type="button"
                            aria-label="Drag column"
                            disabled={isTouchDevice}
                            className={`rounded p-1 text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] ${
                              isTouchDevice ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing"
                            }`}
                          >
                            <GripVertical size={14} />
                          </button>
                        </KanbanColumnHandle>
                      </header>

                      <KanbanColumnContent value={columnId} className="min-h-12 space-y-2">
                        {columnLeads.map((lead) => (
                          <KanbanLeadCard
                            key={lead.id}
                            lead={lead}
                            isTouchDevice={isTouchDevice}
                            dragDisabled={activeKanbanDrag?.variant === "column"}
                            isMenuOpen={mobileStatusMenuOpenLeadUid === lead.uid}
                            kanbanColumns={kanbanMenuColumns}
                            statusById={statusById}
                            onOpenLead={(uid) => {
                              setDrawerMode("overview");
                              setSelectedLeadUid(uid);
                            }}
                            onToggleMenu={(uid) => setMobileStatusMenuOpenLeadUid((prev) => (prev === uid ? null : uid))}
                            onChangeStatus={(leadUid, targetStatusId) => void applyLeadStatusChange(leadUid, targetStatusId)}
                          />
                        ))}
                        {columnLeads.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-[var(--app-border)] bg-[var(--app-muted-surface)] px-3 py-6 text-center">
                            <p className="text-sm text-[var(--app-muted)]">
                              {isTouchDevice ? "No leads in this status." : "Drop lead here"}
                            </p>
                          </div>
                        ) : null}
                      </KanbanColumnContent>
                    </KanbanColumn>
                  );
                })}
              </KanbanBoard>

              <KanbanOverlay>
                {({ value, variant }) => {
                  if (variant === "item") {
                    const leadUid = String(value).startsWith("lead:") ? String(value).slice(5) : String(value);
                    const lead = leadByUid.get(leadUid);
                    if (!lead) return null;
                    return (
                      <div className="w-[312px] rounded-xl border border-[#2D5CFE]/45 bg-[var(--app-surface)] p-3 shadow-2xl" style={{ transform: "rotate(3deg)" }}>
                        <p className="truncate text-sm font-semibold text-[var(--app-text)]">{lead.full_name}</p>
                        <p className="mt-1 truncate text-xs text-[var(--app-muted)]">
                          {[lead.email, lead.phone].filter(Boolean).join(" · ") || "No contact"}
                        </p>
                      </div>
                    );
                  }

                  const columnId = String(value);
                  const columnStatus = columnId === NO_STATUS_COLUMN ? null : statusById.get(columnId) ?? null;
                  const columnTone = getStatusTone(columnStatus);
                  const columnLabel = columnId === NO_STATUS_COLUMN ? "No status" : columnStatus?.label ?? "Unknown status";
                  return (
                    <div className="w-[312px] rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-3 shadow-xl">
                      <div className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: columnTone.dotColor }} />
                        <span className="text-sm font-semibold text-[var(--app-text)]">{columnLabel}</span>
                      </div>
                    </div>
                  );
                }}
              </KanbanOverlay>
            </Kanban>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
            {filteredLeads.map((lead) => (
              <article
                key={lead.id}
                className="cursor-pointer rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 transition hover:border-[#2D5CFE]/50 hover:shadow-sm"
                onClick={() => {
                  setDrawerMode("overview");
                  setSelectedLeadUid(lead.uid);
                }}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--app-text)]">{lead.full_name}</h3>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-medium" style={{ color: getStatusTone(lead.status).dotColor }}>
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: getStatusTone(lead.status).dotColor }}
                    />
                    {lead.status?.label ?? "No status"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="inline-flex items-center gap-2 text-[var(--app-muted)]">
                    <Phone size={14} />
                    <span className="truncate">{lead.phone ?? "No phone"}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 text-[var(--app-muted)]">
                    <Mail size={14} />
                    <span className="truncate">{lead.email ?? "No email"}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 text-[var(--app-muted)]">
                    <UserRound size={14} />
                    <span className="truncate">{lead.owner?.display_name ?? "Unassigned"}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 text-[var(--app-muted)]">
                    <MapPin size={14} />
                    <span className="truncate capitalize">{prettySource(lead.source)}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--app-muted)]">
                    <p className="text-[11px]">Progress</p>
                    <div className="flex items-center gap-2">
                      <p>{getProgressVisual(lead.progress.percent).percent}%</p>
                      <p>
                        {lead.progress.completed}/{lead.progress.total}
                      </p>
                    </div>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--app-border)]">
                    <div
                      className={`h-full rounded-full ${getProgressVisual(lead.progress.percent).barClass}`}
                      style={{ width: `${getProgressVisual(lead.progress.percent).percent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-surface)] p-3">
                  <p className="text-xs text-[var(--app-muted)]">Next action</p>
                  {lead.next_task ? (
                    <>
                      <p className="mt-1 text-sm font-medium text-[var(--app-text)]">{lead.next_task.title}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--app-muted)]">
                        <CalendarDays size={12} />
                        {lead.next_task.due_at ? new Date(lead.next_task.due_at).toLocaleDateString() : "No due date"}
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-[var(--app-muted)]">No open task</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h2 className="mb-4 text-xl font-bold text-[var(--app-text)]">New Lead</h2>
            <div className="grid grid-cols-1 gap-3">
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Full name*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Jane Doe" value={newLead.full_name} onChange={(event) => setNewLead((prev) => ({ ...prev, full_name: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Phone
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="+48 600 000 000" value={newLead.phone} onChange={(event) => setNewLead((prev) => ({ ...prev, phone: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Email
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="client@company.com" value={newLead.email} onChange={(event) => setNewLead((prev) => ({ ...prev, email: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Owner (optional)
                <select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={newLead.owner_id} onChange={(event) => setNewLead((prev) => ({ ...prev, owner_id: event.target.value }))}>
                  <option value="">Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.user_id} value={member.user_id}>{member.display_name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Status (optional)
                <select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={newLead.status_id} onChange={(event) => setNewLead((prev) => ({ ...prev, status_id: event.target.value }))}>
                  <option value="">Default status</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Notes
                <textarea className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Internal notes about this lead." value={newLead.note} onChange={(event) => setNewLead((prev) => ({ ...prev, note: event.target.value }))} />
              </label>
            </div>
            {createError ? <p className="mt-3 text-sm text-red-500">{createError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void createLead()} disabled={creating}>{creating ? "Creating..." : "Create lead"}</button>
            </div>
          </div>
        </div>
      )}

      <EntityDrawer
        open={Boolean(selectedLeadUid)}
        onClose={() => setSelectedLeadUid(null)}
        title="Lead Detail"
        footer={drawerMode === "edit" ? drawerFooter : undefined}
        contentClassName="min-h-0 flex-1 overflow-auto px-0 py-0"
        customHeader={
          <header className="flex items-center justify-between border-b border-[var(--app-border)] px-5 py-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setSelectedLeadUid(null)} className="rounded-md p-1 text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]" aria-label="Close lead detail">
                <X size={20} />
              </button>
              <h2 className="text-3xl font-semibold leading-none text-[var(--app-text)]">Lead Detail</h2>
            </div>
            <button type="button" className="rounded-md bg-[#2D5CFE] px-3 py-2 text-sm font-semibold text-white hover:bg-[#244ee2]">View Lead Details</button>
          </header>
        }
      >
        {leadDetailsLoading ? (
          <div className="px-5 py-4 text-sm text-[var(--app-muted)]">Loading details...</div>
        ) : leadDetailsError ? (
          <div className="space-y-3 px-5 py-4">
            <p className="text-sm text-red-500">{leadDetailsError}</p>
            {selectedLeadUid ? (
              <button
                type="button"
                className="rounded-lg bg-[#2D5CFE] px-3 py-1.5 text-sm font-semibold text-white"
                onClick={() => void fetchLeadDetails(selectedLeadUid)}
              >
                Retry
              </button>
            ) : null}
          </div>
        ) : !selectedLeadDetail ? (
          <div className="px-5 py-4 text-sm text-[var(--app-muted)]">No lead details available.</div>
        ) : (
          <div>
            <section className="px-5 py-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#2D5CFE]/15 text-sm font-semibold text-[#2D5CFE]">{initials(selectedLeadDetail.lead.full_name)}</div>
                  <div>
                    <h3 className="text-xl font-semibold text-[var(--app-text)]">{selectedLeadDetail.lead.full_name}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-[var(--app-muted)]">
                      <Mail size={14} />
                      <span>{selectedLeadDetail.lead.email ?? "No email"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={selectedLeadDetail.lead.email ? `mailto:${selectedLeadDetail.lead.email}` : "#"} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] ${selectedLeadDetail.lead.email ? "text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]" : "pointer-events-none text-[var(--app-muted)] opacity-40"}`}><Mail size={16} /></a>
                  <a href={selectedLeadDetail.lead.phone ? `tel:${selectedLeadDetail.lead.phone}` : "#"} className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] ${selectedLeadDetail.lead.phone ? "text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]" : "pointer-events-none text-[var(--app-muted)] opacity-40"}`}><Phone size={16} /></a>
                  <button type="button" onClick={() => setShowCreateTaskForm((prev) => !prev)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]"><MessageSquare size={16} /></button>
                  <button type="button" onClick={() => setDrawerMode("edit")} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]"><Pencil size={16} /></button>
                  <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-muted-surface)] hover:text-[var(--app-text)]"><MoreHorizontal size={16} /></button>
                </div>
              </div>
            </section>

            <section className="mx-[20px] mb-[20px] mt-0 grid grid-cols-2 border border-[var(--app-border)] md:grid-cols-4">
              <div className="flex h-24 flex-col justify-center border-r border-t border-[var(--app-border)] px-4 py-3 md:border-l">
                <p className="text-xs text-[var(--app-muted)]">Lead owner</p>
                <p className="mt-1 text-base font-medium text-[var(--app-text)]">{selectedLeadDetail.lead.owner?.display_name ?? "Unassigned"}</p>
              </div>
              <div className="flex h-24 flex-col justify-center border-r border-t border-[var(--app-border)] px-4 py-3">
                <p className="text-xs text-[var(--app-muted)]">Status</p>
                <p className="mt-1 inline-flex items-center gap-2 text-base font-medium text-[var(--app-text)]">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: getStatusTone(selectedLeadDetail.lead.status).dotColor }}
                  />
                  {selectedLeadDetail.lead.status?.label ?? "No status"}
                </p>
              </div>
              <div className="flex h-24 flex-col justify-center border-r border-t border-[var(--app-border)] px-4 py-3">
                <p className="text-xs text-[var(--app-muted)]">Source</p>
                <p className="mt-1 text-base font-medium capitalize text-[var(--app-text)]">{prettySource(selectedLeadDetail.lead.source)}</p>
              </div>
              <div className="flex h-24 flex-col justify-center border-t border-[var(--app-border)] px-4 py-3 md:border-r">
                <p className="text-xs text-[var(--app-muted)]">Created</p>
                <p className="mt-1 text-base font-medium text-[var(--app-text)]">{fmtDate(selectedLeadDetail.lead.created_at)}</p>
              </div>
            </section>

            <section className="border-b border-[var(--app-border)] px-5 py-5">
              <button type="button" onClick={() => setShowAllTasksInProgress((prev) => !prev)} className="w-full rounded-lg border border-[var(--app-border)] px-4 py-4 text-left">
                <div className="mb-3 flex items-center justify-between">
                  <div className="inline-flex items-center gap-3">
                    <Loader4 cellSize="md" tone={drawerProgressVisual.tone} />
                    <h4 className="text-2xl font-semibold leading-none text-[var(--app-text)]">Progress</h4>
                  </div>
                  <div className="inline-flex items-center gap-2 text-base text-[var(--app-muted)]">
                    <span>{drawerProgressVisual.percent}% completed</span>
                    {showAllTasksInProgress ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--app-muted-surface)]">
                  <div
                    className={`h-full rounded-full ${drawerProgressVisual.barClass}`}
                    style={{ width: `${drawerProgressVisual.percent}%` }}
                  />
                </div>
              </button>
              {showAllTasksInProgress ? (
                <div className="mt-4 space-y-2">
                  {visibleProgressTasks.length === 0 ? (
                    <p className="text-sm text-[var(--app-muted)]">No tasks for this lead yet.</p>
                  ) : (
                    visibleProgressTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-lg border border-[var(--app-border)] bg-[var(--app-muted-surface)] px-3 py-2">
                        <div className="flex items-center gap-2">
                          {task.done_at ? (
                            <span className="shrink-0">
                              <CheckCircle2 size={16} className="text-green-500" />
                            </span>
                          ) : (
                            <span className="shrink-0">
                              <Loader4 cellSize="sm" tone={drawerProgressVisual.tone} />
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-medium text-[var(--app-text)]">{task.title}</p>
                            <p className="text-xs text-[var(--app-muted)]">
                              {task.assignee_name ?? "Unassigned"} · Due {fmtDate(task.due_at)}
                            </p>
                          </div>
                        </div>
                        {!task.done_at ? (
                          <button type="button" onClick={() => void markTaskDone(task.id)} className="rounded-md border border-[var(--app-border)] px-2 py-1 text-xs text-[var(--app-text)] hover:bg-[var(--app-surface)]">Done</button>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </section>

            {showCreateTaskForm ? (
              <section className="border-b border-[var(--app-border)] px-5 py-5">
                <h4 className="mb-3 text-sm font-semibold text-[var(--app-text)]">Create Task</h4>
                <div className="grid grid-cols-1 gap-2">
                  <input value={taskDraft.title} onChange={(event) => setTaskDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Task title*" className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" />
                  <textarea value={taskDraft.note} onChange={(event) => setTaskDraft((prev) => ({ ...prev, note: event.target.value }))} placeholder="Task note (optional)" className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" />
                  <input type="datetime-local" value={taskDraft.due_at} onChange={(event) => setTaskDraft((prev) => ({ ...prev, due_at: event.target.value }))} className="rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" className="rounded-lg border border-[var(--app-border)] px-3 py-1.5 text-sm text-[var(--app-text)]" onClick={() => setShowCreateTaskForm(false)}>Cancel</button>
                  <button type="button" className="rounded-lg bg-[#2D5CFE] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void createTaskFromLead()} disabled={taskCreating}>{taskCreating ? "Creating..." : "Create task"}</button>
                </div>
              </section>
            ) : null}

            {drawerMode === "edit" ? (
              <section className="border-b border-[var(--app-border)] px-5 py-5">
                <h4 className="mb-3 text-sm font-semibold text-[var(--app-text)]">Edit Lead</h4>
                <div className="grid grid-cols-1 gap-3">
                  <label className="text-xs font-medium text-[var(--app-muted)]">Full name*<input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={detailDraft.full_name} onChange={(event) => setDetailDraft((prev) => ({ ...prev, full_name: event.target.value }))} /></label>
                  <label className="text-xs font-medium text-[var(--app-muted)]">Email<input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={detailDraft.email} onChange={(event) => setDetailDraft((prev) => ({ ...prev, email: event.target.value }))} /></label>
                  <label className="text-xs font-medium text-[var(--app-muted)]">Phone<input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={detailDraft.phone} onChange={(event) => setDetailDraft((prev) => ({ ...prev, phone: event.target.value }))} /></label>
                  <label className="text-xs font-medium text-[var(--app-muted)]">Owner<select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={detailDraft.owner_id} onChange={(event) => setDetailDraft((prev) => ({ ...prev, owner_id: event.target.value }))}><option value="">Unassigned</option>{teamMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}</select></label>
                  <label className="text-xs font-medium text-[var(--app-muted)]">Status<select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={detailDraft.status_id} onChange={(event) => setDetailDraft((prev) => ({ ...prev, status_id: event.target.value }))}><option value="">No status</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</select></label>
                </div>
              </section>
            ) : null}

            <section className="border-b border-[var(--app-border)] px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xl font-semibold text-[var(--app-text)]">Latest Activities</h4>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#2D5CFE]/15 px-2 text-xs font-semibold text-[#2D5CFE]">{latestActivities.length}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAllTaskActivities((prev) => !prev)}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--app-border)] px-2 py-1 text-sm font-medium text-[var(--app-text)] hover:text-[#2D5CFE]"
                >
                  <History size={16} />
                  {showAllTaskActivities ? "Show less" : "View all activity"}
                </button>
              </div>
              {visibleLatestActivities.length === 0 ? (
                <p className="text-sm text-[var(--app-muted)]">No team activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {visibleLatestActivities.map((activity, index) => {
                    const accent = getActivityAccent(activity.type);
                    const ActivityIcon = accent.Icon;
                    return (
                    <div key={activity.id} className="relative pl-16">
                      {index < visibleLatestActivities.length - 1 ? <span className="absolute left-[24px] top-12 h-[calc(100%-8px)] w-px bg-[var(--app-border)]" /> : null}
                      <span className={`absolute left-0 top-1 flex h-12 w-12 items-center justify-center rounded-full ${accent.bgClass}`}>
                        <ActivityIcon size={18} className={accent.iconClass} />
                      </span>
                      <p className="text-base font-medium text-[var(--app-text)]">{activity.text}</p>
                      <p className="mt-1 text-sm text-[var(--app-muted)]">{activity.actor_name ?? "Team member"} · {fmtDateTime(activity.created_at)}</p>
                    </div>
                  )})}
                </div>
              )}
            </section>

            <section className="px-5 py-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#2D5CFE]" />
                  <h4 className="text-xl font-semibold text-[var(--app-text)]">Notes</h4>
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#2D5CFE]/15 px-2 text-xs font-semibold text-[#2D5CFE]">{selectedLeadDetail.notes.length}</span>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-2">
                <textarea value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} placeholder="Add a note for this lead..." className="min-h-20 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" />
                <div className="flex justify-end">
                  <button type="button" onClick={() => void createNote()} disabled={noteCreating || !noteDraft.trim()} className="rounded-lg bg-[#2D5CFE] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">{noteCreating ? "Adding..." : "Add note"}</button>
                </div>
              </div>

              {selectedLeadDetail.notes.length === 0 ? (
                <p className="text-sm text-[var(--app-muted)]">No notes yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedLeadDetail.notes.map((note) => (
                    <article key={note.id} className="rounded-xl border border-[var(--app-border)] bg-[var(--app-muted-surface)] p-3">
                      {editingNoteId === note.id ? (
                        <>
                          <textarea value={editingNoteText} onChange={(event) => setEditingNoteText(event.target.value)} className="min-h-20 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" />
                          <div className="mt-2 flex justify-end gap-2">
                            <button type="button" className="rounded-md border border-[var(--app-border)] px-3 py-1 text-xs text-[var(--app-text)]" onClick={() => { setEditingNoteId(null); setEditingNoteText(""); }}>Cancel</button>
                            <button type="button" className="rounded-md bg-[#2D5CFE] px-3 py-1 text-xs font-semibold text-white disabled:opacity-60" onClick={() => void saveNote(note.id)} disabled={noteSaving || !editingNoteText.trim()}>{noteSaving ? "Saving..." : "Save"}</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--app-muted)]">Lead note</p>
                            <p className="inline-flex items-center gap-1 text-xs text-[var(--app-muted)]"><CalendarDays size={12} />{fmtDateTime(note.created_at)}</p>
                          </div>
                          <p className="text-sm text-[var(--app-text)]">{note.text}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <p className="text-xs text-[var(--app-muted)]">{note.author_name ?? "Unknown author"}</p>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text); }} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--app-text)] hover:text-[#2D5CFE]"><Pencil size={12} />Edit</button>
                              <button type="button" onClick={() => void removeNote(note.id)} disabled={noteDeletingId === note.id} className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-60"><Trash2 size={12} />{noteDeletingId === note.id ? "Deleting..." : "Delete"}</button>
                            </div>
                          </div>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>

            {patchError ? <p className="px-5 pb-5 text-sm text-red-500">{patchError}</p> : null}
          </div>
        )}
      </EntityDrawer>
    </div>
  );
}

