import { apiClient } from "./client";

export type AdminUserRow = {
  id: string;
  telegram_id: number;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  language: string;
  created_at: string;
  businesses_count: number;
};

export type TelegramBotStatus = {
  configured: boolean;
  base_url?: string | null;
  base_url_public: boolean;
  mini_app_url?: string | null;
  mini_app_configured: boolean;
  bot_id?: number | null;
  bot_username?: string | null;
  bot_display_name?: string | null;
  webhook_url?: string | null;
  expected_webhook_url?: string | null;
  webhook_matches_expected: boolean;
  webhook_has_secret: boolean;
  pending_update_count: number;
  last_error_message?: string | null;
  commands_count: number;
  commands_match_expected: boolean;
  menu_button_configured: boolean;
  menu_button_matches_expected: boolean;
  setup_ready: boolean;
  recommended_next_step?: string | null;
};

export type TelegramBotActionResponse = {
  ok: boolean;
  action: string;
  message: string;
  status: TelegramBotStatus;
};

export type ReadinessCheck = {
  name: string;
  status: string;
  detail: string;
};

export type SystemReadiness = {
  status: string;
  environment: string;
  base_url?: string | null;
  base_url_public: boolean;
  mini_app_url?: string | null;
  checks: ReadinessCheck[];
};

export async function getAdminUsers(token: string | null) {
  const response = await apiClient.get<{ items: AdminUserRow[] }>("/api/v1/admin/users", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getTelegramBotStatus(token: string | null) {
  const response = await apiClient.get<TelegramBotStatus>("/api/v1/admin/telegram/status", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getSystemReadiness(token: string | null) {
  const response = await apiClient.get<SystemReadiness>("/api/v1/admin/system/readiness", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function syncTelegramBotSetup(token: string | null) {
  const response = await apiClient.post<TelegramBotActionResponse>(
    "/api/v1/admin/telegram/setup/sync",
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function syncTelegramWebhook(token: string | null) {
  const response = await apiClient.post<TelegramBotActionResponse>(
    "/api/v1/admin/telegram/webhook/sync",
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function clearTelegramWebhook(token: string | null) {
  const response = await apiClient.delete<TelegramBotActionResponse>("/api/v1/admin/telegram/webhook", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function syncTelegramCommands(token: string | null) {
  const response = await apiClient.post<TelegramBotActionResponse>(
    "/api/v1/admin/telegram/commands/sync",
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}
