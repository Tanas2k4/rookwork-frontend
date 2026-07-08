import { apiClient } from "../apiClient";
import type {
  ProjectStatusResponse,
  CreateStatusRequest,
  UpdateStatusRequest,
  ReorderStatusRequest,
  DeleteStatusRequest,
} from "../contracts/projectStatus";

export const projectStatusApi = {
  /** List all status columns for a project, ordered by position. */
  list: (projectId: string) =>
    apiClient.get<ProjectStatusResponse[]>(
      `/api/projects/${projectId}/statuses`
    ),

  /** Add a new status column (OWNER only). */
  create: (projectId: string, data: CreateStatusRequest) =>
    apiClient.post<ProjectStatusResponse>(
      `/api/projects/${projectId}/statuses`,
      data
    ),

  /** Update the name or color of a status column (OWNER only). */
  update: (projectId: string, statusId: string, data: UpdateStatusRequest) =>
    apiClient.put<ProjectStatusResponse>(
      `/api/projects/${projectId}/statuses/${statusId}`,
      data
    ),

  /** Batch-reorder columns after drag-and-drop (OWNER only). */
  reorder: (projectId: string, data: ReorderStatusRequest) =>
    apiClient.put<ProjectStatusResponse[]>(
      `/api/projects/${projectId}/statuses/reorder`,
      data
    ),

  /**
   * Delete a status column and migrate its issues to the fallback (OWNER only).
   * Returns HTTP 204 No Content on success.
   */
  delete: (projectId: string, statusId: string, data: DeleteStatusRequest) =>
    apiClient.delete<void>(
      `/api/projects/${projectId}/statuses/${statusId}`,
      data
    ),
};
