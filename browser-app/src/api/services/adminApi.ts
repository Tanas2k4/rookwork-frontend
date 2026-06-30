import { apiClient } from "../apiClient";

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersLast7Days: number;
  newUsersLast30Days: number;
  totalProjects: number;
  totalIssues: number;
  openIssues: number;
  completionRate: number;
  issuesByStatus: Record<string, number>;
  issuesByPriority: Record<string, number>;
}

export interface AdminUser {
  id: string;
  profileName: string;
  email: string;
  picture: string | null;
  isActive: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  jobTitle: string | null;
  organization: string | null;
  createdAt: string;
  projectCount: number;
}

export interface AdminProject {
  id: string;
  projectName: string;
  description: string | null;
  isPrivate: boolean;
  memberCount: number;
  issueCount: number;
  completionRate: number;
  createdAt: string;
}

export interface ActivityPoint {
  date: string;
  issuesCreated: number;
}

export const adminApi = {
  getStats: () => apiClient.get<AdminStats>("/api/admin/stats"),
  getUsers: (search?: string) =>
    apiClient.get<AdminUser[]>(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getProjects: (search?: string) =>
    apiClient.get<AdminProject[]>(`/api/admin/projects${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getActivityChart: () => apiClient.get<ActivityPoint[]>("/api/admin/activity-chart"),
  toggleUserActive: (id: string) => apiClient.put<void>(`/api/admin/users/${id}/toggle-active`, {}),
  deleteUser: (id: string) => apiClient.delete<void>(`/api/admin/users/${id}`),
};
