export interface SubtaskResponse {
  id: string;
  subtaskName: string;
  subtaskDescription?: string | null;
  isDone: boolean;
  issueId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubtaskRequest {
  subtaskName: string;
  subtaskDescription?: string;
}

export interface UpdateSubtaskRequest {
  subtaskName?: string;
  subtaskDescription?: string;
  isDone?: boolean;
}
