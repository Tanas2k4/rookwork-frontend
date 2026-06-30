import type { AttachmentResponse } from "./attachment";
import type { SubtaskResponse } from "./subtask";

export interface IssueTypeResponse {
  id: string;
  name: string;
  description: string | null;
  iconKey: string;
  color: string;
  isSystem: boolean;
}

export type PriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type Status = "TO_DO" | "IN_PROGRESS" | "DONE";

export interface UserSummary {
  id: string;
  profileName: string;
  picture: string | null;
  email: string;
  jobTitle?: string | null;
  organization?: string | null;
  location?: string | null;
  emailPublic?: boolean;
  jobTitlePublic?: boolean;
  organizationPublic?: boolean;
  locationPublic?: boolean;

  notifyIssueAssigned?: boolean;
  notifyMentioned?: boolean;
  notifyProjectUpdates?: boolean;
  notifyDailyDigest?: boolean;
  role?: string;

}

export interface CreateIssueRequest {
  issueName: string;
  issueTypeId: string;
  priority: PriorityType;
  description?: string;
  deadline?: string; // "2024-08-15T00:00:00" 
  status: Status;
}

export interface UpdateIssueRequest {
  issueName?: string;
  description?: string;
  issueTypeId?: string;
  priority?: PriorityType;
  deadline?: string;       // "2024-08-15" — maps to LocalDate
  assigneeIds?: string[];  // null=no change, []=remove all, [id1,id2]=set new
  status?: Status;
  parentId?: string | null;
}

export interface IssueResponse {
  id: string;
  issueName: string;
  description: string | null;
  issueType: IssueTypeResponse;
  priority: PriorityType | null;
  status: Status | null;
  parentId: string | null;
  projectId: string;
  assignees: UserSummary[];   // multi-assignee list
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: AttachmentResponse[];
  subtasks?: SubtaskResponse[];
}