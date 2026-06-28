import { apiClient } from "../apiClient";
import type {
  SubtaskResponse,
  CreateSubtaskRequest,
  UpdateSubtaskRequest,
} from "../contracts/subtask";

export const subtaskApi = {
  create: (projectId: string, issueId: string, data: CreateSubtaskRequest) =>
    apiClient.post<SubtaskResponse>(
      `/api/projects/${projectId}/issues/${issueId}/subtasks`,
      data
    ),

  update: (
    projectId: string,
    issueId: string,
    subtaskId: string,
    data: UpdateSubtaskRequest
  ) =>
    apiClient.put<SubtaskResponse>(
      `/api/projects/${projectId}/issues/${issueId}/subtasks/${subtaskId}`,
      data
    ),

  delete: (projectId: string, issueId: string, subtaskId: string) =>
    apiClient.delete<void>(
      `/api/projects/${projectId}/issues/${issueId}/subtasks/${subtaskId}`
    ),
};
