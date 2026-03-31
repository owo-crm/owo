import { apiClient } from "./client";

export type InventoryItem = {
  id: string;
  business_id: string;
  name: string;
  sku?: string | null;
  unit: string;
  current_quantity: string;
  reserved_quantity: string;
  available_quantity: string;
  min_quantity: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  low_stock: boolean;
};

export type InventoryMovement = {
  id: string;
  business_id: string;
  item_id: string;
  lead_id?: string | null;
  created_by: string;
  movement_type: string;
  quantity: string;
  note?: string | null;
  created_at: string;
};

export type LeadInventoryRequirement = {
  id: string;
  business_id: string;
  lead_id: string;
  item_id: string;
  required_quantity: string;
  note?: string | null;
  created_at: string;
};

export type InventoryTemplate = {
  id: string;
  business_id: string;
  name: string;
  event_type_match?: string | null;
  note?: string | null;
  items: Array<{
    item_id: string;
    required_quantity: string;
    note?: string | null;
  }>;
  created_at: string;
};

export type InventoryTemplateApplyResult = {
  requirements_created: number;
  reserved_units: string;
  missing_units: string;
  prep_task_created: boolean;
  restock_task_created: boolean;
  message: string;
};

export async function getInventoryItems(
  businessId: string,
  token?: string | null,
  search = "",
) {
  const response = await apiClient.get<{ items: InventoryItem[] }>("/api/v1/inventory/items", {
    params: {
      business_id: businessId,
      search: search || undefined,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function createInventoryItem(
  businessId: string,
  payload: {
    name: string;
    sku?: string | null;
    unit?: string;
    current_quantity?: string;
    min_quantity?: string;
    notes?: string | null;
  },
  token?: string | null,
) {
  const response = await apiClient.post<InventoryItem>("/api/v1/inventory/items", payload, {
    params: { business_id: businessId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function updateInventoryItem(
  businessId: string,
  itemId: string,
  payload: {
    name?: string;
    sku?: string | null;
    unit?: string;
    min_quantity?: string;
    notes?: string | null;
    is_active?: boolean;
  },
  token?: string | null,
) {
  const response = await apiClient.patch<InventoryItem>(`/api/v1/inventory/items/${itemId}`, payload, {
    params: { business_id: businessId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getInventoryMovements(
  businessId: string,
  token?: string | null,
  itemId?: string | null,
  leadId?: string | null,
) {
  const response = await apiClient.get<{ items: InventoryMovement[] }>("/api/v1/inventory/movements", {
    params: {
      business_id: businessId,
      item_id: itemId || undefined,
      lead_id: leadId || undefined,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getInventoryMovementsForLead(
  businessId: string,
  token?: string | null,
  leadId?: string | null,
) {
  return getInventoryMovements(businessId, token, null, leadId);
}

export async function createInventoryMovement(
  businessId: string,
  itemId: string,
  payload: {
    movement_type: string;
    quantity: string;
    lead_id?: string | null;
    note?: string | null;
  },
  token?: string | null,
) {
  const response = await apiClient.post<InventoryMovement>(`/api/v1/inventory/items/${itemId}/movements`, payload, {
    params: { business_id: businessId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getLeadInventoryRequirements(
  businessId: string,
  leadId: string,
  token?: string | null,
) {
  const response = await apiClient.get<{ items: LeadInventoryRequirement[] }>("/api/v1/inventory/requirements", {
    params: {
      business_id: businessId,
      lead_id: leadId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function createLeadInventoryRequirement(
  businessId: string,
  leadId: string,
  payload: {
    item_id: string;
    required_quantity: string;
    note?: string | null;
  },
  token?: string | null,
) {
  const response = await apiClient.post<LeadInventoryRequirement>("/api/v1/inventory/requirements", payload, {
    params: {
      business_id: businessId,
      lead_id: leadId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function deleteLeadInventoryRequirement(
  businessId: string,
  leadId: string,
  requirementId: string,
  token?: string | null,
) {
  const response = await apiClient.delete<{ message: string }>(`/api/v1/inventory/requirements/${requirementId}`, {
    params: {
      business_id: businessId,
      lead_id: leadId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function getInventoryTemplates(
  businessId: string,
  token?: string | null,
  eventTypeMatch?: string | null,
) {
  const response = await apiClient.get<{ items: InventoryTemplate[] }>("/api/v1/inventory/templates", {
    params: {
      business_id: businessId,
      event_type_match: eventTypeMatch || undefined,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function createInventoryTemplate(
  businessId: string,
  payload: {
    name: string;
    event_type_match?: string | null;
    note?: string | null;
    items: Array<{
      item_id: string;
      required_quantity: string;
      note?: string | null;
    }>;
  },
  token?: string | null,
) {
  const response = await apiClient.post<InventoryTemplate>("/api/v1/inventory/templates", payload, {
    params: {
      business_id: businessId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function updateInventoryTemplate(
  businessId: string,
  templateId: string,
  payload: {
    name?: string;
    event_type_match?: string | null;
    note?: string | null;
    items?: Array<{
      item_id: string;
      required_quantity: string;
      note?: string | null;
    }>;
  },
  token?: string | null,
) {
  const response = await apiClient.patch<InventoryTemplate>(`/api/v1/inventory/templates/${templateId}`, payload, {
    params: {
      business_id: businessId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function deleteInventoryTemplate(
  businessId: string,
  templateId: string,
  token?: string | null,
) {
  const response = await apiClient.delete<{ message: string }>(`/api/v1/inventory/templates/${templateId}`, {
    params: {
      business_id: businessId,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function applyInventoryTemplate(
  businessId: string,
  templateId: string,
  leadId: string,
  token?: string | null,
) {
  const response = await apiClient.post<InventoryTemplateApplyResult>(
    `/api/v1/inventory/templates/${templateId}/apply`,
    { lead_id: leadId },
    {
      params: {
        business_id: businessId,
      },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}
