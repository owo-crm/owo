import { apiClient } from "./client";

export type Income = {
  id: string;
  business_id: string;
  lead_id?: string | null;
  created_by: string;
  title: string;
  amount: string;
  description?: string | null;
  date: string;
  created_at: string;
};

export async function getIncomes(
  businessId: string,
  token?: string | null,
  leadId?: string | null,
) {
  const response = await apiClient.get<{ items: Income[] }>("/api/v1/incomes", {
    params: {
      business_id: businessId,
      lead_id: leadId || undefined,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function createIncome(
  payload: {
    business_id: string;
    lead_id?: string | null;
    title: string;
    amount: string;
    description?: string | null;
    date: string;
  },
  token?: string | null,
) {
  const response = await apiClient.post<Income>("/api/v1/incomes", payload, {
    params: {
      business_id: payload.business_id,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function updateIncome(
  incomeId: string,
  payload: {
    business_id: string;
    lead_id?: string | null;
    title?: string;
    amount?: string;
    description?: string | null;
    date?: string;
  },
  token?: string | null,
) {
  const response = await apiClient.patch<Income>(`/api/v1/incomes/${incomeId}`, payload, {
    params: {
      business_id: payload.business_id,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function deleteIncome(
  incomeId: string,
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.delete<{ deleted: string }>(`/api/v1/incomes/${incomeId}`, {
    params: {
      business_id: businessId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}
