import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  clearTelegramWebhook,
  getAdminUsers,
  getSystemReadiness,
  getTelegramBotStatus,
  syncTelegramBotSetup,
  syncTelegramCommands,
  syncTelegramWebhook,
  type TelegramBotActionResponse,
} from "../api/admin";
import { useAuthStore } from "../store/auth";

type AdminPageProps = {
  onClose: () => void;
};

function formatUserName(user: {
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  telegram_id: number;
}) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username || `Telegram ${user.telegram_id}`;
}

export function AdminPage({ onClose }: AdminPageProps) {
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await getAdminUsers(token)).items,
    enabled: Boolean(token),
  });

  const botStatusQuery = useQuery({
    queryKey: ["admin-telegram-status"],
    queryFn: async () => getTelegramBotStatus(token),
    enabled: Boolean(token),
  });

  const readinessQuery = useQuery({
    queryKey: ["admin-system-readiness"],
    queryFn: async () => getSystemReadiness(token),
    enabled: Boolean(token),
  });

  const actionMutation = useMutation({
    mutationFn: async (
      action: "setup" | "webhook" | "commands" | "clear",
    ): Promise<TelegramBotActionResponse> => {
      if (action === "setup") {
        return syncTelegramBotSetup(token);
      }
      if (action === "webhook") {
        return syncTelegramWebhook(token);
      }
      if (action === "commands") {
        return syncTelegramCommands(token);
      }
      return clearTelegramWebhook(token);
    },
    onSuccess: async (result) => {
      setActionMessage(result.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-telegram-status"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
      ]);
    },
    onError: () => {
      setActionMessage("Telegram admin action failed.");
    },
  });

  const botStatus = botStatusQuery.data;

  return (
    <section className="page">
      <div className="section-heading">
        <div>
          <span className="section-heading__eyebrow">Internal control room</span>
          <h2>Admin</h2>
          <p className="section-heading__support">Manage Telegram bot setup and inspect who is using Barowo.</p>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Back
        </button>
      </div>

      <div className="stack-list">
        <article className="panel settings-panel">
          <div className="admin-toolbar">
            <div>
              <h3>System readiness</h3>
              <p>Check whether the current environment is safe enough for real usage.</p>
            </div>
            <div className="toggle-group">
              <button
                type="button"
                className="ghost-button"
                onClick={() => readinessQuery.refetch()}
                disabled={readinessQuery.isFetching}
              >
                {readinessQuery.isFetching ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {readinessQuery.isLoading ? (
            <p className="settings-status">Loading system readiness...</p>
          ) : readinessQuery.data ? (
            <div className="stack-list stack-list--tight">
              <div className="activity-item__topline">
                <strong>Overall</strong>
                <span
                  className={`chip${
                    readinessQuery.data.status === "ok"
                      ? " chip--active"
                      : readinessQuery.data.status === "warn"
                        ? " chip--warning"
                        : ""
                  }`}
                >
                  {readinessQuery.data.status}
                </span>
              </div>
              <p className="settings-status">
                Environment: {readinessQuery.data.environment} · Base URL: {readinessQuery.data.base_url || "missing"}
              </p>
              <div className="stack-list stack-list--tight">
                {readinessQuery.data.checks.map((check) => (
                  <div key={check.name} className="panel panel--subtle">
                    <div className="activity-item__topline">
                      <strong>{check.name.split("_").join(" ")}</strong>
                      <span
                        className={`chip${
                          check.status === "ok" ? " chip--active" : check.status === "warn" ? " chip--warning" : ""
                        }`}
                      >
                        {check.status}
                      </span>
                    </div>
                    <p className="settings-status">{check.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="settings-status">System readiness is unavailable.</p>
          )}
        </article>

        <article className="panel settings-panel">
          <div className="admin-toolbar">
            <div>
              <h3>Telegram bot</h3>
              <p>Sync webhook, commands, and Mini App entry point from one place.</p>
              {actionMessage ? <p className="settings-status">{actionMessage}</p> : null}
              {botStatus?.recommended_next_step ? (
                <p className="settings-status">Next step: {botStatus.recommended_next_step}</p>
              ) : null}
            </div>
            <div className="toggle-group">
              <button
                type="button"
                className="ghost-button"
                onClick={() => botStatusQuery.refetch()}
                disabled={botStatusQuery.isFetching}
              >
                {botStatusQuery.isFetching ? "Refreshing..." : "Refresh"}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => actionMutation.mutate("setup")}
                disabled={actionMutation.isPending}
              >
                {actionMutation.isPending ? "Syncing..." : "Sync full setup"}
              </button>
            </div>
          </div>

          {botStatusQuery.isLoading ? (
            <p className="settings-status">Loading Telegram bot status...</p>
          ) : botStatus ? (
            <div className="stack-list stack-list--tight">
              <div className="admin-status-grid">
                <div className="panel panel--subtle">
                  <div className="activity-item__topline">
                    <strong>Bot</strong>
                    <span className={`chip${botStatus.configured ? " chip--active" : ""}`}>
                      {botStatus.configured ? "Connected" : "Missing token"}
                    </span>
                  </div>
                  <p className="settings-status">
                    {botStatus.bot_username ? `@${botStatus.bot_username}` : "Bot identity not available yet."}
                  </p>
                </div>

                <div className="panel panel--subtle">
                  <div className="activity-item__topline">
                    <strong>Webhook</strong>
                    <span className={`chip${botStatus.webhook_matches_expected ? " chip--active" : ""}`}>
                      {botStatus.webhook_matches_expected ? "Synced" : "Needs sync"}
                    </span>
                  </div>
                  <p className="settings-status">{botStatus.webhook_url || "No webhook set yet."}</p>
                </div>

                <div className="panel panel--subtle">
                  <div className="activity-item__topline">
                    <strong>Commands</strong>
                    <span className={`chip${botStatus.commands_match_expected ? " chip--active" : ""}`}>
                      {botStatus.commands_match_expected ? "Ready" : "Needs sync"}
                    </span>
                  </div>
                  <p className="settings-status">{botStatus.commands_count} command(s) registered.</p>
                </div>

                <div className="panel panel--subtle">
                  <div className="activity-item__topline">
                    <strong>Mini App button</strong>
                    <span className={`chip${botStatus.menu_button_matches_expected ? " chip--active" : ""}`}>
                      {botStatus.menu_button_matches_expected ? "Ready" : "Needs sync"}
                    </span>
                  </div>
                  <p className="settings-status">
                    {botStatus.mini_app_configured
                      ? botStatus.mini_app_url
                      : "MINI_APP_URL is not configured yet."}
                  </p>
                </div>
              </div>

              <div className="stack-list stack-list--tight">
                <p className="settings-status">
                  Base URL: {botStatus.base_url || "Missing"} · {botStatus.base_url_public ? "public HTTPS" : "not public"}
                </p>
                <p className="settings-status">
                  Pending updates: {botStatus.pending_update_count}
                  {botStatus.webhook_has_secret ? " · secret protected" : " · no webhook secret"}
                </p>
                {botStatus.last_error_message ? (
                  <p className="settings-status">Last Telegram error: {botStatus.last_error_message}</p>
                ) : null}
              </div>

              <div className="toggle-group">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => actionMutation.mutate("webhook")}
                  disabled={actionMutation.isPending}
                >
                  Sync webhook
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => actionMutation.mutate("commands")}
                  disabled={actionMutation.isPending}
                >
                  Sync commands
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => actionMutation.mutate("clear")}
                  disabled={actionMutation.isPending}
                >
                  Clear webhook
                </button>
              </div>
            </div>
          ) : (
            <p className="settings-status">Telegram bot status is unavailable.</p>
          )}
        </article>

        <article className="panel">
          <div className="admin-toolbar">
            <div>
              <h3>Registered users</h3>
              <p>Support lookup, role review, and workspace adoption in one place.</p>
            </div>
          </div>

          <div className="stack-list">
            {usersQuery.isLoading ? (
              <p className="settings-status">Loading registered users...</p>
            ) : usersQuery.data?.length ? (
              usersQuery.data.map((user) => (
                <article key={user.id} className="panel panel--subtle">
                  <div className="admin-user__header">
                    <div>
                      <h3>{formatUserName(user)}</h3>
                      <p>
                        {user.username ? `${user.username} · ` : ""}
                        TG {user.telegram_id}
                      </p>
                    </div>
                    <span className={user.businesses_count > 0 ? "status-pill status-pill--won" : "status-pill status-pill--warm"}>
                      {user.businesses_count > 0 ? "Active" : "Needs setup"}
                    </span>
                  </div>

                  <div className="admin-user__meta">
                    <span>Language: {user.language.toUpperCase()}</span>
                    <span>Businesses: {user.businesses_count}</span>
                    <span>Joined: {new Date(user.created_at).toLocaleDateString("en-GB")}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="settings-status">No users have connected yet.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
