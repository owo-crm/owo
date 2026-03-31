import { apiClient } from "./client";

export type Task = {
  id: string;
  business_id: string;
  lead_id?: string | null;
  lead_uid?: string | null;
  lead_name?: string | null;
  created_by: string;
  assigned_to?: string | null;
  title: string;
  description?: string | null;
  deadline?: string | null;
  done_at?: string | null;
  created_at: string;
};

export async function getTasks(
  businessId: string,
  token?: string | null,
  leadId?: string | null,
  state = "open",
  assignedTo?: string | null,
) {
  const response = await apiClient.get<{ items: Task[] }>("/api/v1/tasks", {
    params: {
      business_id: businessId,
      lead_id: leadId || undefined,
      state,
      assigned_to: assignedTo || undefined,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function createTask(
  payload: {
    business_id: string;
    lead_id?: string | null;
    title: string;
    description?: string | null;
    deadline?: string | null;
    assigned_to?: string | null;
  },
  token?: string | null,
) {
  const response = await apiClient.post<Task>("/api/v1/tasks", payload, {
    params: {
      business_id: payload.business_id,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function markTaskDone(
  taskId: string,
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.post<Task>(
    `/api/v1/tasks/${taskId}/done`,
    {},
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function updateTask(
  taskId: string,
  businessId: string,
  payload: {
    lead_id?: string | null;
    title?: string | null;
    description?: string | null;
    deadline?: string | null;
    assigned_to?: string | null;
    done_at?: string | null;
  },
  token?: string | null,
) {
  const response = await apiClient.patch<Task>(
    `/api/v1/tasks/${taskId}`,
    payload,
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function deleteTask(
  taskId: string,
  businessId: string,
  token?: string | null,
) {
  const response = await apiClient.delete<{ deleted: string }>(
    `/api/v1/tasks/${taskId}`,
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}
