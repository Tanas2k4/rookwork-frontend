import { apiClient } from "../apiClient";
import type {
  CreateIssueRequest,
  UpdateIssueRequest,
  IssueResponse,
} from "../contracts/issue";
import type { AttachmentResponse } from "../contracts/attachment";

export const issueApi = {
  getAll: (projectId: string) =>
    apiClient.get<IssueResponse[]>(`/api/projects/${projectId}/issues`),

  getById: (issueId: string) =>
    apiClient.get<IssueResponse>(`/api/issues/${issueId}`),
  
  getAssigned: () =>
    apiClient.get<IssueResponse[]>("/api/issues/assigned"),

  create: (projectId: string, data: CreateIssueRequest) =>
    apiClient.post<IssueResponse>(`/api/projects/${projectId}/issues`, data),

  update: (projectId: string, issueId: string, data: UpdateIssueRequest) =>
    apiClient.put<IssueResponse>(
      `/api/projects/${projectId}/issues/${issueId}`,
      data,
    ),

  delete: (projectId: string, issueId: string) =>
    apiClient.delete<void>(`/api/projects/${projectId}/issues/${issueId}`),

  uploadAttachments: (projectId: string, issueId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return apiClient.postFormData<AttachmentResponse[]>(
      `/api/projects/${projectId}/issues/${issueId}/attachments`,
      formData
    );
  },

  deleteAttachment: (projectId: string, issueId: string, fileId: string) =>
    apiClient.delete<void>(
      `/api/projects/${projectId}/issues/${issueId}/attachments/${fileId}`
    ),
};
