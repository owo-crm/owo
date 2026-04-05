"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineXMark } from "react-icons/hi2";
import { LeadsControls } from "@/components/product/LeadsControls";
import { useProductTab } from "@/components/product/AppShell";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/IconRegistry";
import { KpiCard } from "@/components/ui/KpiCard";
import { type SelectOption } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";

type LeadItem = {
  id: string;
  uid: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  source: string;
  ownerName: string | null;
  statusLabel: string | null;
  statusColorHex: string | null;
  nextTaskId: string | null;
  nextTaskTitle: string | null;
  nextTaskDueAt: string | null;
  lastActivityAt: string;
  createdAt: string;
};

type TaskItem = {
  id: string;
  title: string;
  leadName: string | null;
  assigneeName: string | null;
  dueAt: string | null;
  doneAt: string | null;
};

type SourceStat = {
  source: string;
  count: number;
};

type MemberItem = {
  id: string;
  displayName: string;
  email: string | null;
  role: string;
};

type StatusItem = {
  id: string;
  label: string;
  key: string;
  colorHex: string;
};

type SourceItem = {
  key: string;
  family: string;
  isActive: boolean;
};

type Props = {
  leads: LeadItem[];
  tasks: TaskItem[];
  sourceStats: SourceStat[];
  statuses: StatusItem[];
  members: MemberItem[];
  sources: SourceItem[];
  kpis: {
    leadsCount: number;
    openTasks: number;
    doneTasks: number;
    eventsCount: number;
    completionRate: number;
  };
};

type QueueStatusKey = "has_next_action" | "no_next_action" | "unassigned_owner";

const QUEUE_STATUS_META: Record<
  QueueStatusKey,
  { label: string; border: string; bg: string; text: string; accent: string }
> = {
  has_next_action: {
    label: "Action ready",
    border: "border-[#22c55e]/32",
    bg: "bg-[#eefcf3]",
    text: "text-[#1f6a42]",
    accent: "#22c55e",
  },
  no_next_action: {
    label: "No next action",
    border: "border-[#f59e0b]/35",
    bg: "bg-[#fff8e7]",
    text: "text-[#8a6110]",
    accent: "#f59e0b",
  },
  unassigned_owner: {
    label: "Owner missing",
    border: "border-[#ef4444]/35",
    bg: "bg-[#fff0f0]",
    text: "text-[#b4232e]",
    accent: "#ef4444",
  },
};

const SOURCE_CLASS_BY_KEY: Record<string, string> = {
  google_sheet: "border-[#b8cdf8] bg-[#edf3ff] text-[#2a468f]",
  website_form: "border-[#b5c6ff] bg-[#eef2ff] text-[#2b3f8e]",
  meta_form_direct: "border-[#f3c5db] bg-[#fff1f7] text-[#8f355f]",
  import_file: "border-[#f7d2aa] bg-[#fff6ed] text-[#8e5b26]",
  api: "border-[#bde8cc] bg-[#eefcf3] text-[#1f6a42]",
  manual: "border-[#f4e0ad] bg-[#fff9ea] text-[#7f6522]",
};

type ApiActionResult = { ok: true } | { ok: false; error: string };

type LeadPatchInput = {
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
};

type CreateTaskInput = {
  title: string;
  due_at?: string | null;
};

function groupTask(task: TaskItem) {
  if (task.doneAt) return "Done";
  if (!task.dueAt) return "No deadline";
  const now = Date.now();
  const due = new Date(task.dueAt).getTime();
  if (due < now) return "Overdue";
  const dayMs = 24 * 60 * 60 * 1000;
  if (due - now <= dayMs) return "Today";
  return "Upcoming";
}

function fallbackStatusColor(label: string | null) {
  const value = (label ?? "").toLowerCase();
  if (value.includes("new") || value.includes("nowy")) return "#38bdf8";
  if (value.includes("contact") || value.includes("follow") || value.includes("kontakt")) return "#f59e0b";
  if (value.includes("qualified") || value.includes("kwalif")) return "#8b5cf6";
  if (value.includes("won") || value.includes("sale") || value.includes("sprzed")) return "#22c55e";
  if (value.includes("lost") || value.includes("fail") || value.includes("drop")) return "#ef4444";
  return "#6b7ff0";
}

function resolveStatusColor(statusLabel: string | null, statusColorHex: string | null) {
  return statusColorHex ?? fallbackStatusColor(statusLabel);
}

function toSourceKey(source: string) {
  return source.toLowerCase().trim().replace(/\s+/g, "_");
}

function getSourceBadgeClass(source: string) {
  return SOURCE_CLASS_BY_KEY[toSourceKey(source)] ?? "border-slate-300 bg-slate-100 text-slate-700";
}

function getQueueStatus(lead: LeadItem): QueueStatusKey {
  if (!lead.ownerName) return "unassigned_owner";
  if (lead.nextTaskTitle) return "has_next_action";
  return "no_next_action";
}

function isActiveQueueLead(lead: LeadItem) {
  if (lead.nextTaskTitle) return true;
  const status = (lead.statusLabel ?? "").toLowerCase();
  return !["won", "sale", "sold", "closed", "lost", "archived"].some((doneState) =>
    status.includes(doneState),
  );
}

function formatRelative(input: string) {
  const value = new Date(input).getTime();
  if (Number.isNaN(value)) return "Unknown";

  const diffMs = Date.now() - value;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < hour) return `${Math.max(1, Math.round(diffMs / minute))}m ago`;
  if (diffMs < day) return `${Math.max(1, Math.round(diffMs / hour))}h ago`;
  if (diffMs < day * 7) return `${Math.max(1, Math.round(diffMs / day))}d ago`;

  return new Date(input).toLocaleDateString();
}

function contactLabel(lead: LeadItem) {
  if (lead.phone) return lead.phone;
  if (lead.email) return lead.email;
  return "No contact";
}

function taskTone(task: TaskItem): "danger" | "default" | "success" | "muted" {
  if (task.doneAt) return "success";
  if (!task.dueAt) return "muted";
  if (new Date(task.dueAt).getTime() < Date.now()) return "danger";
  return "default";
}

function prettifySource(source: string) {
  return source
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatIsoForDateTimeInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function LeadDetailPanel({
  lead,
  onClose,
  actionsEnabled,
  sessionBootstrapping,
  sessionError,
  onPatchLead,
  onCreateTask,
  onMarkTaskDone,
}: {
  lead: LeadItem;
  onClose?: () => void;
  actionsEnabled: boolean;
  sessionBootstrapping: boolean;
  sessionError: string | null;
  onPatchLead: (uid: string, patch: LeadPatchInput) => Promise<ApiActionResult>;
  onCreateTask: (leadUid: string, input: CreateTaskInput) => Promise<ApiActionResult>;
  onMarkTaskDone: (taskId: string) => Promise<ApiActionResult>;
}) {
  const statusColor = resolveStatusColor(lead.statusLabel, lead.statusColorHex);
  const [fullName, setFullName] = useState(lead.fullName);
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueAt, setTaskDueAt] = useState(formatIsoForDateTimeInput(lead.nextTaskDueAt));
  const [pending, setPending] = useState<"edit" | "createTask" | "doneTask" | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function handleLeadSave() {
    const normalizedName = fullName.trim();
    if (!normalizedName) {
      setFeedback({ tone: "error", text: "Lead name is required." });
      return;
    }

    setPending("edit");
    const result = await onPatchLead(lead.uid, {
      full_name: normalizedName,
      phone: phone.trim() || null,
      email: email.trim() || null,
    });
    setPending(null);
    if (!result.ok) {
      setFeedback({ tone: "error", text: result.error });
      return;
    }
    setFeedback({ tone: "ok", text: "Lead updated." });
  }

  async function handleCreateTask() {
    const normalizedTitle = taskTitle.trim();
    if (!normalizedTitle) {
      setFeedback({ tone: "error", text: "Task title is required." });
      return;
    }

    setPending("createTask");
    const result = await onCreateTask(lead.uid, {
      title: normalizedTitle,
      due_at: taskDueAt ? new Date(taskDueAt).toISOString() : null,
    });
    setPending(null);
    if (!result.ok) {
      setFeedback({ tone: "error", text: result.error });
      return;
    }
    setTaskTitle("");
    setFeedback({ tone: "ok", text: "Task created." });
  }

  async function handleDoneTask() {
    if (!lead.nextTaskId) {
      setFeedback({ tone: "error", text: "No open task for this lead." });
      return;
    }

    setPending("doneTask");
    const result = await onMarkTaskDone(lead.nextTaskId);
    setPending(null);
    if (!result.ok) {
      setFeedback({ tone: "error", text: result.error });
      return;
    }
    setFeedback({ tone: "ok", text: "Task marked as done." });
  }

  return (
    <div className="h-full bg-[#f8faff] pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="flex items-start justify-between gap-3 border-b border-[#d4def7] px-5 py-5">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-slate-900">{lead.fullName}</p>
          <p className="mt-1 truncate text-sm text-slate-600">{contactLabel(lead)}</p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d4def7] bg-white text-slate-600 transition hover:bg-[#edf2ff] hover:text-slate-900"
            aria-label="Close lead detail"
          >
            <HiOutlineXMark className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 px-5 py-4">
        <StatusPill
          label={lead.statusLabel ?? "Unstaged"}
          tone={lead.statusLabel ? "default" : "muted"}
          colorHex={statusColor}
        />
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${getSourceBadgeClass(lead.source)}`}>
          <Icon name="source" className="h-3.5 w-3.5" />
          {prettifySource(lead.source)}
        </span>
      </div>

      <div className="space-y-2 border-y border-[#d4def7] bg-white/85 px-5 py-4">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Owner</span>
          <span className="max-w-[60%] truncate text-slate-900">{lead.ownerName ?? "Unassigned"}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Next task</span>
          <span className="max-w-[60%] truncate text-right text-slate-900">{lead.nextTaskTitle ?? "No task"}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Last activity</span>
          <span className="text-slate-900">{formatRelative(lead.lastActivityAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-slate-500">Created</span>
          <span className="text-slate-900">{new Date(lead.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Activity summary</p>
        <p className="mt-2 text-sm text-slate-700">
          Latest touchpoint was {formatRelative(lead.lastActivityAt)}. Queue state and next step are synced with current task data.
        </p>
      </div>

      <div className="space-y-3 border-t border-[#d4def7] px-5 py-4">
        <h3 className="text-xs uppercase tracking-[0.12em] text-slate-500">Quick actions</h3>

        {sessionBootstrapping ? (
          <p className="text-xs text-slate-500">Preparing API session...</p>
        ) : null}
        {sessionError ? <p className="text-xs text-red-600">{sessionError}</p> : null}
        {feedback ? (
          <p className={feedback.tone === "ok" ? "text-xs text-emerald-700" : "text-xs text-red-600"}>
            {feedback.text}
          </p>
        ) : null}

        <div className="grid gap-2">
          <label className="text-xs text-slate-600">Lead name</label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="h-10 rounded-lg border border-[#d2dcf8] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#8ea3ff]"
            disabled={!actionsEnabled || pending !== null}
          />
          <label className="text-xs text-slate-600">Phone</label>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-10 rounded-lg border border-[#d2dcf8] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#8ea3ff]"
            disabled={!actionsEnabled || pending !== null}
          />
          <label className="text-xs text-slate-600">Email</label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-10 rounded-lg border border-[#d2dcf8] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#8ea3ff]"
            disabled={!actionsEnabled || pending !== null}
            type="email"
          />
          <button
            type="button"
            onClick={handleLeadSave}
            disabled={!actionsEnabled || pending !== null}
            className="mt-1 inline-flex h-10 items-center justify-center rounded-lg border border-[#5873ee]/35 bg-[linear-gradient(135deg,#6b7ff0_0%,#6179ec_100%)] px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending === "edit" ? "Saving..." : "Save lead"}
          </button>
        </div>

        <div className="grid gap-2 pt-2">
          <label className="text-xs text-slate-600">New task title</label>
          <input
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            className="h-10 rounded-lg border border-[#d2dcf8] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#8ea3ff]"
            disabled={!actionsEnabled || pending !== null}
            placeholder="Follow up with lead"
          />
          <label className="text-xs text-slate-600">Due at (optional)</label>
          <input
            value={taskDueAt}
            onChange={(event) => setTaskDueAt(event.target.value)}
            className="h-10 rounded-lg border border-[#d2dcf8] bg-white px-3 text-sm text-slate-900 outline-none focus:border-[#8ea3ff]"
            disabled={!actionsEnabled || pending !== null}
            type="datetime-local"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleCreateTask}
              disabled={!actionsEnabled || pending !== null}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#cdd7f5] bg-white px-4 text-sm font-medium text-slate-700 disabled:opacity-50"
            >
              {pending === "createTask" ? "Creating..." : "Create task"}
            </button>
            <button
              type="button"
              onClick={handleDoneTask}
              disabled={!actionsEnabled || pending !== null || !lead.nextTaskId}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-[#cdd7f5] bg-[#eef3ff] px-4 text-sm font-medium text-[#27409e] disabled:opacity-50"
            >
              {pending === "doneTask" ? "Updating..." : "Mark next done"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

function LeadsPanel({
  leads,
  actionsEnabled,
  sessionBootstrapping,
  sessionError,
  onCreateLead,
  onPatchLead,
  onCreateTask,
  onMarkTaskDone,
}: {
  leads: LeadItem[];
  actionsEnabled: boolean;
  sessionBootstrapping: boolean;
  sessionError: string | null;
  onCreateLead: (input: {
    fullName: string;
    email: string;
    phone?: string;
  }) => Promise<ApiActionResult>;
  onPatchLead: (uid: string, patch: LeadPatchInput) => Promise<ApiActionResult>;
  onCreateTask: (leadUid: string, input: CreateTaskInput) => Promise<ApiActionResult>;
  onMarkTaskDone: (taskId: string) => Promise<ApiActionResult>;
}) {
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("all");
  const [stage, setStage] = useState("all");
  const [queueStatus, setQueueStatus] = useState("all");
  const [source, setSource] = useState("all");
  const [view, setView] = useState<"active" | "all">("active");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const ownerOptions = useMemo<SelectOption[]>(() => {
    const owners = Array.from(
      new Set(leads.map((lead) => lead.ownerName).filter((item): item is string => Boolean(item))),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: "all", label: "All owners" },
      { value: "assigned", label: "Assigned only" },
      { value: "unassigned", label: "Unassigned" },
      ...owners.map((ownerName) => ({ value: `owner:${ownerName}`, label: ownerName })),
    ];
  }, [leads]);

  const stageOptions = useMemo<SelectOption[]>(() => {
    const statuses = Array.from(
      new Set(leads.map((lead) => lead.statusLabel).filter((item): item is string => Boolean(item))),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: "all", label: "All stages" },
      { value: "unstaged", label: "Unstaged" },
      ...statuses.map((label) => ({ value: `status:${label}`, label })),
    ];
  }, [leads]);

  const sourceOptions = useMemo<SelectOption[]>(() => {
    const values = Array.from(new Set(leads.map((lead) => lead.source))).sort((a, b) =>
      a.localeCompare(b),
    );
    return [
      { value: "all", label: "All sources" },
      ...values.map((item) => ({ value: item, label: item })),
    ];
  }, [leads]);

  const queueStatusOptions = useMemo<SelectOption[]>(
    () => [
      { value: "all", label: "Any queue status" },
      { value: "has_next_action", label: QUEUE_STATUS_META.has_next_action.label },
      { value: "no_next_action", label: QUEUE_STATUS_META.no_next_action.label },
      { value: "unassigned_owner", label: QUEUE_STATUS_META.unassigned_owner.label },
    ],
    [],
  );

  const filteredLeads = useMemo(() => {
    const query = deferredSearch.toLowerCase().trim();
    return leads.filter((lead) => {
      if (view === "active" && !isActiveQueueLead(lead)) return false;

      if (owner === "assigned" && !lead.ownerName) return false;
      if (owner === "unassigned" && lead.ownerName) return false;
      if (owner.startsWith("owner:") && lead.ownerName !== owner.slice("owner:".length)) return false;

      if (stage === "unstaged" && lead.statusLabel) return false;
      if (stage.startsWith("status:") && lead.statusLabel !== stage.slice("status:".length)) return false;

      if (queueStatus !== "all" && getQueueStatus(lead) !== queueStatus) return false;
      if (source !== "all" && lead.source !== source) return false;

      if (!query) return true;
      const text = [lead.fullName, lead.phone ?? "", lead.email ?? ""].join(" ").toLowerCase();
      return text.includes(query);
    });
  }, [deferredSearch, leads, owner, queueStatus, source, stage, view]);

  const selectedLead = useMemo(
    () => (selectedLeadId ? leads.find((lead) => lead.id === selectedLeadId) ?? null : null),
    [leads, selectedLeadId],
  );
  const selectedLeadVisible = useMemo(
    () => (selectedLead ? filteredLeads.some((lead) => lead.id === selectedLead.id) : false),
    [filteredLeads, selectedLead],
  );

  const hasActiveFilters =
    search.trim().length > 0 ||
    owner !== "all" ||
    stage !== "all" ||
    queueStatus !== "all" ||
    source !== "all";

  const resetFilters = () => {
    setSearch("");
    setOwner("all");
    setStage("all");
    setQueueStatus("all");
    setSource("all");
  };

  const activeFilterChips = [
    search.trim() ? { key: "search", label: `Search: ${search.trim()}` } : null,
    owner !== "all"
      ? {
          key: "owner",
          label: owner.startsWith("owner:")
            ? owner.slice("owner:".length)
            : ownerOptions.find((x) => x.value === owner)?.label ?? owner,
        }
      : null,
    stage !== "all"
      ? {
          key: "stage",
          label: stage.startsWith("status:")
            ? stage.slice("status:".length)
            : stageOptions.find((x) => x.value === stage)?.label ?? stage,
        }
      : null,
    queueStatus !== "all"
      ? {
          key: "queueStatus",
          label: queueStatusOptions.find((x) => x.value === queueStatus)?.label ?? queueStatus,
        }
      : null,
    source !== "all" ? { key: "source", label: source } : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));

  return (
    <section className="app-fade-up space-y-4">
      <LeadsControls
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setSelectedLeadId(null);
        }}
        owner={owner}
        onOwnerChange={(value) => {
          setOwner(value);
          setSelectedLeadId(null);
        }}
        stage={stage}
        onStageChange={(value) => {
          setStage(value);
          setSelectedLeadId(null);
        }}
        queueStatus={queueStatus}
        onQueueStatusChange={(value) => {
          setQueueStatus(value);
          setSelectedLeadId(null);
        }}
        source={source}
        onSourceChange={(value) => {
          setSource(value);
          setSelectedLeadId(null);
        }}
        view={view}
        onViewChange={(value) => {
          setView(value);
          setSelectedLeadId(null);
        }}
        ownerOptions={ownerOptions}
        stageOptions={stageOptions}
        queueStatusOptions={queueStatusOptions}
        sourceOptions={sourceOptions}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={() => {
          resetFilters();
          setSelectedLeadId(null);
        }}
        actionsEnabled={actionsEnabled}
        onCreateLead={onCreateLead}
      />

      {!actionsEnabled ? (
        <Card className="border-[#f1d4b5] bg-[#fff6ec] p-3">
          <p className="text-sm text-[#925f2b]">
            API session is not ready yet. Create/edit actions will unlock automatically.
          </p>
        </Card>
      ) : null}

      {activeFilterChips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => {
                if (chip.key === "search") setSearch("");
                if (chip.key === "owner") setOwner("all");
                if (chip.key === "stage") setStage("all");
                if (chip.key === "queueStatus") setQueueStatus("all");
                if (chip.key === "source") setSource("all");
              }}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#d2dcf8] bg-[#f2f6ff] px-2.5 py-1 text-xs text-slate-700 transition hover:bg-[#e7eeff]"
          >
              <span className="truncate">{chip.label}</span>
              <span className="text-slate-400">x</span>
            </button>
          ))}
        </div>
      ) : null}

      {filteredLeads.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-slate-600">No leads match current filters.</p>
        </Card>
      ) : null}

      {filteredLeads.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-[#d4def7] bg-white lg:block">
            <table className="w-full table-fixed border-collapse text-left">
              <thead className="bg-[#eef3ff]">
                <tr className="text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  {["Status", "Lead", "Owner", "Stage", "Last activity", "Next task"].map((header, idx, arr) => (
                    <th key={header} className="relative px-4 py-3 font-medium">
                      {header}
                      {idx < arr.length - 1 ? (
                        <span className="pointer-events-none absolute right-0 top-1/2 h-4 w-px -translate-y-1/2 rotate-[24deg] bg-[#b7c5f2]" />
                      ) : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const statusColor = resolveStatusColor(lead.statusLabel, lead.statusColorHex);
                  const queue = getQueueStatus(lead);
                  const queueMeta = QUEUE_STATUS_META[queue];
                  const isSelected = selectedLeadId === lead.id;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={[
                        "h-[60px] cursor-pointer border-t border-[#ebf0fd] text-sm text-slate-700 transition hover:bg-[#f4f7ff]",
                        isSelected ? "bg-[#eef3ff]" : "",
                      ].join(" ")}
                    >
                      <td className="relative px-4 py-3">
                        <span
                          className="absolute left-0 top-0 h-full w-[2px]"
                          style={{ backgroundColor: `${statusColor}88` }}
                        />
                        <div className="flex items-center gap-2 pl-2">
                          <span
                            className="h-5 w-px rotate-[26deg]"
                            style={{ backgroundColor: `${queueMeta.accent}bb` }}
                          />
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${queueMeta.border} ${queueMeta.bg} ${queueMeta.text}`}
                          >
                            {queueMeta.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate font-semibold text-slate-900">{lead.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{contactLabel(lead)}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{lead.ownerName ?? "Unassigned"}</td>
                      <td className="px-4 py-3">
                        <StatusPill
                          label={lead.statusLabel ?? "Unstaged"}
                          tone={lead.statusLabel ? "default" : "muted"}
                          colorHex={statusColor}
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatRelative(lead.lastActivityAt)}</td>
                      <td className="px-4 py-3">
                        <p className={lead.nextTaskTitle ? "truncate text-slate-800" : "truncate text-slate-400"}>
                          {lead.nextTaskTitle ?? "No task"}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-2.5 lg:hidden">
            {filteredLeads.map((lead) => {
              const statusColor = resolveStatusColor(lead.statusLabel, lead.statusColorHex);
              const queue = QUEUE_STATUS_META[getQueueStatus(lead)];
              return (
                <article
                  key={lead.id}
                  onClick={() => setSelectedLeadId(lead.id)}
                  className="relative overflow-hidden rounded-xl border border-[#d4def7] bg-white px-3.5 py-3"
                >
                  <span
                    className="absolute left-0 top-0 h-full w-[2px]"
                    style={{ backgroundColor: `${statusColor}bb` }}
                  />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-semibold text-slate-900">{lead.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{contactLabel(lead)}</p>
                    </div>
                    <StatusPill
                      label={lead.statusLabel ?? "Unstaged"}
                      tone={lead.statusLabel ? "default" : "muted"}
                      colorHex={statusColor}
                    />
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate text-slate-600">
                      Owner: {lead.ownerName ?? "Unassigned"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-right text-slate-600">
                      Next: {lead.nextTaskTitle ?? "No task"}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                    <span
                      className={`inline-flex min-w-0 items-center gap-1 rounded-full border px-2 py-0.5 ${getSourceBadgeClass(lead.source)}`}
                    >
                      <Icon name="source" className="h-3 w-3 shrink-0" />
                      <span className="truncate">{lead.source}</span>
                    </span>
                    <span
                      className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 font-medium ${queue.border} ${queue.bg} ${queue.text}`}
                    >
                      {queue.label}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {selectedLead && selectedLeadVisible ? (
            <div className="fixed inset-0 z-40">
              <button
                type="button"
                aria-label="Close lead panel backdrop"
                onClick={() => setSelectedLeadId(null)}
                className="absolute inset-0 bg-[#2f4db4]/20 lg:hidden"
              />
              <div className="app-slide-in-right absolute bottom-0 right-0 top-0 w-full max-w-[560px] overflow-y-auto border-l border-[#d4def7] bg-[#f8faff] shadow-[-22px_0_56px_rgba(76,103,227,0.22)]">
                <LeadDetailPanel
                  key={selectedLead.id}
                  lead={selectedLead}
                  onClose={() => setSelectedLeadId(null)}
                  actionsEnabled={actionsEnabled}
                  sessionBootstrapping={sessionBootstrapping}
                  sessionError={sessionError}
                  onPatchLead={onPatchLead}
                  onCreateTask={onCreateTask}
                  onMarkTaskDone={onMarkTaskDone}
                />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function TasksPanel({
  tasks,
  actionsEnabled,
  onMarkTaskDone,
}: {
  tasks: TaskItem[];
  actionsEnabled: boolean;
  onMarkTaskDone: (taskId: string) => Promise<ApiActionResult>;
}) {
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const grouped = tasks.reduce<Record<string, TaskItem[]>>((acc, task) => {
    const key = groupTask(task);
    acc[key] = acc[key] ?? [];
    acc[key].push(task);
    return acc;
  }, {});

  const order = ["Overdue", "Today", "Upcoming", "No deadline", "Done"];

  return (
    <section className="app-fade-up space-y-4">
      <div className="space-y-3">
        {order
          .filter((section) => (grouped[section] ?? []).length > 0)
          .map((section) => (
            <Card key={section} className="overflow-hidden p-0">
              <header className="flex items-center justify-between border-b border-[#dce4fa] bg-[#f3f6ff] px-4 py-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">{section}</h2>
                <span className="text-xs text-slate-500">{grouped[section].length}</span>
              </header>
              <div className="divide-y divide-[#edf2ff]">
                {grouped[section].map((task) => (
                  <div
                    key={task.id}
                    className="grid gap-2 px-4 py-3 sm:grid-cols-[1.35fr_1fr_1fr_auto_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{task.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{task.leadName ?? "No linked lead"}</p>
                    </div>
                    <p className="truncate text-sm text-slate-600">{task.assigneeName ?? "Unassigned"}</p>
                    <p className="truncate text-sm text-slate-500">
                      {task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"}
                    </p>
                    <StatusPill label={task.doneAt ? "Done" : "Open"} tone={taskTone(task)} />
                    {task.doneAt ? (
                      <span className="text-xs text-slate-400">-</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!actionsEnabled || pendingTaskId === task.id}
                        onClick={async () => {
                          setPendingTaskId(task.id);
                          await onMarkTaskDone(task.id);
                          setPendingTaskId(null);
                        }}
                        className="inline-flex h-8 items-center justify-center rounded-md border border-[#cfd8f6] px-2.5 text-xs font-medium text-[#2b438d] disabled:opacity-50"
                      >
                        {pendingTaskId === task.id ? "..." : "Done"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
      </div>
    </section>
  );
}

function StatsPanel({
  kpis,
  sourceStats,
}: {
  kpis: Props["kpis"];
  sourceStats: SourceStat[];
}) {
  const total = sourceStats.reduce((acc, item) => acc + item.count, 0);
  const palette = ["#6b7ff0", "#4f67e8", "#8fa2ff", "#2f46c4", "#7a8df5", "#5f74df"];
  const segments = sourceStats.map((item, idx) => ({
    ...item,
    color: palette[idx % palette.length],
    percent: total === 0 ? 0 : Math.round((item.count / total) * 100),
  }));
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? 0;
  const activeSegment = segments[activeIndex];
  const donutSize = 216;
  const radius = 78;
  const stroke = 22;
  const circumference = 2 * Math.PI * radius;
  const chartSegments = segments.reduce<{
    progress: number;
    items: Array<(typeof segments)[number] & { slice: number; offset: number }>;
  }>(
    (acc, segment) => {
      const slice = total === 0 ? 0 : (segment.count / total) * circumference;
      const offset = circumference - acc.progress;
      return {
        progress: acc.progress + slice,
        items: [...acc.items, { ...segment, slice, offset }],
      };
    },
    { progress: 0, items: [] },
  ).items;

  return (
    <section className="app-fade-up space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Leads in pipeline" value={String(kpis.leadsCount)} tone="accent" />
        <KpiCard label="Open tasks" value={String(kpis.openTasks)} />
        <KpiCard label="Task completion rate" value={`${kpis.completionRate}%`} />
        <KpiCard label="Business events" value={String(kpis.eventsCount)} />
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Leads by source</h2>
        {segments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No source data yet.</p>
        ) : (
          <div className="mt-3 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
            <div className="mx-auto flex w-full max-w-[240px] flex-col items-center justify-center">
              <svg
                viewBox={`0 0 ${donutSize} ${donutSize}`}
                className="h-[184px] w-[184px] sm:h-[216px] sm:w-[216px]"
              >
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  fill="none"
                  stroke="rgba(107,127,240,0.16)"
                  strokeWidth={stroke}
                />
                {chartSegments.map((segment, idx) => {
                  return (
                    <circle
                      key={segment.source}
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="none"
                      stroke={segment.color}
                      strokeWidth={stroke}
                      strokeLinecap="round"
                      strokeDasharray={`${segment.slice} ${circumference - segment.slice}`}
                      strokeDashoffset={segment.offset}
                      transform={`rotate(-90 ${donutSize / 2} ${donutSize / 2})`}
                      className="cursor-pointer transition-opacity"
                      style={{ opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.35 }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>
              <div className="mt-1 text-center">
                <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Selected</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{prettifySource(activeSegment.source)}</p>
                <p className="text-xs text-slate-500">
                  {activeSegment.count} leads ({activeSegment.percent}%)
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              {segments.map((segment, idx) => (
                <button
                  key={segment.source}
                  type="button"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-[#d8e0f8] bg-[#f7f9ff] px-3 py-2 text-left transition hover:bg-[#eef3ff]"
                >
                  <span className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-700">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                    <span className="truncate">{prettifySource(segment.source)}</span>
                  </span>
                  <span className="text-xs text-slate-500">
                    {segment.count} ({segment.percent}%)
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}

function SettingsPanel({
  statuses,
  members,
  sources,
}: {
  statuses: StatusItem[];
  members: MemberItem[];
  sources: SourceItem[];
}) {
  const settingGroups = ["Business", "Stages", "Team/Admin", "Integrations", "Notifications", "Plan"];

  return (
    <section className="app-fade-up space-y-4">
      <div className="grid gap-3 lg:grid-cols-[210px_1fr]">
        <Card className="hidden p-2 lg:block">
          <ul className="space-y-1">
            {settingGroups.map((group, idx) => (
              <li
                key={group}
                className={[
                  "cursor-default rounded-lg px-3 py-2.5 text-sm transition",
                  idx === 0
                    ? "border border-[#6b7ff0]/35 bg-[#eaf0ff] text-[#243a8f]"
                    : "text-slate-600 hover:bg-[#eef2ff] hover:text-slate-900",
                ].join(" ")}
              >
                {group}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-3">
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Pipeline stages</h2>
            <div className="mt-3 space-y-2">
              {statuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between rounded-lg border border-[#d8e0f8] bg-[#f7f9ff] px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.colorHex }} />
                    <span className="text-sm text-slate-800">{status.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">{status.key}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Team/Admin</h2>
            <div className="mt-3 divide-y divide-[#edf2ff]">
              {members.map((member) => (
                <div key={member.id} className="grid gap-1 py-2 text-sm sm:grid-cols-[1.4fr_auto_auto] sm:items-center">
                  <p className="truncate text-slate-800">{member.displayName}</p>
                  <p className="truncate text-slate-500">{member.email ?? "-"}</p>
                  <StatusPill label={member.role} tone="muted" />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-600">Ingestion sources</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {sources.map((source) => (
                <div key={source.key} className="rounded-lg border border-[#d8e0f8] bg-[#f7f9ff] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{source.family}</p>
                    <StatusPill
                      label={source.isActive ? "active" : "inactive"}
                      tone={source.isActive ? "success" : "muted"}
                    />
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{source.key}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function AppWorkspace(props: Props) {
  const router = useRouter();
  const { activeTab } = useProductTab();
  const [isRefreshing, startRefreshTransition] = useTransition();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<"bootstrapping" | "ready" | "error">("bootstrapping");
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function bootstrapSession() {
      try {
        setSessionStatus("bootstrapping");
        setSessionError(null);

        const response = await fetch("/api/v1/auth/validate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            debug: {
              telegram_id: "app-local-ui-user",
              display_name: "App Local UI",
              email: "app.local.ui@owo.local",
            },
          }),
        });

        const json = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          token?: string;
          error?: string;
        };

        if (!response.ok || !json.ok || !json.token) {
          throw new Error(json.error ?? "AUTH_BOOTSTRAP_FAILED");
        }

        if (!active) return;
        setSessionToken(json.token);
        setSessionStatus("ready");
      } catch (error) {
        if (!active) return;
        setSessionStatus("error");
        setSessionToken(null);
        setSessionError(error instanceof Error ? error.message : "API_SESSION_FAILED");
      }
    }

    bootstrapSession();
    return () => {
      active = false;
    };
  }, []);

  const refreshData = useCallback(() => {
    startRefreshTransition(() => {
      router.refresh();
    });
  }, [router]);

  const callApi = useCallback(
    async (path: string, init: RequestInit) => {
      if (!sessionToken) {
        throw new Error("API_SESSION_MISSING");
      }

      const headers = new Headers(init.headers);
      headers.set("content-type", "application/json");
      headers.set("authorization", `Bearer ${sessionToken}`);

      const response = await fetch(path, {
        ...init,
        headers,
      });

      const json = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !json.ok) {
        throw new Error(json.error ?? "API_REQUEST_FAILED");
      }
    },
    [sessionToken],
  );

  const createLead = useCallback(
    async (input: { fullName: string; email: string; phone?: string }): Promise<ApiActionResult> => {
      try {
        await callApi("/api/v1/leads", {
          method: "POST",
          body: JSON.stringify({
            full_name: input.fullName,
            email: input.email,
            phone: input.phone ?? null,
          }),
        });
        refreshData();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "LEAD_CREATE_FAILED" };
      }
    },
    [callApi, refreshData],
  );

  const patchLead = useCallback(
    async (uid: string, patch: LeadPatchInput): Promise<ApiActionResult> => {
      try {
        await callApi(`/api/v1/leads/${uid}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
        });
        refreshData();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "LEAD_PATCH_FAILED" };
      }
    },
    [callApi, refreshData],
  );

  const createTaskForLead = useCallback(
    async (leadUid: string, input: CreateTaskInput): Promise<ApiActionResult> => {
      try {
        await callApi("/api/v1/tasks", {
          method: "POST",
          body: JSON.stringify({
            title: input.title,
            lead_uid: leadUid,
            due_at: input.due_at ?? null,
          }),
        });
        refreshData();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "TASK_CREATE_FAILED" };
      }
    },
    [callApi, refreshData],
  );

  const markTaskDone = useCallback(
    async (taskId: string): Promise<ApiActionResult> => {
      try {
        await callApi(`/api/v1/tasks/${taskId}/done`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        refreshData();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "TASK_DONE_FAILED" };
      }
    },
    [callApi, refreshData],
  );

  const actionsEnabled = sessionStatus === "ready" && !isRefreshing;

  if (activeTab === "tasks") {
    return (
      <TasksPanel
        tasks={props.tasks}
        actionsEnabled={actionsEnabled}
        onMarkTaskDone={markTaskDone}
      />
    );
  }
  if (activeTab === "stats") return <StatsPanel kpis={props.kpis} sourceStats={props.sourceStats} />;
  if (activeTab === "settings") {
    return <SettingsPanel statuses={props.statuses} members={props.members} sources={props.sources} />;
  }
  return (
    <LeadsPanel
      leads={props.leads}
      actionsEnabled={actionsEnabled}
      sessionBootstrapping={sessionStatus === "bootstrapping"}
      sessionError={sessionError}
      onCreateLead={createLead}
      onPatchLead={patchLead}
      onCreateTask={createTaskForLead}
      onMarkTaskDone={markTaskDone}
    />
  );
}
