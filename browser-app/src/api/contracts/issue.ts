import type { AttachmentResponse } from "./attachment";
import type { SubtaskResponse } from "./subtask";

export type IssueType = "EPIC" | "STORY" | "TASK";
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
  hasPassword?: boolean;
  isAdmin?: boolean;
}

export interface CreateIssueRequest {
  issueName: string;
  issueType: IssueType;
  priority: PriorityType;
  description?: string;
  deadline?: string; // "2024-08-15T00:00:00" 
  status: Status;
}

export interface UpdateIssueRequest {
  issueName?: string;
  description?: string;
  issueType?: IssueType;
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
  issueType: IssueType;
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