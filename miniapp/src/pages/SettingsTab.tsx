import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { BusinessAutomationSettings, BusinessNotificationSettings } from "../api/auth";
import {
  getBusinessEvents,
  getLeadStatuses,
  getSheetTabs,
  saveLeadStatuses,
  syncSheet,
  updateBusinessAutomationSettings,
  updateBusinessModules,
  updateBusinessNotificationSettings,
  verifySheet,
} from "../api/businesses";
import { SelectField } from "../components/SelectField";
import { Spinner } from "../components/Spinner";
import { canManageTeam } from "../lib/permissions";
import { useAuthStore } from "../store/auth";
import { useBusinessStore } from "../store/business";
import { themeOptions, useThemeStore } from "../store/theme";

type SettingsTabProps = {
  businessId: string;
  businessName: string;
  currentSheetId: string;
  currentSheetTabName: string;
  currentSheetLastSyncedAt: string | null;
  currentEnabledModules: string[];
  currentAutomationSettings?: BusinessAutomationSettings;
  currentNotificationSettings?: BusinessNotificationSettings;
  hasConnectedBuffer: boolean;
  canOpenAdmin: boolean;
  canOpenBilling: boolean;
  currentRole: string;
  currentPermissions: string[];
  onOpenAdmin: () => void;
  onOpenBilling: () => void;
  onOpenMapping: () => void;
};

const DEFAULT_NOTIFICATION_SETTINGS: BusinessNotificationSettings = {
  notifications_enabled: false,
  telegram_internal_enabled: false,
  client_email_enabled: false,
  notify_on: [
    "lead_created",
    "lead_assigned",
    "lead_status_changed",
    "task_created",
    "task_done",
    "task_overdue_detected",
    "inventory_missing_detected",
    "inventory_low_stock_detected",
  ],
  client_email_sender_name: null,
  client_email_reply_to: null,
  client_email_template_key: "new_lead_ack",
};

const DEFAULT_AUTOMATION_SETTINGS: BusinessAutomationSettings = {
  automations_enabled: false,
  assign_new_leads_to_owner: false,
  create_task_on_new_lead: false,
  create_task_for_follow_up_stages: true,
  follow_up_task_title: "Follow up with {lead_name}",
  follow_up_task_deadline_hours: 24,
};

const notificationEventOptions = [
  { value: "lead_created", label: "New lead" },
  { value: "lead_assigned", label: "Lead assigned" },
  { value: "lead_status_changed", label: "Lead status changed" },
  { value: "task_created", label: "Task created" },
  { value: "task_done", label: "Task completed" },
  { value: "task_overdue_detected", label: "Task overdue" },
  { value: "inventory_missing_detected", label: "Missing inventory" },
  { value: "inventory_low_stock_detected", label: "Low stock" },
  { value: "recurring_plan_due", label: "Recurring due" },
];

type StatusRow = {
  id?: string;
  name: string;
  color: string;
  position: number;
  is_default?: boolean;
  is_won?: boolean;
  is_lost?: boolean;
  requires_follow_up?: boolean;
  hide_from_active?: boolean;
};

function formatReasonLabel(reason: string) {
  return reason.split("_").join(" ");
}

export function SettingsTab({
  businessId,
  businessName,
  currentSheetId,
  currentSheetTabName,
  currentSheetLastSyncedAt,
  currentEnabledModules,
  currentAutomationSettings,
  currentNotificationSettings,
  hasConnectedBuffer,
  canOpenAdmin,
  canOpenBilling,
  currentRole,
  currentPermissions,
  onOpenAdmin,
  onOpenBilling,
  onOpenMapping,
}: SettingsTabProps) {
  const token = useAuthStore((state) => state.token);
  const updateBusinessSheetStatus = useBusinessStore((state) => state.updateBusinessSheetStatus);
  const updateBusinessSyncStatus = useBusinessStore((state) => state.updateBusinessSyncStatus);
  const updateBusinessModulesState = useBusinessStore((state) => state.updateBusinessModules);
  const updateBusinessAutomationSettingsState = useBusinessStore((state) => state.updateBusinessAutomationSettings);
  const updateBusinessNotificationSettingsState = useBusinessStore((state) => state.updateBusinessNotificationSettings);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const queryClient = useQueryClient();
  const [sheetId, setSheetId] = useState(currentSheetId);
  const [sheetMessage, setSheetMessage] = useState(
    hasConnectedBuffer ? "Google Sheet connected and ready." : "Paste a Google Sheet ID to load tabs.",
  );
  const [sheetTitle, setSheetTitle] = useState("");
  const [sheetTabName, setSheetTabName] = useState(hasConnectedBuffer ? currentSheetTabName : "");
  const [availableTabs, setAvailableTabs] = useState<string[]>(
    currentSheetTabName ? [currentSheetTabName] : [],
  );
  const [syncSummary, setSyncSummary] = useState<string | null>(null);
  const [syncReasonLines, setSyncReasonLines] = useState<string[]>([]);
  const [moduleMessage, setModuleMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingModules, setIsSavingModules] = useState(false);
  const [isBusinessModalOpen, setIsBusinessModalOpen] = useState(false);
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);
  const [enabledModules, setEnabledModules] = useState<string[]>(currentEnabledModules);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSavingStatuses, setIsSavingStatuses] = useState(false);
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [automationSettings, setAutomationSettings] = useState<BusinessAutomationSettings>(
    currentAutomationSettings ?? DEFAULT_AUTOMATION_SETTINGS,
  );
  const [automationMessage, setAutomationMessage] = useState<string | null>(null);
  const [isSavingAutomations, setIsSavingAutomations] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<BusinessNotificationSettings>(
    currentNotificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const canManageStatusFlow = canManageTeam(currentRole, currentPermissions);

  const leadStatusesQuery = useQuery({
    queryKey: ["lead-statuses", businessId],
    queryFn: async () => (await getLeadStatuses(businessId, token)).items,
    enabled: Boolean(businessId && token),
  });
  const businessEventsQuery = useQuery({
    queryKey: ["business-events", businessId],
    queryFn: async () => (await getBusinessEvents(businessId, token, { limit: 12 })).items,
    enabled: Boolean(businessId && token && canManageStatusFlow),
  });

  useEffect(() => {
    setSheetId(currentSheetId);
    setSheetTabName(hasConnectedBuffer ? currentSheetTabName : "");
    setAvailableTabs(currentSheetTabName ? [currentSheetTabName] : []);
    if (currentSheetLastSyncedAt) {
      setSyncSummary(`Last sync completed on ${new Date(currentSheetLastSyncedAt).toLocaleString("en-GB")}.`);
    } else {
      setSyncSummary(null);
    }
    setSyncReasonLines([]);
  }, [currentSheetId, currentSheetTabName, currentSheetLastSyncedAt, hasConnectedBuffer]);

  useEffect(() => {
    setEnabledModules(currentEnabledModules);
  }, [currentEnabledModules]);

  useEffect(() => {
    setAutomationSettings(currentAutomationSettings ?? DEFAULT_AUTOMATION_SETTINGS);
  }, [currentAutomationSettings]);

  useEffect(() => {
    setNotificationSettings(currentNotificationSettings ?? DEFAULT_NOTIFICATION_SETTINGS);
  }, [currentNotificationSettings]);

  useEffect(() => {
    if (!leadStatusesQuery.data) {
      return;
    }
    setStatusRows(
      leadStatusesQuery.data.map((item) => ({
        id: item.id,
        name: item.name,
        color: item.color,
        position: item.position,
        is_default: item.is_default,
        is_won: item.is_won,
        is_lost: item.is_lost,
        requires_follow_up: item.requires_follow_up,
        hide_from_active: item.hide_from_active,
      })),
    );
  }, [leadStatusesQuery.data]);

  const fetchSheetTabs = useCallback(
    async (nextSheetId: string, options?: { silent?: boolean }) => {
      if (!businessId || !token || !nextSheetId.trim()) {
        return;
      }

      try {
        const response = await getSheetTabs(businessId, nextSheetId.trim(), token);
        setSheetTitle(response.sheet_title ?? "");
        setAvailableTabs(response.available_tabs);
        setSheetTabName(response.selected_tab_name ?? response.available_tabs[0] ?? "");
        if (!options?.silent) {
          setSheetMessage(
            response.available_tabs.length > 0
              ? "Tabs loaded. Choose the tab you want to use."
              : "No tabs were found in this Google Sheet.",
          );
        }
      } catch {
        setAvailableTabs([]);
        setSheetTabName("");
        if (!options?.silent) {
          setSheetMessage("Could not load tabs. Check Sheet ID and sharing permissions.");
        }
      }
    },
    [businessId, token],
  );

  useEffect(() => {
    if (!sheetId.trim() || !token || !businessId) {
      setAvailableTabs([]);
      if (!sheetId.trim()) {
        setSheetTitle("");
        setSheetTabName("");
        setSyncSummary(null);
        setSyncReasonLines([]);
      }
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void fetchSheetTabs(sheetId, { silent: true });
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [businessId, fetchSheetTabs, sheetId, token]);

  async function handlePrimaryAction() {
    if (!sheetId.trim()) {
      setSheetMessage("Paste Google Sheet ID first.");
      return;
    }

    if (availableTabs.length === 0) {
      await fetchSheetTabs(sheetId);
      return;
    }

    try {
      setIsVerifying(true);
      const result = await verifySheet(
        businessId,
        sheetId.trim(),
        sheetTabName || undefined,
        token,
      );
      updateBusinessSheetStatus(
        businessId,
        sheetId.trim(),
        result.verified,
        result.selected_tab_name,
      );
      setSheetTitle(result.sheet_title ?? "");
      setAvailableTabs(result.available_tabs);
      setSheetTabName(result.selected_tab_name ?? result.available_tabs[0] ?? "");
      setSheetMessage(result.message);
      setSyncSummary(null);
      setSyncReasonLines([]);
    } catch {
      setSheetMessage("Could not connect this Google Sheet. Check access and Sheet ID.");
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleSyncSheet() {
    if (!businessId || !token) {
      return;
    }

    try {
      setIsSyncing(true);
      const result = await syncSheet(businessId, token);
      updateBusinessSyncStatus(businessId, result.sheet_last_synced_at ?? null);
      await queryClient.invalidateQueries({ queryKey: ["leads", businessId] });
      setSyncSummary(
        `${result.message} Processed ${result.rows_processed} rows, imported ${result.created_count}, updated ${result.updated_count}, skipped ${result.skipped_count}.`,
      );
      setSyncReasonLines(
        Object.entries(result.skipped_reasons).map(
          ([reason, count]) => `${count} x ${formatReasonLabel(reason)}`,
        ),
      );
      setSheetMessage("Sync completed. New leads should now be visible in Leads.");
    } catch {
      setSheetMessage("Sync failed. Check mapping, sheet access, and backend logs.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleToggleInventory() {
    const nextModules = enabledModules.includes("inventory")
      ? enabledModules.filter((moduleName) => moduleName !== "inventory")
      : [...enabledModules, "inventory"];

    try {
      setIsSavingModules(true);
      const updated = await updateBusinessModules(businessId, nextModules, token);
      const updatedModules = updated.enabled_modules ?? [];
      setEnabledModules(updatedModules);
      updateBusinessModulesState(businessId, updatedModules);
      setModuleMessage(
        updatedModules.includes("inventory")
          ? "Inventory module enabled for this business."
          : "Inventory module disabled for this business.",
      );
    } catch {
      setModuleMessage("Could not update business modules.");
    } finally {
      setIsSavingModules(false);
    }
  }

  function updateStatusRow(index: number, field: keyof StatusRow, value: string | number | boolean) {
    setStatusRows((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    );
  }

  function addStatusRow() {
    setStatusRows((current) => [
      ...current,
      {
        name: "",
        color: "#6dc7ff",
        position: current.length,
        is_default: false,
        is_won: false,
        is_lost: false,
        requires_follow_up: false,
        hide_from_active: false,
      },
    ]);
  }

  function removeStatusRow(index: number) {
    setStatusRows((current) => current.filter((_, rowIndex) => rowIndex !== index).map((row, rowIndex) => ({
      ...row,
      position: rowIndex,
    })));
  }

  async function handleSaveStatuses() {
    const cleaned = statusRows
      .map((row, index) => ({
        ...row,
        name: row.name.trim(),
        position: index,
      }))
      .filter((row) => row.name);

    if (cleaned.length === 0) {
      setStatusMessage("Keep at least one lead status.");
      return;
    }

    try {
      setIsSavingStatuses(true);
      const result = await saveLeadStatuses(
        businessId,
        cleaned.map((row) => ({
          id: row.id ?? null,
          name: row.name,
          color: row.color,
          position: row.position,
          is_default: row.is_default ?? false,
          is_won: row.is_won ?? false,
          is_lost: row.is_lost ?? false,
          requires_follow_up: row.requires_follow_up ?? false,
          hide_from_active: row.hide_from_active ?? false,
        })),
        token,
      );
      setStatusRows(
        result.items.map((item) => ({
          id: item.id,
          name: item.name,
          color: item.color,
          position: item.position,
          is_default: item.is_default,
          is_won: item.is_won,
          is_lost: item.is_lost,
          requires_follow_up: item.requires_follow_up,
          hide_from_active: item.hide_from_active,
        })),
      );
      setStatusMessage("Lead stages saved.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["lead-statuses", businessId] }),
        queryClient.invalidateQueries({ queryKey: ["leads", businessId] }),
      ]);
    } catch {
      setStatusMessage("Could not save lead stages.");
    } finally {
      setIsSavingStatuses(false);
    }
  }

  function toggleNotifyOn(eventType: string) {
    setNotificationSettings((current) => {
      const next = current.notify_on.includes(eventType)
        ? current.notify_on.filter((value) => value !== eventType)
        : [...current.notify_on, eventType];
      return { ...current, notify_on: next };
    });
  }

  async function handleSaveNotifications() {
    try {
      setIsSavingNotifications(true);
      const updated = await updateBusinessNotificationSettings(businessId, notificationSettings, token);
      updateBusinessNotificationSettingsState(businessId, updated.notification_settings);
      setNotificationSettings(updated.notification_settings);
      setNotificationMessage("Notification settings saved.");
      await businessEventsQuery.refetch();
    } catch {
      setNotificationMessage("Could not save notification settings.");
    } finally {
      setIsSavingNotifications(false);
    }
  }

  async function handleSaveAutomations() {
    try {
      setIsSavingAutomations(true);
      const updated = await updateBusinessAutomationSettings(businessId, automationSettings, token);
      updateBusinessAutomationSettingsState(businessId, updated.automation_settings);
      setAutomationSettings(updated.automation_settings);
      setAutomationMessage("Automation rules saved.");
    } catch {
      setAutomationMessage("Could not save automation rules.");
    } finally {
      setIsSavingAutomations(false);
    }
  }

  function formatEventLabel(eventType: string) {
    return eventType.split("_").join(" ");
  }

  const tabOptions = availableTabs.map((tab) => ({
    value: tab,
    label: tab,
  }));
  const primaryLabel = isVerifying
    ? "Connecting..."
    : availableTabs.length > 0
      ? "Connect sheet"
      : "Load tabs";

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <span className="section-heading__eyebrow">{businessName}</span>
          <h2>Settings</h2>
          <p className="section-heading__support">Keep your lead flow, sheet sync, and optional tools under control.</p>
        </div>
      </div>

      <div className="stack-list">
        <article className="panel settings-panel">
          <div>
            <h3>Google Sheet</h3>
            <p>Connect one sheet, map its columns, and sync leads into Barowo.</p>
            <p className="settings-status">{sheetMessage}</p>
            {sheetTitle ? <p className="settings-status">Connected sheet: {sheetTitle}</p> : null}
            {sheetTabName ? <p className="settings-status">Selected tab: {sheetTabName}</p> : null}
            {syncSummary ? <p className="settings-status">{syncSummary}</p> : null}
            {syncReasonLines.length > 0 ? (
              <div className="sync-report">
                {syncReasonLines.map((line) => (
                  <p key={line} className="settings-status">
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
          <div className="toggle-group">
            <button type="button" className="ghost-button" onClick={() => setIsBusinessModalOpen(true)}>
              Open sheet setup
            </button>
            {hasConnectedBuffer && sheetTabName ? (
              <button type="button" className="ghost-button" onClick={onOpenMapping}>
                Open mapping
              </button>
            ) : null}
            {hasConnectedBuffer ? (
              <button type="button" className="ghost-button" onClick={handleSyncSheet} disabled={isSyncing}>
                {isSyncing ? "Syncing..." : "Sync now"}
              </button>
            ) : null}
          </div>
        </article>

        <article className="panel settings-panel">
          <div>
            <h3>Modules</h3>
            <p>Turn on extra tools only when they really help this business.</p>
            {moduleMessage ? <p className="settings-status">{moduleMessage}</p> : null}
          </div>
          <div className="settings-actions">
            <div className="panel panel--subtle">
              <div className="activity-item__topline">
                <strong>Inventory</strong>
                <span className={`chip${enabledModules.includes("inventory") ? " chip--active" : ""}`}>
                  {enabledModules.includes("inventory") ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p>Track stock items, low-stock warnings, and stock in / stock out movements.</p>
              <div className="toggle-group">
                <button type="button" className="ghost-button" onClick={() => void handleToggleInventory()} disabled={isSavingModules}>
                  {isSavingModules
                    ? "Saving..."
                    : enabledModules.includes("inventory")
                      ? "Disable inventory"
                      : "Enable inventory"}
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="panel settings-panel">
          <div>
            <h3>Lead stages</h3>
            <p>Name your stages and define what counts as won, lost, or follow-up.</p>
            {leadStatusesQuery.isLoading ? <p className="settings-status">Loading stages...</p> : null}
            {statusMessage ? <p className="settings-status">{statusMessage}</p> : null}
          </div>
          <div className="toggle-group">
            <span className="lead-card__tag">{statusRows.length} stages</span>
            <button type="button" className="ghost-button" onClick={() => setIsPipelineModalOpen(true)}>
              {canManageStatusFlow ? "Manage pipeline" : "View pipeline"}
            </button>
          </div>
        </article>

        <article className="panel settings-panel">
          <div>
            <h3>Theme</h3>
          </div>
          <div className="mode-grid mode-grid--compact">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`mode-card${theme === option.id ? " mode-card--active" : ""}`}
                onClick={() => setTheme(option.id)}
              >
                <strong>{option.name}</strong>
              </button>
            ))}
          </div>
        </article>

        <article className="panel settings-panel">
          <div>
            <h3>Automation rules</h3>
            <p>Let the system react to key lead events without waiting for the future bot layer.</p>
            {automationMessage ? <p className="settings-status">{automationMessage}</p> : null}
          </div>
          <div className="settings-actions settings-actions--wide">
            <div className="stack-list stack-list--tight">
              <label className="permission-check">
                <input
                  type="checkbox"
                  checked={automationSettings.automations_enabled}
                  onChange={(event) =>
                    setAutomationSettings((current) => ({
                      ...current,
                      automations_enabled: event.target.checked,
                    }))
                  }
                  disabled={!canManageStatusFlow}
                />
                <div>
                  <strong>Enable automation rules</strong>
                  <span>Without this, events are logged but no auto-actions are executed.</span>
                </div>
              </label>
              <label className="permission-check">
                <input
                  type="checkbox"
                  checked={automationSettings.assign_new_leads_to_owner}
                  onChange={(event) =>
                    setAutomationSettings((current) => ({
                      ...current,
                      assign_new_leads_to_owner: event.target.checked,
                    }))
                  }
                  disabled={!canManageStatusFlow}
                />
                <div>
                  <strong>Assign new leads to owner</strong>
                  <span>Fresh leads stop staying unassigned when no one has claimed them yet.</span>
                </div>
              </label>
              <label className="permission-check">
                <input
                  type="checkbox"
                  checked={automationSettings.create_task_on_new_lead}
                  onChange={(event) =>
                    setAutomationSettings((current) => ({
                      ...current,
                      create_task_on_new_lead: event.target.checked,
                    }))
                  }
                  disabled={!canManageStatusFlow}
                />
                <div>
                  <strong>Create task on new lead</strong>
                  <span>Useful when every new lead needs a first touch or booking follow-up.</span>
                </div>
              </label>
              <label className="permission-check">
                <input
                  type="checkbox"
                  checked={automationSettings.create_task_for_follow_up_stages}
                  onChange={(event) =>
                    setAutomationSettings((current) => ({
                      ...current,
                      create_task_for_follow_up_stages: event.target.checked,
                    }))
                  }
                  disabled={!canManageStatusFlow}
                />
                <div>
                  <strong>Create task for follow-up stages</strong>
                  <span>If a lead enters a follow-up stage without any open task, Barowo creates one.</span>
                </div>
              </label>
            </div>

            <label className="input-field">
              <span className="select-field__label">Task title template</span>
              <input
                className="input-field__control"
                value={automationSettings.follow_up_task_title}
                onChange={(event) =>
                  setAutomationSettings((current) => ({
                    ...current,
                    follow_up_task_title: event.target.value,
                  }))
                }
                placeholder="Follow up with {lead_name}"
                disabled={!canManageStatusFlow}
              />
            </label>

            <label className="input-field">
              <span className="select-field__label">Task deadline in hours</span>
              <input
                type="number"
                min={1}
                className="input-field__control"
                value={automationSettings.follow_up_task_deadline_hours}
                onChange={(event) =>
                  setAutomationSettings((current) => ({
                    ...current,
                    follow_up_task_deadline_hours: Number(event.target.value) || 24,
                  }))
                }
                disabled={!canManageStatusFlow}
              />
            </label>

            {canManageStatusFlow ? (
              <div className="toggle-group">
                <button type="button" className="primary-button" onClick={handleSaveAutomations} disabled={isSavingAutomations}>
                  {isSavingAutomations ? "Saving..." : "Save automation rules"}
                </button>
              </div>
            ) : (
              <span className="lead-card__tag">Owner/Admin only</span>
            )}
          </div>
        </article>

        <article className="panel settings-panel">
          <div>
            <h3>Notifications</h3>
            <p>Prepare the events layer before Telegram delivery and client email go live.</p>
            {notificationMessage ? <p className="settings-status">{notificationMessage}</p> : null}
          </div>
          <div className="settings-actions settings-actions--wide">
            <div className="stack-list stack-list--tight">
              <label className="permission-check">
                <input
                  type="checkbox"
                  checked={notificationSettings.notifications_enabled}
                  onChange={(event) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      notifications_enabled: event.target.checked,
                    }))
                  }
                  disabled={!canManageStatusFlow}
                />
                <div>
                  <strong>Enable event notifications</strong>
                  <span>Keep this on when you want new business events to be ready for delivery.</span>
                </div>
              </label>
              <label className="permission-check">
                <input
                  type="checkbox"
                  checked={notificationSettings.telegram_internal_enabled}
                  onChange={(event) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      telegram_internal_enabled: event.target.checked,
                    }))
                  }
                  disabled={!canManageStatusFlow}
                />
                <div>
                  <strong>Telegram for team</strong>
                  <span>Foundation is ready. Delivery stays dormant until the bot flow is turned on.</span>
                </div>
              </label>
              <label className="permission-check">
                <input
                  type="checkbox"
                  checked={notificationSettings.client_email_enabled}
                  onChange={(event) =>
                    setNotificationSettings((current) => ({
                      ...current,
                      client_email_enabled: event.target.checked,
                    }))
                  }
                  disabled={!canManageStatusFlow}
                />
                <div>
                  <strong>Client email foundation</strong>
                  <span>Email stays disabled by runtime policy for now, but the setting is already stored.</span>
                </div>
              </label>
            </div>

            <div className="mode-grid mode-grid--compact">
              {notificationEventOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`ghost-button${notificationSettings.notify_on.includes(option.value) ? " ghost-button--active" : ""}`}
                  onClick={() => toggleNotifyOn(option.value)}
                  disabled={!canManageStatusFlow}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {canManageStatusFlow ? (
              <div className="toggle-group">
                <button type="button" className="primary-button" onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                  {isSavingNotifications ? "Saving..." : "Save notification settings"}
                </button>
              </div>
            ) : (
              <span className="lead-card__tag">Owner/Admin only</span>
            )}
          </div>
        </article>

        <article className="panel settings-panel">
          <div>
            <h3>Recent events</h3>
            <p>Watch the new event foundation capture lead, task, inventory, and money activity in one place.</p>
          </div>
          <div className="stack-list stack-list--tight">
            {!canManageStatusFlow ? (
              <span className="lead-card__tag">Owner/Admin only</span>
            ) : businessEventsQuery.isLoading ? (
              <p className="settings-status">Loading recent events...</p>
            ) : businessEventsQuery.data?.length ? (
              businessEventsQuery.data.map((event) => (
                <div key={event.id} className="panel panel--subtle">
                  <div className="activity-item__topline">
                    <strong>{formatEventLabel(event.event_type)}</strong>
                    <span className="lead-card__tag">{new Date(event.created_at).toLocaleString("en-GB")}</span>
                  </div>
                  <p className="settings-status">
                    {typeof event.payload?.lead === "object" && event.payload?.lead && "uid" in event.payload.lead
                      ? `Lead ${(event.payload.lead as { uid?: string }).uid ?? ""}`
                      : typeof event.payload?.task === "object" && event.payload?.task && "title" in event.payload.task
                        ? (event.payload.task as { title?: string }).title ?? "Task event"
                        : typeof event.payload?.template === "object" && event.payload?.template && "name" in event.payload.template
                          ? `Template ${(event.payload.template as { name?: string }).name ?? ""}`
                          : "Business event"}
                  </p>
                  <p className="settings-status">Delivery state: {event.delivery_state}</p>
                </div>
              ))
            ) : (
              <p className="settings-status">No business events have been logged yet.</p>
            )}
          </div>
        </article>

        <article className="panel settings-panel">
          <div>
            <h3>Subscription</h3>
            <p>Open plan details, usage, and billing history in a separate screen.</p>
          </div>
          {canOpenBilling ? (
            <button type="button" className="primary-button" onClick={onOpenBilling}>
              Open subscription
            </button>
          ) : (
            <span className="lead-card__tag">Owner-only</span>
          )}
        </article>

        <article className="panel settings-panel panel--subtle">
          <div>
            <h3>More settings later</h3>
            <p>Language and document templates will land here when the workflow around them is ready.</p>
          </div>
          <span className="lead-card__tag">Coming later</span>
        </article>

        {canOpenAdmin && (
          <article className="panel settings-panel">
            <div>
              <h3>Admin panel</h3>
              <p>View registered users, inspect account state, and manually intervene if needed.</p>
            </div>
            <button type="button" className="primary-button" onClick={onOpenAdmin}>
              Open admin
            </button>
          </article>
        )}
      </div>

      {isPipelineModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>Lead stages</h3>
                <p>These stages are used across the lead list, lead cards, and filters.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setIsPipelineModalOpen(false)}>
                Close
              </button>
            </div>
            {leadStatusesQuery.isLoading ? <p className="settings-status">Loading stages...</p> : null}
            {statusMessage ? <p className="settings-status">{statusMessage}</p> : null}
            <div className="settings-actions settings-actions--wide">
              <div className="stack-list stack-list--tight">
                {statusRows.map((row, index) => (
                  <div key={row.id ?? `status-${index}`} className="status-editor-row">
                    <label className="input-field">
                      <span className="select-field__label">Stage name</span>
                      <input
                        className="input-field__control"
                        value={row.name}
                        onChange={(event) => updateStatusRow(index, "name", event.target.value)}
                        placeholder="Fresh lead"
                        disabled={!canManageStatusFlow}
                      />
                    </label>
                    <label className="input-field">
                      <span className="select-field__label">Color</span>
                      <input
                        type="color"
                        className="input-field__control"
                        value={row.color}
                        onChange={(event) => updateStatusRow(index, "color", event.target.value)}
                        disabled={!canManageStatusFlow}
                      />
                    </label>
                    <div className="status-editor-row__toggles">
                      <label className="permission-check">
                        <input
                          type="checkbox"
                          checked={Boolean(row.requires_follow_up)}
                          onChange={(event) => updateStatusRow(index, "requires_follow_up", event.target.checked)}
                          disabled={!canManageStatusFlow}
                        />
                        <div>
                          <strong>Needs follow-up</strong>
                          <span>Use this stage when the team should leave at least one next task.</span>
                        </div>
                      </label>
                      <label className="permission-check">
                        <input
                          type="checkbox"
                          checked={Boolean(row.is_won)}
                          onChange={(event) => {
                            updateStatusRow(index, "is_won", event.target.checked);
                            if (event.target.checked) {
                              updateStatusRow(index, "is_lost", false);
                              updateStatusRow(index, "hide_from_active", true);
                            }
                          }}
                          disabled={!canManageStatusFlow}
                        />
                        <div>
                          <strong>Won stage</strong>
                          <span>This stage should count as a successful close.</span>
                        </div>
                      </label>
                      <label className="permission-check">
                        <input
                          type="checkbox"
                          checked={Boolean(row.is_lost)}
                          onChange={(event) => {
                            updateStatusRow(index, "is_lost", event.target.checked);
                            if (event.target.checked) {
                              updateStatusRow(index, "is_won", false);
                              updateStatusRow(index, "hide_from_active", true);
                            }
                          }}
                          disabled={!canManageStatusFlow}
                        />
                        <div>
                          <strong>Lost stage</strong>
                          <span>This stage should close the lead as unsuccessful.</span>
                        </div>
                      </label>
                      <label className="permission-check">
                        <input
                          type="checkbox"
                          checked={Boolean(row.hide_from_active)}
                          onChange={(event) => updateStatusRow(index, "hide_from_active", event.target.checked)}
                          disabled={!canManageStatusFlow}
                        />
                        <div>
                          <strong>Hide from active pipeline</strong>
                          <span>Use this for closed stages that should drop out of active work views.</span>
                        </div>
                      </label>
                    </div>
                    {canManageStatusFlow ? (
                      <button type="button" className="ghost-button" onClick={() => removeStatusRow(index)}>
                        Remove
                      </button>
                    ) : (
                      <span className="lead-card__tag">Read only</span>
                    )}
                  </div>
                ))}
              </div>
              {canManageStatusFlow ? (
                <div className="toggle-group">
                  <button type="button" className="ghost-button" onClick={addStatusRow}>
                    Add stage
                  </button>
                  <button type="button" className="primary-button" onClick={handleSaveStatuses} disabled={isSavingStatuses}>
                    {isSavingStatuses ? "Saving..." : "Save stages"}
                  </button>
                </div>
              ) : (
                <span className="lead-card__tag">Owner/Admin only</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {isBusinessModalOpen ? (
        <div className="modal-shell" role="dialog" aria-modal="true">
          <div className="modal-card lead-detail__details-modal">
            <div className="lead-detail__section-heading">
              <div>
                <h3>Google Sheet</h3>
                <p>Paste a sheet ID, pick the right tab, then connect it to your leads flow.</p>
              </div>
              <button type="button" className="ghost-button" onClick={() => setIsBusinessModalOpen(false)}>
                Close
              </button>
            </div>

            <label className="input-field settings-actions__input">
              <span className="select-field__label">Google Sheet ID</span>
              <input
                className="input-field__control"
                value={sheetId}
                onChange={(event) => setSheetId(event.target.value)}
                placeholder="1AbCdEfGh..."
              />
            </label>

            {availableTabs.length > 0 ? (
              <SelectField
                label="Sheet tab"
                value={sheetTabName || availableTabs[0]}
                onChange={setSheetTabName}
                options={tabOptions}
                presentation="sheet"
                searchable
                searchPlaceholder="Search sheet tabs..."
              />
            ) : null}

            {isVerifying ? <Spinner label="Connecting Google Sheet..." /> : null}
            {isSyncing ? <Spinner label="Syncing leads from Google Sheet..." /> : null}

            <div className="toggle-group">
              <button
                type="button"
                className="primary-button"
                onClick={handlePrimaryAction}
                disabled={isVerifying}
              >
                {primaryLabel}
              </button>
              {hasConnectedBuffer && sheetTabName ? (
                <button type="button" className="ghost-button" onClick={onOpenMapping}>
                  Configure mapping
                </button>
              ) : null}
              {hasConnectedBuffer ? (
                <button type="button" className="ghost-button" onClick={handleSyncSheet} disabled={isSyncing}>
                  {isSyncing ? "Syncing..." : "Sync leads now"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
