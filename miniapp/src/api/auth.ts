import { apiClient } from "./client";

export type BusinessNotificationSettings = {
  notifications_enabled: boolean;
  telegram_internal_enabled: boolean;
  client_email_enabled: boolean;
  notify_on: string[];
  client_email_sender_name?: string | null;
  client_email_reply_to?: string | null;
  client_email_template_key?: string | null;
};

export type BusinessAutomationSettings = {
  automations_enabled: boolean;
  assign_new_leads_to_owner: boolean;
  create_task_on_new_lead: boolean;
  create_task_for_follow_up_stages: boolean;
  follow_up_task_title: string;
  follow_up_task_deadline_hours: number;
};

export type AuthBusiness = {
  id: string;
  name: string;
  business_mode: string;
  sheet_id?: string | null;
  sheet_verified: boolean;
  sheet_tab_name: string;
  sheet_column_mapping: Record<string, string>;
  enabled_modules: string[];
  automation_settings: BusinessAutomationSettings;
  notification_settings: BusinessNotificationSettings;
  sheet_last_synced_at?: string | null;
};

export type AuthResponse = {
  user: {
    id: string;
    telegram_id: number;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    language: string;
    is_platform_admin: boolean;
    created_at: string;
  };
  businesses: AuthBusiness[];
  active_business_id?: string | null;
  token: string;
};

export async function validateInitData(initData: string) {
  const response = await apiClient.post<AuthResponse>("/api/v1/auth/validate", {
    initData,
  });

  return response.data;
}
