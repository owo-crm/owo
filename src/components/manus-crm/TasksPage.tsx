"use client";

import { CheckCircle2, Plus, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api/client-session";
import type { TaskDto, TeamMemberDto } from "@/lib/types/domain";
import { EntityDrawer } from "./EntityDrawer";
import { LeadSearchSelect } from "./LeadSearchSelect";

type TasksResponse = {
  ok: boolean;
  tasks: TaskDto[];
};

type TeamResponse = {
  ok: boolean;
  members: TeamMemberDto[];
};

type TaskEnvelope = {
  ok: boolean;
  task: TaskDto;
};

type TaskDraft = {
  title: string;
  note: string;
  lead_uid: string;
  lead_label: string;
  assignee_id: string;
  due_at: string;
};

const emptyTaskDraft: TaskDraft = {
  title: "",
  note: "",
  lead_uid: "",
  lead_label: "",
  assignee_id: "",
  due_at: "",
};

export function TasksPage() {
  const [tab, setTab] = useState<"tasks" | "team">("tasks");
  const [tasks, setTasks] = useState<TaskDto[]>([]);
  const [members, setMembers] = useState<TeamMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [newTask, setNewTask] = useState<TaskDraft>(emptyTaskDraft);

  const [editTask, setEditTask] = useState({
    title: "",
    note: "",
    assignee_id: "",
    due_at: "",
    lead_uid: "",
    lead_label: "",
  });

  const [newMember, setNewMember] = useState({
    display_name: "",
    email: "",
    role: "OPERATOR" as TeamMemberDto["role"],
  });

  const openTasks = useMemo(() => tasks.filter((task) => !task.done_at), [tasks]);
  const selectedTask = useMemo(
    () => openTasks.find((task) => task.id === selectedTaskId) ?? null,
    [openTasks, selectedTaskId],
  );

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [tasksResponse, teamResponse] = await Promise.all([
        apiFetch("/api/v1/tasks?limit=300"),
        apiFetch("/api/v1/team"),
      ]);
      const tasksJson = (await tasksResponse.json()) as TasksResponse | { ok: false; error: string };
      const teamJson = (await teamResponse.json()) as TeamResponse | { ok: false; error: string };

      if (!tasksResponse.ok || !tasksJson.ok) throw new Error("Failed to load tasks");
      if (!teamResponse.ok || !teamJson.ok) throw new Error("Failed to load team");

      setTasks(tasksJson.tasks);
      setMembers(teamJson.members);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load tasks and team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedTask) return;
    setEditTask({
      title: selectedTask.title,
      note: selectedTask.note ?? "",
      assignee_id: selectedTask.assignee?.id ?? "",
      due_at: selectedTask.due_at ? selectedTask.due_at.slice(0, 10) : "",
      lead_uid: selectedTask.lead_uid ?? "",
      lead_label: selectedTask.lead_name ?? "",
    });
  }, [selectedTask]);

  useEffect(() => {
    if (!selectedTaskId) return;
    if (!openTasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [openTasks, selectedTaskId]);

  const addTask = async () => {
    const title = newTask.title.trim();
    if (!title) {
      setFormError("Task title is required.");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const response = await apiFetch("/api/v1/tasks", {
        method: "POST",
        body: JSON.stringify({
          title,
          note: newTask.note.trim() || null,
          lead_uid: newTask.lead_uid.trim() || null,
          assignee_id: newTask.assignee_id || null,
          due_at: newTask.due_at ? new Date(newTask.due_at).toISOString() : null,
        }),
      });
      const json = (await response.json()) as TaskEnvelope | { ok: false; error: string };
      if (!response.ok || !json.ok) throw new Error("Failed to create task");

      setShowAddTask(false);
      setNewTask(emptyTaskDraft);
      await refresh();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const markDone = async (taskId: string) => {
    try {
      await apiFetch(`/api/v1/tasks/${taskId}/done`, { method: "POST" });
      await refresh();
    } catch {
      setError("Failed to mark task done");
    }
  };

  const saveTaskEdit = async () => {
    if (!selectedTaskId) return;
    const title = editTask.title.trim();
    if (!title) {
      setFormError("Task title is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiFetch(`/api/v1/tasks/${selectedTaskId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          note: editTask.note.trim() || null,
          assignee_id: editTask.assignee_id || null,
          lead_uid: editTask.lead_uid || null,
          due_at: editTask.due_at ? new Date(editTask.due_at).toISOString() : null,
        }),
      });
      const json = (await response.json()) as TaskEnvelope | { ok: false; error: string };
      if (!response.ok || !json.ok) throw new Error("Failed to update task");
      await refresh();
    } catch (updateError) {
      setFormError(updateError instanceof Error ? updateError.message : "Failed to update task");
    } finally {
      setSaving(false);
    }
  };

  const addMember = async () => {
    const displayName = newMember.display_name.trim();
    if (!displayName) {
      setFormError("Display name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const response = await apiFetch("/api/v1/team/members", {
        method: "POST",
        body: JSON.stringify({
          display_name: displayName,
          email: newMember.email.trim() || null,
          role: newMember.role,
        }),
      });
      const json = (await response.json()) as { ok: true } | { ok: false; error: string };
      if (!response.ok || !json.ok) throw new Error("Failed to add team member");
      setShowAddMember(false);
      setNewMember({ display_name: "", email: "", role: "OPERATOR" });
      await refresh();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Failed to add team member");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--app-text)]">Tasks & Team</h1>
          <p className="mt-1 text-[var(--app-muted)]">Live board powered by API.</p>
        </div>
        {tab === "tasks" ? (
          <button onClick={() => setShowAddTask(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244ee2]">
            <Plus size={18} /> Add task
          </button>
        ) : (
          <button onClick={() => setShowAddMember(true)} className="inline-flex items-center gap-2 rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white hover:bg-[#244ee2]">
            <Users size={18} /> Add team member
          </button>
        )}
      </div>

      <div className="inline-flex rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-1 shadow-sm">
        <button onClick={() => setTab("tasks")} className={`rounded-md px-3 py-1.5 text-sm ${tab === "tasks" ? "bg-[#2D5CFE] text-white" : "text-[var(--app-muted)] hover:text-[var(--app-hover-text)]"}`}>Tasks</button>
        <button onClick={() => setTab("team")} className={`rounded-md px-3 py-1.5 text-sm ${tab === "team" ? "bg-[#2D5CFE] text-white" : "text-[var(--app-muted)] hover:text-[var(--app-hover-text)]"}`}>Team</button>
      </div>

      {loading ? <div className="text-sm text-[var(--app-muted)]">Loading...</div> : null}
      {error ? <div className="text-sm text-red-500">{error}</div> : null}

      {!loading && tab === "tasks" ? (
        <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--app-border)] bg-[var(--app-muted-surface)]">
                {["Task", "Lead", "Assignee", "Due", "Status", "Done"].map((header) => (
                  <th key={header} className="px-5 py-4 text-left text-sm font-semibold text-[var(--app-muted)]">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {openTasks.map((task) => (
                <tr
                  key={task.id}
                  className="cursor-pointer border-b border-[var(--app-border)] last:border-b-0 hover:bg-[var(--app-muted-surface)]"
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setFormError(null);
                  }}
                >
                  <td className="px-5 py-4 text-sm text-[var(--app-text)]">{task.title}</td>
                  <td className="px-5 py-4 text-sm text-[var(--app-muted)]">{task.lead_name ?? "No lead linked"}</td>
                  <td className="px-5 py-4 text-sm text-[var(--app-muted)]">{task.assignee?.display_name ?? "Unassigned"}</td>
                  <td className="px-5 py-4 text-sm text-[var(--app-muted)]">{task.due_at ? new Date(task.due_at).toLocaleDateString() : "No due date"}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-400/25 dark:bg-amber-500/15 dark:text-amber-200">
                      Open
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void markDone(task.id);
                      }}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!loading && tab === "team" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {members.map((member) => (
            <div key={member.user_id} className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--app-text)]">{member.display_name}</h3>
              <p className="mt-1 text-sm text-[var(--app-muted)]">{member.role}</p>
              <p className="mt-2 text-xs text-[var(--app-muted)]">{member.email ?? "No email"}</p>
            </div>
          ))}
        </div>
      ) : null}

      <EntityDrawer
        open={Boolean(selectedTaskId)}
        onClose={() => setSelectedTaskId(null)}
        title={selectedTask?.title ?? "Task details"}
        subtitle={selectedTask?.lead_name ?? "No lead linked"}
        footer={
          <div className="flex justify-end gap-2">
            <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setSelectedTaskId(null)}>
              Close
            </button>
            <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void saveTaskEdit()} disabled={saving || !selectedTaskId}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        }
      >
        {!selectedTask ? (
          <div className="text-sm text-[var(--app-muted)]">Loading task...</div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Title*
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={editTask.title} onChange={(event) => setEditTask((prev) => ({ ...prev, title: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Linked lead
              <div className="mt-1">
                <LeadSearchSelect
                  value={editTask.lead_uid}
                  selectedLabel={editTask.lead_label}
                  onChange={(leadUid, leadLabel) =>
                    setEditTask((prev) => ({
                      ...prev,
                      lead_uid: leadUid,
                      lead_label: leadLabel ?? "",
                    }))
                  }
                />
              </div>
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Assignee
              <select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={editTask.assignee_id} onChange={(event) => setEditTask((prev) => ({ ...prev, assignee_id: event.target.value }))}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>{member.display_name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Due date
              <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="date" value={editTask.due_at} onChange={(event) => setEditTask((prev) => ({ ...prev, due_at: event.target.value }))} />
            </label>
            <label className="text-xs font-medium text-[var(--app-muted)]">
              Note
              <textarea className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Task context for the assignee." value={editTask.note} onChange={(event) => setEditTask((prev) => ({ ...prev, note: event.target.value }))} />
            </label>
            {formError ? <p className="text-sm text-red-500">{formError}</p> : null}
          </div>
        )}
      </EntityDrawer>

      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--app-text)]">Add Task</h2>
              <button className="rounded-lg p-2 hover:bg-[var(--app-muted-surface)]" onClick={() => setShowAddTask(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-[var(--app-muted)] md:col-span-2">
                Title*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="First follow-up call" value={newTask.title} onChange={(event) => setNewTask((prev) => ({ ...prev, title: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Linked lead (optional)
                <div className="mt-1">
                  <LeadSearchSelect
                    value={newTask.lead_uid}
                    selectedLabel={newTask.lead_label}
                    onChange={(leadUid, leadLabel) =>
                      setNewTask((prev) => ({
                        ...prev,
                        lead_uid: leadUid,
                        lead_label: leadLabel ?? "",
                      }))
                    }
                  />
                </div>
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Assignee
                <select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={newTask.assignee_id} onChange={(event) => setNewTask((prev) => ({ ...prev, assignee_id: event.target.value }))}>
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>{member.display_name}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)] md:col-span-2">
                Due date
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" type="date" value={newTask.due_at} onChange={(event) => setNewTask((prev) => ({ ...prev, due_at: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)] md:col-span-2">
                Note
                <textarea className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Short instructions for the team." value={newTask.note} onChange={(event) => setNewTask((prev) => ({ ...prev, note: event.target.value }))} />
              </label>
            </div>
            {formError ? <p className="mt-3 text-sm text-red-500">{formError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setShowAddTask(false)}>Cancel</button>
              <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void addTask()} disabled={saving}>Add</button>
            </div>
          </div>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--app-text)]">Add Team Member</h2>
              <button className="rounded-lg p-2 hover:bg-[var(--app-muted-surface)]" onClick={() => setShowAddMember(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Display name*
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="Alex Smith" value={newMember.display_name} onChange={(event) => setNewMember((prev) => ({ ...prev, display_name: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)]">
                Email
                <input className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" placeholder="alex@company.com" value={newMember.email} onChange={(event) => setNewMember((prev) => ({ ...prev, email: event.target.value }))} />
              </label>
              <label className="text-xs font-medium text-[var(--app-muted)] md:col-span-2">
                Role
                <select className="mt-1 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-sm text-[var(--app-text)]" value={newMember.role} onChange={(event) => setNewMember((prev) => ({ ...prev, role: event.target.value as TeamMemberDto["role"] }))}>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </label>
            </div>
            {formError ? <p className="mt-3 text-sm text-red-500">{formError}</p> : null}
            <div className="mt-5 flex justify-end gap-2">
              <button className="rounded-lg border border-[var(--app-border)] px-4 py-2 text-sm text-[var(--app-text)]" onClick={() => setShowAddMember(false)}>Cancel</button>
              <button className="rounded-lg bg-[#2D5CFE] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={() => void addMember()} disabled={saving}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
