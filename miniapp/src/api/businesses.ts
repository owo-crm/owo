import { apiClient } from "./client";
import type { AuthBusiness, BusinessAutomationSettings, BusinessNotificationSettings } from "./auth";

type SheetMappingSuggestionResponse = {
  business_id: string;
  sheet_title?: string | null;
  selected_tab_name?: string | null;
  headers: string[];
  suggested_mapping: Record<string, string>;
  message: string;
};

type SheetTabsResponse = {
  business_id: string;
  sheet_title?: string | null;
  available_tabs: string[];
  selected_tab_name?: string | null;
};

type SheetSyncResponse = {
  business_id: string;
  sheet_title?: string | null;
  selected_tab_name?: string | null;
  rows_processed: number;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  skipped_reasons: Record<string, number>;
  sheet_last_synced_at?: string | null;
  message: string;
};

type BusinessResponse = AuthBusiness;
export type BusinessEventRecord = {
  id: string;
  business_id: string;
  event_type: string;
  entity_type: string;
  entity_id?: string | null;
  lead_id?: string | null;
  task_id?: string | null;
  triggered_by_user_id?: string | null;
  payload: Record<string, unknown>;
  delivered_channels: string[];
  delivery_state: string;
  dedupe_key?: string | null;
  created_at: string;
};
export type BusinessMember = {
  id: string;
  role: string;
  position?: string | null;
  custom_permissions: string[];
  user_id: string;
  display_name: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

export type BusinessLeadStatus = {
  id: string;
  business_id: string;
  name: string;
  color: string;
  position: number;
  is_default: boolean;
  is_won: boolean;
  is_lost: boolean;
  requires_follow_up: boolean;
  hide_from_active: boolean;
};

export async function getSheetMappingSuggestions(
  businessId: string,
  sheetId: string,
  sheetTabName?: string | null,
  token?: string | null,
) {
  const response = await apiClient.get<SheetMappingSuggestionResponse>(
    `/api/v1/businesses/${businessId}/sheet-mapping/suggestions`,
    {
      params: {
        sheet_id: sheetId,
        sheet_tab_name: sheetTabName || undefined,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function getSheetTabs(
  businessId: string,
  sheetId: string,
  token?: string | null,
) {
  const response = await apiClient.get<SheetTabsResponse>(
    `/api/v1/businesses/${businessId}/sheet-tabs`,
    {
      params: { sheet_id: sheetId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function saveSheetMapping(
  businessId: string,
  mapping: Record<string, string>,
  token?: string | null,
) {
  const response = await apiClient.put<BusinessResponse>(
    `/api/v1/businesses/${businessId}/sheet-mapping`,
    mapping,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function verifySheet(
  businessId: string,
  sheetId: string,
  sheetTabName?: string | null,
  token?: string | null,
) {
  const response = await apiClient.post<{
    business_id: string;
    verified: boolean;
    sheet_title?: string | null;
    available_tabs: string[];
    selected_tab_name?: string | null;
    message: string;
  }>(
    `/api/v1/businesses/${businessId}/verify-sheet`,
    {
      sheet_id: sheetId,
      sheet_tab_name: sheetTabName || undefined,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function createBusiness(
  name: string,
  businessMode: string,
  enabledModules: string[] = [],
  token?: string | null,
) {
  const response = await apiClient.post<BusinessResponse>(
    "/api/v1/businesses",
    {
      name,
      business_mode: businessMode,
      sheet_id: null,
      sheet_column_mapping: {},
      enabled_modules: enabledModules,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function updateBusinessModules(
  businessId: string,
  enabledModules: string[],
  token?: string | null,
) {
  const response = await apiClient.patch<BusinessResponse>(
    `/api/v1/businesses/${businessId}`,
    {
      enabled_modules: enabledModules,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function updateBusinessNotificationSettings(
  businessId: string,
  notificationSettings: Partial<BusinessNotificationSettings>,
  token?: string | null,
) {
  const response = await apiClient.patch<BusinessResponse>(
    `/api/v1/businesses/${businessId}`,
    {
      notification_settings: notificationSettings,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function updateBusinessAutomationSettings(
  businessId: string,
  automationSettings: Partial<BusinessAutomationSettings>,
  token?: string | null,
) {
  const response = await apiClient.patch<BusinessResponse>(
    `/api/v1/businesses/${businessId}`,
    {
      automation_settings: automationSettings,
    },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function syncSheet(
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.post<SheetSyncResponse>(
    `/api/v1/businesses/${businessId}/sync-sheet`,
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function getBusinessMembers(
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.get<{ items: BusinessMember[] }>(
    `/api/v1/businesses/${businessId}/members`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function getLeadStatuses(
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.get<{ items: BusinessLeadStatus[] }>(
    `/api/v1/businesses/${businessId}/lead-statuses`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function saveLeadStatuses(
  businessId: string,
  items: Array<{
    id?: string | null;
    name: string;
    color: string;
    position: number;
    is_default?: boolean;
    is_won?: boolean;
    is_lost?: boolean;
    requires_follow_up?: boolean;
    hide_from_active?: boolean;
  }>,
  token?: string | null,
) {
  const response = await apiClient.put<{ items: BusinessLeadStatus[] }>(
    `/api/v1/businesses/${businessId}/lead-statuses`,
    items,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function getBusinessEvents(
  businessId: string,
  token?: string | null,
  options?: {
    limit?: number;
    eventType?: string | null;
  },
) {
  const response = await apiClient.get<{ items: BusinessEventRecord[] }>(
    "/api/v1/events",
    {
      params: {
        business_id: businessId,
        limit: options?.limit ?? 20,
        event_type: options?.eventType || undefined,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}
