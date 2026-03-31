import { apiClient } from "./client";

export type Lead = {
  id: string;
  uid: string;
  business_id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  event_date?: string | null;
  event_type?: string | null;
  status: string;
  assigned_to?: string | null;
  contract_value?: string | null;
  notes?: string | null;
  next_call_at?: string | null;
  call_history: Array<Record<string, unknown>>;
  source: string;
  custom_fields: Record<string, unknown>;
  notified_at?: string | null;
  merged_existing?: boolean;
  merge_message?: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadDetailUpdate = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  event_type?: string | null;
  contract_value?: string | null;
  status?: string;
  assigned_to?: string | null;
  notes?: string | null;
  event_date?: string | null;
  next_call_at?: string | null;
  call_history?: Array<Record<string, unknown>>;
  custom_fields?: Record<string, string>;
};

export type LeadCreatePayload = {
  business_id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  event_date?: string | null;
  event_type?: string | null;
  status?: string | null;
  assigned_to?: string | null;
  contract_value?: string | null;
  notes?: string | null;
  source?: string;
  custom_fields?: Record<string, string>;
};

type LeadListResponse = {
  items: Lead[];
  page: number;
  page_size: number;
  total: number;
};

export async function getLeads(
  businessId: string,
  token?: string | null,
  status?: string,
  statusScope = "all",
  assigned = "all",
  search = "",
  sortBy = "received_at",
  sortDir = "desc",
) {
  const response = await apiClient.get<LeadListResponse>("/api/v1/leads", {
    params: {
      business_id: businessId,
      page: 1,
      page_size: 50,
      status: status && status !== "all" ? status : undefined,
      status_scope: statusScope !== "all" ? statusScope : undefined,
      assigned: assigned !== "all" ? assigned : undefined,
      search: search.trim() || undefined,
      sort_by: sortBy,
      sort_dir: sortDir,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return response.data;
}

export async function getLead(
  businessId: string,
  uid: string,
  token?: string | null,
) {
  const response = await apiClient.get<Lead>(`/api/v1/leads/${uid}`, {
    params: {
      business_id: businessId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return response.data;
}

export async function createLead(
  payload: LeadCreatePayload,
  token?: string | null,
) {
  const response = await apiClient.post<Lead>(
    "/api/v1/leads",
    {
      ...payload,
      name: payload.name || null,
      phone: payload.phone || null,
      email: payload.email || null,
      city: payload.city || null,
      event_date: payload.event_date || null,
      event_type: payload.event_type || null,
      status: payload.status || null,
      assigned_to: payload.assigned_to || null,
      contract_value: payload.contract_value || null,
      notes: payload.notes ?? null,
      source: payload.source ?? "manual",
      custom_fields: payload.custom_fields ?? {},
    },
    {
      params: {
        business_id: payload.business_id,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function updateLead(
  businessId: string,
  uid: string,
  payload: LeadDetailUpdate,
  token?: string | null,
) {
  const response = await apiClient.patch<Lead>(
    `/api/v1/leads/${uid}`,
    {
      ...payload,
      name: payload.name || null,
      phone: payload.phone || null,
      email: payload.email || null,
      city: payload.city || null,
      event_type: payload.event_type || null,
      contract_value: payload.contract_value || null,
      assigned_to: payload.assigned_to || null,
      notes: payload.notes ?? null,
      event_date: payload.event_date || null,
      next_call_at: payload.next_call_at || null,
    },
    {
      params: {
        business_id: businessId,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );

  return response.data;
}

export async function deleteLead(
  businessId: string,
  uid: string,
  token?: string | null,
) {
  const response = await apiClient.delete<{ deleted: string }>(`/api/v1/leads/${uid}`, {
    params: {
      business_id: businessId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return response.data;
}
