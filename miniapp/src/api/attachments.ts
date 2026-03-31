import { apiClient } from "./client";

export type LeadAttachment = {
  id: string;
  lead_id: string;
  business_id: string;
  uploaded_by?: string | null;
  original_name: string;
  content_type?: string | null;
  size_bytes: number;
  storage_path: string;
  public_url: string;
  created_at: string;
};

export async function getAttachments(
  businessId: string,
  leadUid: string,
  token?: string | null,
) {
  const response = await apiClient.get<{ items: LeadAttachment[] }>(`/api/v1/leads/${leadUid}/attachments`, {
    params: { business_id: businessId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function uploadAttachment(
  businessId: string,
  leadUid: string,
  file: File,
  token?: string | null,
) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiClient.post<LeadAttachment>(
    `/api/v1/leads/${leadUid}/attachments`,
    formData,
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function deleteAttachment(
  businessId: string,
  leadUid: string,
  attachmentId: string,
  token?: string | null,
) {
  const response = await apiClient.delete<{ deleted_attachment_id: string; message: string }>(
    `/api/v1/leads/${leadUid}/attachments/${attachmentId}`,
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export function buildAttachmentContentUrl(
  leadUid: string,
  attachmentId: string,
  options?: { download?: boolean },
) {
  const baseUrl = (apiClient.defaults.baseURL ?? "").replace(/\/$/, "");
  const downloadSuffix = options?.download ? "?download=true" : "";
  return `${baseUrl}/api/v1/leads/${leadUid}/attachments/${attachmentId}/content${downloadSuffix}`;
}
