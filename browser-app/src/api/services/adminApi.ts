import { apiClient } from "../apiClient";
import type {
  AdminStatsResponse,
  AdminUserResponse,
  RecentWorkspace,
  SystemHealthResponse,
} from "../contracts/admin";

export const adminApi = {
  getStats: (period?: "day" | "week" | "month") => apiClient.get<AdminStatsResponse>(`/api/admin/stats${period ? `?period=${period}` : ""}`),
  getUsers: () => apiClient.get<AdminUserResponse[]>("/api/admin/users"),
  lockUser: (userId: string) => apiClient.post<{ message: string }>(`/api/admin/users/${userId}/lock`, {}),
  unlockUser: (userId: string) => apiClient.post<{ message: string }>(`/api/admin/users/${userId}/unlock`, {}),
  getWorkspaces: () => apiClient.get<RecentWorkspace[]>("/api/admin/workspaces"),
  getHealth: () => apiClient.get<SystemHealthResponse>("/api/admin/system/health"),
  getSettings: () => apiClient.get<Record<string, boolean>>("/api/admin/system/settings"),
  updateSettings: (settings: Record<string, boolean>) => apiClient.post<Record<string, boolean>>("/api/admin/system/settings", settings),
};
