export interface TransitionDto {
  id: string;
  fromStatusId: string;
  fromStatusName: string;
  toStatusId: string;
  toStatusName: string;
}

export interface WorkflowResponse {
  projectId: string;
  transitions: TransitionDto[];
  openWorkflow: boolean;
}

export interface AddTransitionRequest {
  fromStatusId: string;
  toStatusId: string;
}

export interface BulkWorkflowRequest {
  transitions: AddTransitionRequest[];
}
