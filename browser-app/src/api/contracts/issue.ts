import type { AttachmentResponse } from "./attachment";
import type { SubtaskResponse } from "./subtask";
import type { ProjectStatusResponse } from "./projectStatus";

export interface IssueTypeResponse {
  id: string;
  name: string;
  description: string | null;
  iconKey: string;
  color: string;
  isSystem: boolean;
}

export type PriorityType = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
// Status is no longer a plain string — it is a full ProjectStatusResponse object from the server.
// Keep this re-export for any legacy code that may import it directly.
export type { ProjectStatusResponse as IssueStatus };

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
  notifyComment?: boolean;
  notifyEventInvited?: boolean;
  role?: string;

}

export interface CreateIssueRequest {
  issueName: string;
  issueTypeId: string;
  priority: PriorityType;
  description?: string;
  deadline?: string;
  /** UUID of the target ProjectStatus column. */
  statusId?: string;
}

export interface UpdateIssueRequest {
  issueName?: string;
  description?: string;
  issueTypeId?: string;
  priority?: PriorityType;
  deadline?: string;
  assigneeIds?: string[];
  /** UUID of the target ProjectStatus column. */
  statusId?: string;
  parentId?: string | null;
}

export interface IssueResponse {
  id: string;
  issueName: string;
  description: string | null;
  issueType: IssueTypeResponse;
  priority: PriorityType | null;
  /** Full status column object from the project's workflow. */
  status: ProjectStatusResponse | null;
  parentId: string | null;
  projectId: string;
  assignees: UserSummary[];   // multi-assignee list
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  attachments?: AttachmentResponse[];
  subtasks?: SubtaskResponse[];
}