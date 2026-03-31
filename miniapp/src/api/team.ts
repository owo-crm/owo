import { apiClient } from "./client";
import type { BusinessMember } from "./businesses";

export async function getTeamMembers(businessId: string, token?: string | null) {
  const response = await apiClient.get<{ items: BusinessMember[] }>("/api/v1/team", {
    params: { business_id: businessId },
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return response.data;
}

export async function inviteTeamMember(
  businessId: string,
  telegramId: number,
  role: string,
  position: string,
  customPermissions: string[],
  token?: string | null,
) {
  const response = await apiClient.post<{ item: BusinessMember; message: string }>(
    "/api/v1/team/invite",
    {
      telegram_id: telegramId,
      role,
      position: position.trim() || null,
      custom_permissions: customPermissions,
    },
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function updateTeamMemberRole(
  businessId: string,
  userId: string,
  role: string,
  position: string,
  customPermissions: string[],
  token?: string | null,
) {
  const response = await apiClient.patch<{ item: BusinessMember; message: string }>(
    `/api/v1/team/${userId}/role`,
    {
      role,
      position: position.trim() || null,
      custom_permissions: customPermissions,
    },
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}

export async function removeTeamMember(
  businessId: string,
  userId: string,
  token?: string | null,
) {
  const response = await apiClient.delete<{ deleted_user_id: string; message: string }>(
    `/api/v1/team/${userId}`,
    {
      params: { business_id: businessId },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
  return response.data;
}
