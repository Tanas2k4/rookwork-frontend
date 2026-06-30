import { apiClient } from "../apiClient";
import type { WorkflowResponse, BulkWorkflowRequest } from "../contracts/workflow";

export const workflowApi = {
  getWorkflow: (projectId: string) =>
    apiClient.get<WorkflowResponse>(`/api/projects/${projectId}/workflow`),

  replaceWorkflow: (projectId: string, data: BulkWorkflowRequest) =>
    apiClient.put<WorkflowResponse>(`/api/projects/${projectId}/workflow`, data),
};
