import { apiClient } from "../apiClient";
import type { IssueTypeResponse } from "../contracts/issue";

export interface CreateIssueTypeRequest {
  name: string;
  description?: string;
  iconKey: string;
  color: string;
}

export interface IssueIconOption {
  key: string;
  label: string;
}

export const issueTypeApi = {
  getAll: (projectId: string) =>
    apiClient.get<IssueTypeResponse[]>(`/api/projects/${projectId}/issue-types`),

  create: (projectId: string, data: CreateIssueTypeRequest) =>
    apiClient.post<IssueTypeResponse>(`/api/projects/${projectId}/issue-types`, data),

  delete: (projectId: string, issueTypeId: string) =>
    apiClient.delete<void>(`/api/projects/${projectId}/issue-types/${issueTypeId}`),

  getIcons: () =>
    apiClient.get<IssueIconOption[]>("/api/issue-types/icons"),
};
