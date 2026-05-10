"use client";

import { Bell, Bot, Lock, Paintbrush, Play, Save, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { apiFetch } from "@/lib/api/client-session";
import type {
  AutomationActionDto,
  AutomationScenarioConfigDto,
  AutomationScenarioDto,
  AutomationTestRunResultDto,
  LeadDto,
  SettingsDto,
  TeamMemberDto,
} from "@/lib/types/domain";
import { LeadSearchSelect } from "./LeadSearchSelect";

type SettingsTab = "general" | "notifications" | "security" | "appearance" | "automation";
type SettingsResponse = { ok: true; settings: SettingsDto };
type ScenariosResponse = { ok: true; scenarios: AutomationScenarioDto[] };
type ScenarioPatchResponse = { ok: true; scenario: AutomationScenarioDto };
type ScenarioTestRunResponse = { ok: true; result: AutomationTestRunResultDto };
type TeamResponse = { ok: true; members: TeamMemberDto[] };
type LeadsResponse = { ok: true; leads: LeadDto[] };
type ApiErrorResponse = { ok: false; error: string };

const conditionKeys = [
  "only_if_unassigned",
  "only_if_lead_has_email",
  "only_if_status_changed",
] as const;
type ConditionKey = (typeof conditionKeys)[number];

const defaultSettings: SettingsDto = {
  company_name: "",
  email_address: "",
  phone_number: "",
  timezone: "UTC+1 (Central European Time)",
  language: "English",
  notifications: { email_alerts: true, push_alerts: true, task_reminders: true },
  security: { two_factor: false, session_timeout: "30 minutes" },
  appearance: { theme_mode: "Light", density: "Comfortable" },
  updated_at: new Date().toISOString(),
};

const triggerLabels: Record<string, string> = {
  "lead.created": "Lead is created",
  "lead.updated": "Lead is updated",
  "lead.note.created": "Lead note is created",
  "lead.note.updated": "Lead note is updated",
  "lead.note.deleted": "Lead note is deleted",
  "task.created": "Task is created",
  "task.done": "Task is completed",
};

const conditionLabels: Record<ConditionKey, string> = {
  only_if_unassigned: "Only if lead is unassigned",
  only_if_lead_has_email: "Only if lead has email",
  only_if_status_changed: "Only if status changed",
};

const actionLabels: Record<string, string> = {
  assign_owner: "Assign owner",
  create_follow_up_task: "Create follow-up task",
  send_team_alert_email: "Send team alert email",
  send_client_auto_reply_email: "Send client auto-reply email",
};

function readErrorCode(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const value = payload as Record<string, unknown>;
  return typeof value.error === "string" ? value.error : null;
}

function automationMessage(code: string | null, fallback: string) {
  if (!code) return fallback;
  if (code === "TOO_MANY_CONDITIONS") return "You can enable at most two conditions.";
  if (code === "ACTION_REQUIRED") return "At least one action is required.";
  if (code === "NAME_REQUIRED") return "Scenario name is required.";
  if (code === "AUTOMATION_SCENARIOS_READ_FAILED") return "Could not load automation scenarios.";
  if (code === "AUTOMATION_TEST_RUN_FAILED") return "Dry-run failed.";
  return fallback;
}

function runTone(status: "succeeded" | "failed" | "skipped") {
  if (status === "succeeded") return "text-emerald-600 dark:text-emerald-300";
  if (status === "failed") return "text-red-600 dark:text-red-300";
  return "text-amber-600 dark:text-amber-300";
}

function actionPreview(action: AutomationActionDto, members: TeamMemberDto[]) {
  if (action.type !== "assign_owner") return actionLabels[action.type] ?? action.type;
  if (action.policy === "fixed_owner" && action.fixed_owner_id) {
    const member = members.find((item) => item.user_id === action.fixed_owner_id);
    return `Assign owner (fixed: ${member?.display_name ?? "Unknown"})`;
  }
  return "Assign owner (round robin)";
}

function previewScenario(scenario: AutomationScenarioDto, members: TeamMemberDto[]) {
  const when = triggerLabels[scenario.trigger_type] ?? scenario.trigger_type;
  const conditions = conditionKeys
    .filter((key) => Boolean(scenario.config.conditions?.[key]))
    .map((key) => conditionLabels[key]);
  const actions = scenario.config.actions.map((action) => actionPreview(action, members)).join(", then ");
  const ifPart = conditions.length ? ` if ${conditions.join(" and ")}` : "";
  return `When ${when}${ifPart}, then ${actions || "no action"}.`;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--app-text)]">{label}</label>
      {children}
    </div>
  );
}

function InputBase(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-base text-[var(--app-text)] outline-none ring-[#2D5CFE] transition focus:ring-2"
    />
  );
}

function SelectBase(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 text-base text-[var(--app-text)] outline-none ring-[#2D5CFE] transition focus:ring-2"
    />
  );
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<SettingsDto>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [automationLoaded, setAutomationLoaded] = useState(false);
  const [automationLoading, setAutomationLoading] = useState(false);
  const [automationError, setAutomationError] = useState<string | null>(null);
  const [automationNotice, setAutomationNotice] = useState<string | null>(null);
  const [automationSavingId, setAutomationSavingId] = useState<string | null>(null);
  const [automationTestingId, setAutomationTestingId] = useState<string | null>(null);
  const [testLeadUid, setTestLeadUid] = useState("");
  const [scenarios, setScenarios] = useState<AutomationScenarioDto[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberDto[]>([]);
  const [leadOptions, setLeadOptions] = useState<LeadDto[]>([]);
  const [testResults, setTestResults] = useState<Record<string, AutomationTestRunResultDto>>({});

  const tabs: Array<{ key: SettingsTab; label: string; icon: LucideIcon }> = [
    { key: "general", label: "General", icon: User },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "security", label: "Security", icon: Lock },
    { key: "appearance", label: "Appearance", icon: Paintbrush },
    { key: "automation", label: "Automation", icon: Bot },
  ];

  const teamById = useMemo(() => new Map(teamMembers.map((member) => [member.user_id, member])), [teamMembers]);

  async function loadSettings() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/v1/settings");
      const json = (await response.json()) as SettingsResponse | ApiErrorResponse;
      if (!response.ok || !json.ok) throw new Error("Failed to load settings");
      setSettings(json.settings);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }

  async function loadAutomationData() {
    setAutomationLoading(true);
    setAutomationError(null);
    setAutomationNotice(null);
    try {
      const [scenarioResponse, teamResponse, leadResponse] = await Promise.all([
        apiFetch("/api/v1/settings/automation/scenarios"),
        apiFetch("/api/v1/team"),
        apiFetch("/api/v1/leads?limit=40"),
      ]);
      const scenarioJson = (await scenarioResponse.json()) as ScenariosResponse | ApiErrorResponse;
      const teamJson = (await teamResponse.json()) as TeamResponse | ApiErrorResponse;
      const leadJson = (await leadResponse.json()) as LeadsResponse | ApiErrorResponse;
      if (!scenarioResponse.ok || !scenarioJson.ok) throw new Error(automationMessage(readErrorCode(scenarioJson), "Could not load automation scenarios."));
      if (!teamResponse.ok || !teamJson.ok) throw new Error("Could not load team members.");
      if (!leadResponse.ok || !leadJson.ok) throw new Error("Could not load leads.");
      setScenarios(scenarioJson.scenarios);
      setTeamMembers(teamJson.members);
      setLeadOptions(leadJson.leads);
      setAutomationLoaded(true);
    } catch (loadError) {
      setAutomationError(loadError instanceof Error ? loadError.message : "Failed to load automation tab.");
    } finally {
      setAutomationLoading(false);
    }
  }

  useEffect(() => { void loadSettings(); }, []);
  useEffect(() => {
    if (activeTab !== "automation" || automationLoaded || automationLoading) return;
    void loadAutomationData();
  }, [activeTab, automationLoaded, automationLoading]);

  const saveSettings = async () => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const response = await apiFetch("/api/v1/settings", { method: "PATCH", body: JSON.stringify(settings) });
      const json = (await response.json()) as SettingsResponse | ApiErrorResponse;
      if (!response.ok || !json.ok) throw new Error("Failed to save settings");
      setSettings(json.settings); setSuccess("Saved");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  async function refreshScenariosOnly() {
    const response = await apiFetch("/api/v1/settings/automation/scenarios");
    const json = (await response.json()) as ScenariosResponse | ApiErrorResponse;
    if (!response.ok || !json.ok) {
      throw new Error(
        automationMessage(readErrorCode(json), "Could not refresh automation scenarios."),
      );
    }
    setScenarios(json.scenarios);
  }

  async function patchScenario(
    scenarioId: string,
    patch: {
      is_active?: boolean;
      config?: AutomationScenarioConfigDto;
    },
  ) {
    setAutomationSavingId(scenarioId);
    setAutomationError(null);
    setAutomationNotice(null);
    try {
      const response = await apiFetch(`/api/v1/settings/automation/scenarios/${scenarioId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      const json = (await response.json()) as ScenarioPatchResponse | ApiErrorResponse;
      if (!response.ok || !json.ok) {
        throw new Error(automationMessage(readErrorCode(json), "Failed to update scenario."));
      }
      setScenarios((previous) =>
        previous.map((item) => (item.id === scenarioId ? json.scenario : item)),
      );
      setAutomationNotice("Scenario updated.");
    } catch (patchError) {
      setAutomationError(
        patchError instanceof Error ? patchError.message : "Failed to update scenario.",
      );
    } finally {
      setAutomationSavingId(null);
    }
  }

  async function runScenarioTest(scenarioId: string) {
    setAutomationTestingId(scenarioId);
    setAutomationError(null);
    setAutomationNotice(null);
    try {
      const response = await apiFetch(
        `/api/v1/settings/automation/scenarios/${scenarioId}/test-run`,
        {
          method: "POST",
          body: JSON.stringify({ lead_uid: testLeadUid || null }),
        },
      );
      const json = (await response.json()) as ScenarioTestRunResponse | ApiErrorResponse;
      if (!response.ok || !json.ok) {
        throw new Error(automationMessage(readErrorCode(json), "Dry-run failed."));
      }
      setTestResults((previous) => ({ ...previous, [scenarioId]: json.result }));
      setAutomationNotice("Dry-run completed.");
      await refreshScenariosOnly();
    } catch (testError) {
      setAutomationError(testError instanceof Error ? testError.message : "Dry-run failed.");
    } finally {
      setAutomationTestingId(null);
    }
  }

  function toggleCondition(
    scenario: AutomationScenarioDto,
    condition: ConditionKey,
    enabled: boolean,
  ) {
    const nextConditions = {
      ...(scenario.config.conditions ?? {}),
      [condition]: enabled,
    };
    if (Object.values(nextConditions).filter(Boolean).length > 2) {
      setAutomationError("You can enable at most two conditions.");
      return;
    }
    void patchScenario(scenario.id, {
      config: { ...scenario.config, conditions: nextConditions },
    });
  }

  function updateAssignOwnerPolicy(
    scenario: AutomationScenarioDto,
    policy: "round_robin" | "fixed_owner",
  ) {
    const actions = scenario.config.actions.map((action) =>
      action.type === "assign_owner"
        ? {
            ...action,
            policy,
            fixed_owner_id: policy === "fixed_owner" ? action.fixed_owner_id ?? null : null,
          }
        : action,
    );
    void patchScenario(scenario.id, { config: { ...scenario.config, actions } });
  }

  function updateAssignOwnerFixed(
    scenario: AutomationScenarioDto,
    ownerId: string,
  ) {
    const actions = scenario.config.actions.map((action) =>
      action.type === "assign_owner"
        ? {
            ...action,
            policy: "fixed_owner" as const,
            fixed_owner_id: ownerId || null,
          }
        : action,
    );
    void patchScenario(scenario.id, { config: { ...scenario.config, actions } });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--app-text)]">Settings</h1>
        <p className="mt-1 text-[var(--app-muted)]">Manage your account and application preferences</p>
      </div>

      <div className="overflow-x-auto border-b border-[var(--app-border)]">
        <div className="inline-flex min-w-full gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors md:px-4 ${
                  isActive
                    ? "border-[#2D5CFE] text-[#2D5CFE]"
                    : "border-transparent text-[var(--app-muted)] hover:text-[var(--app-hover-text)]"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? <div className="text-sm text-[var(--app-muted)]">Loading settings...</div> : null}
      {error ? <div className="text-sm text-red-500">{error}</div> : null}
      {success ? <div className="text-sm text-emerald-600 dark:text-emerald-300">{success}</div> : null}

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
        {activeTab === "general" ? (
          <div className="space-y-5">
            <Field label="Company Name">
              <InputBase value={settings.company_name} onChange={(event) => setSettings((previous) => ({ ...previous, company_name: event.target.value }))} />
            </Field>
            <Field label="Email Address">
              <InputBase type="email" value={settings.email_address ?? ""} onChange={(event) => setSettings((previous) => ({ ...previous, email_address: event.target.value }))} />
            </Field>
            <Field label="Phone Number">
              <InputBase value={settings.phone_number ?? ""} onChange={(event) => setSettings((previous) => ({ ...previous, phone_number: event.target.value }))} />
            </Field>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Timezone">
                <SelectBase value={settings.timezone} onChange={(event) => setSettings((previous) => ({ ...previous, timezone: event.target.value }))}>
                  <option>UTC-5 (Eastern Time)</option>
                  <option>UTC+1 (Central European Time)</option>
                  <option>UTC+0 (London)</option>
                </SelectBase>
              </Field>
              <Field label="Language">
                <SelectBase value={settings.language} onChange={(event) => setSettings((previous) => ({ ...previous, language: event.target.value }))}>
                  <option>English</option>
                  <option>Polski</option>
                </SelectBase>
              </Field>
            </div>
          </div>
        ) : null}

        {activeTab === "notifications" ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--app-text)]">Notification Preferences</h2>
            <label className="flex items-center justify-between rounded-xl border border-[var(--app-border)] p-4">
              <span className="text-sm font-medium text-[var(--app-text)]">Email alerts</span>
              <input type="checkbox" checked={settings.notifications.email_alerts} onChange={(event) => setSettings((previous) => ({ ...previous, notifications: { ...previous.notifications, email_alerts: event.target.checked } }))} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[var(--app-border)] p-4">
              <span className="text-sm font-medium text-[var(--app-text)]">Push alerts</span>
              <input type="checkbox" checked={settings.notifications.push_alerts} onChange={(event) => setSettings((previous) => ({ ...previous, notifications: { ...previous.notifications, push_alerts: event.target.checked } }))} />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-[var(--app-border)] p-4">
              <span className="text-sm font-medium text-[var(--app-text)]">Task reminders</span>
              <input type="checkbox" checked={settings.notifications.task_reminders} onChange={(event) => setSettings((previous) => ({ ...previous, notifications: { ...previous.notifications, task_reminders: event.target.checked } }))} />
            </label>
          </div>
        ) : null}

        {activeTab === "security" ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--app-text)]">Security Controls</h2>
            <label className="flex items-center justify-between rounded-xl border border-[var(--app-border)] p-4">
              <span className="text-sm font-medium text-[var(--app-text)]">Two-factor authentication</span>
              <input type="checkbox" checked={settings.security.two_factor} onChange={(event) => setSettings((previous) => ({ ...previous, security: { ...previous.security, two_factor: event.target.checked } }))} />
            </label>
            <Field label="Session Timeout">
              <SelectBase value={settings.security.session_timeout} onChange={(event) => setSettings((previous) => ({ ...previous, security: { ...previous.security, session_timeout: event.target.value } }))}>
                <option>15 minutes</option>
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
              </SelectBase>
            </Field>
          </div>
        ) : null}

        {activeTab === "appearance" ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-[var(--app-text)]">Appearance</h2>
            <Field label="Theme mode">
              <SelectBase value={settings.appearance.theme_mode} onChange={(event) => setSettings((previous) => ({ ...previous, appearance: { ...previous.appearance, theme_mode: event.target.value } }))}>
                <option>Light</option>
                <option>Dark</option>
                <option>System</option>
              </SelectBase>
            </Field>
            <Field label="Density">
              <SelectBase value={settings.appearance.density} onChange={(event) => setSettings((previous) => ({ ...previous, appearance: { ...previous.appearance, density: event.target.value } }))}>
                <option>Comfortable</option>
                <option>Compact</option>
              </SelectBase>
            </Field>
          </div>
        ) : null}

        {activeTab === "automation" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-[var(--app-text)]">Scenarios & Auto-reactions</h2>
              <p className="text-sm text-[var(--app-muted)]">Simple wizard, immediate actions only.</p>
            </div>
            {automationLoading ? <div className="text-sm text-[var(--app-muted)]">Loading automation...</div> : null}
            {automationError ? <div className="text-sm text-red-500">{automationError}</div> : null}
            {automationNotice ? <div className="text-sm text-emerald-600 dark:text-emerald-300">{automationNotice}</div> : null}
            {scenarios.map((scenario) => {
              const assignAction = scenario.config.actions.find((action) => action.type === "assign_owner");
              const isSaving = automationSavingId === scenario.id;
              const isTesting = automationTestingId === scenario.id;
              const result = testResults[scenario.id];
              return (
                <div key={scenario.id} className="rounded-xl border border-[var(--app-border)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--app-muted)]">Template</p>
                      <h3 className="text-base font-semibold text-[var(--app-text)]">{scenario.name}</h3>
                      <p className="text-xs text-[var(--app-muted)]">{triggerLabels[scenario.trigger_type] ?? scenario.trigger_type}</p>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-border)] px-3 py-1.5 text-sm text-[var(--app-text)]">
                      <input type="checkbox" checked={scenario.is_active} onChange={(event) => void patchScenario(scenario.id, { is_active: event.target.checked })} />
                      {scenario.is_active ? "Enabled" : "Disabled"}
                    </label>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {conditionKeys.map((key) => (
                      <label key={key} className="inline-flex items-center gap-2 rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm text-[var(--app-text)]">
                        <input type="checkbox" checked={Boolean(scenario.config.conditions?.[key])} onChange={(event) => toggleCondition(scenario, key, event.target.checked)} />
                        {conditionLabels[key]}
                      </label>
                    ))}
                  </div>
                  {assignAction ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <SelectBase value={assignAction.policy ?? "round_robin"} onChange={(event) => updateAssignOwnerPolicy(scenario, event.target.value as "round_robin" | "fixed_owner")}>
                        <option value="round_robin">Round robin</option>
                        <option value="fixed_owner">Fixed owner</option>
                      </SelectBase>
                      <SelectBase value={assignAction.fixed_owner_id ?? ""} disabled={(assignAction.policy ?? "round_robin") !== "fixed_owner"} onChange={(event) => updateAssignOwnerFixed(scenario, event.target.value)}>
                        <option value="">Select owner</option>
                        {teamMembers.map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name}</option>)}
                      </SelectBase>
                    </div>
                  ) : null}
                  <div className="mt-3 rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm text-[var(--app-muted)]">{previewScenario(scenario, teamMembers)}</div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <div className="min-w-[260px]">
                      <LeadSearchSelect
                        value={testLeadUid}
                        selectedLabel={leadOptions.find((lead) => lead.uid === testLeadUid)?.full_name ?? ""}
                        placeholder="Use latest lead"
                        onChange={(leadUid) => setTestLeadUid(leadUid)}
                      />
                    </div>
                    <button onClick={() => void runScenarioTest(scenario.id)} disabled={isSaving || isTesting} className="inline-flex items-center gap-2 rounded-lg bg-[#2D5CFE] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#254be0] disabled:opacity-60">
                      <Play size={14} />
                      {isTesting ? "Testing..." : "Test run"}
                    </button>
                    <button onClick={() => void refreshScenariosOnly()} disabled={isSaving || isTesting} className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-sm text-[var(--app-text)] transition hover:bg-[var(--app-muted-surface)] disabled:opacity-60">
                      Refresh
                    </button>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
                    <div className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-[var(--app-muted)]">
                      Last run: {scenario.last_run ? <><span className={runTone(scenario.last_run.status)}>{scenario.last_run.status}</span> • {new Date(scenario.last_run.created_at).toLocaleString()}{scenario.last_run.error ? ` • ${scenario.last_run.error}` : ""}</> : "No runs yet"}
                    </div>
                    <div className="rounded-lg border border-[var(--app-border)] px-3 py-2 text-[var(--app-muted)]">
                      {result ? <>Dry-run: <span className={runTone(result.status)}>{result.status}</span>{result.reason ? ` • ${result.reason}` : ""}</> : "Dry-run not executed"}
                    </div>
                  </div>
                  {assignAction?.fixed_owner_id ? <div className="mt-2 text-xs text-[var(--app-muted)]">Fixed owner: {teamById.get(assignAction.fixed_owner_id)?.display_name ?? "Unknown owner"}</div> : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {activeTab !== "automation" ? (
          <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2D5CFE] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#254be0] disabled:opacity-60" onClick={() => void saveSettings()} disabled={saving}>
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
