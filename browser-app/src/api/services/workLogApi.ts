import { apiClient } from "../apiClient";
import type { WorkStatsResponse, LogWorkRequest, WorkLogResponse } from "../contracts/worklog";

export const workLogApi = {
  getStats: (period: "weekly" | "monthly", timezone?: string) =>
    apiClient.get<WorkStatsResponse>(`/api/work-logs/stats?period=${period}${timezone ? `&timezone=${timezone}` : ""}`),

  logWork: (data: LogWorkRequest) =>
    apiClient.post<WorkLogResponse[]>("/api/work-logs", data),

  getByIssue: (issueId: string) =>
    apiClient.get<WorkLogResponse[]>(`/api/work-logs/issue/${issueId}`),
};