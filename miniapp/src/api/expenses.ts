import { apiClient } from "./client";

export type Expense = {
  id: string;
  business_id: string;
  lead_id?: string | null;
  created_by: string;
  expense_type: string;
  is_template: boolean;
  recurring_interval?: string | null;
  next_due_date?: string | null;
  recurring_active: boolean;
  archived_at?: string | null;
  parent_recurring_id?: string | null;
  title: string;
  amount: string;
  description?: string | null;
  date: string;
  created_at: string;
};

export async function getExpenses(
  businessId: string,
  token?: string | null,
  expenseType = "all",
  leadId?: string | null,
) {
  const response = await apiClient.get<{ items: Expense[] }>("/api/v1/expenses", {
    params: {
      business_id: businessId,
      expense_type: expenseType,
      lead_id: leadId || undefined,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getRecurringExpensePlans(
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.get<{ items: Expense[] }>("/api/v1/expenses/recurring-plans", {
    params: {
      business_id: businessId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function createExpense(
  payload: {
    business_id: string;
    lead_id?: string | null;
    expense_type: string;
    recurring_interval?: string | null;
    title: string;
    amount: string;
    description?: string | null;
    date: string;
  },
  token?: string | null,
) {
  const response = await apiClient.post<Expense>("/api/v1/expenses", payload, {
    params: {
      business_id: payload.business_id,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function deleteExpense(
  expenseId: string,
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.delete<{ deleted: string }>(`/api/v1/expenses/${expenseId}`, {
    params: {
      business_id: businessId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function updateExpense(
  expenseId: string,
  payload: {
    business_id: string;
    lead_id?: string | null;
    expense_type?: string;
    recurring_interval?: string | null;
    title?: string;
    amount?: string;
    description?: string | null;
    date?: string;
  },
  token?: string | null,
) {
  const response = await apiClient.patch<Expense>(`/api/v1/expenses/${expenseId}`, payload, {
    params: {
      business_id: payload.business_id,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function pauseRecurringExpensePlan(
  expenseId: string,
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.post<Expense>(
    `/api/v1/expenses/${expenseId}/pause`,
    {},
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function resumeRecurringExpensePlan(
  expenseId: string,
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.post<Expense>(
    `/api/v1/expenses/${expenseId}/resume`,
    {},
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function archiveRecurringExpensePlan(
  expenseId: string,
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.post<Expense>(
    `/api/v1/expenses/${expenseId}/archive`,
    {},
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}
