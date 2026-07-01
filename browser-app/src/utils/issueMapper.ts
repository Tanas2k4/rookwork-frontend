/**
 * @file issueMapper.ts
 * @description Hàm ánh xạ giữa dữ liệu API (Issue BE) và cấu trúc dữ liệu Task hiển thị trên UI (FE)
 * hỗ trợ chuyển đổi trạng thái, loại công việc, độ ưu tiên, thông tin user và quan hệ cha con.
 * @author Warmdrobe
 */

import type {
  Task,
  Status,
  Priority,
  TaskType,
  User,
} from "../types/project";
import type {
  IssueResponse,
  IssueTypeResponse,
  PriorityType,
  UserSummary,
} from "../api/contracts/issue";
import type { ProjectStatusResponse, StatusCategory } from "../api/contracts/projectStatus";
import { avatarUrl } from "./avatar";

/**
 * Chuyển đổi loại công việc từ API BE (viết hoa) sang loại công việc trên UI FE (viết thường).
 * @param t Loại công việc từ BE
 */
export function apiTypeToUI(t: IssueTypeResponse): TaskType {
  return t.name.toLowerCase() as TaskType;
}

/**
 * Chuyển đổi loại công việc từ UI FE (viết thường) sang loại công việc của API BE (viết hoa).
 * @param t Loại công việc từ FE
 */
export function uiTypeToApi(t: TaskType): any {
  return t.toUpperCase();
}

/**
 * Maps a StatusCategory string to the internal UI Status literal.
 * The UI still uses simple string literals for rendering/filtering logic.
 */
export function categoryToUIStatus(category: StatusCategory | null | undefined): Status {
  if (!category) return "to_do";
  const map: Record<StatusCategory, Status> = {
    TO_DO: "to_do",
    IN_PROGRESS: "in_progress",
    DONE: "done",
  };
  return map[category];
}

/**
 * Maps a full ProjectStatusResponse object to the internal UI Status literal.
 * Used when converting an IssueResponse whose status is now an object.
 */
export function apiStatusToUI(s: ProjectStatusResponse | null | undefined): Status {
  if (!s) return "to_do";
  return categoryToUIStatus(s.statusCategory);
}

/**
 * Maps a UI Status literal to the status ID UUID of the matching column.
 * Requires the project's status list to do a reverse lookup.
 */
export function uiStatusToStatusId(
  s: Status,
  projectStatuses: ProjectStatusResponse[]
): string | undefined {
  const categoryMap: Record<Status, StatusCategory> = {
    to_do: "TO_DO",
    in_progress: "IN_PROGRESS",
    done: "DONE",
  };
  const target = categoryMap[s];
  return projectStatuses.find((ps) => ps.statusCategory === target)?.id;
}

/**
 * @deprecated Use apiStatusToUI(ProjectStatusResponse) instead.
 * Kept for any legacy callers that still pass the old string enum.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function uiStatusToApi(_s: Status): string {
  // This function is no longer used for API calls.
  // Use uiStatusToStatusId() to get a UUID to pass as statusId.
  throw new Error("uiStatusToApi is deprecated. Use uiStatusToStatusId() instead.");
}

/**
 * Ánh xạ mức độ ưu tiên từ API BE sang UI FE.
 * @param p Mức độ ưu tiên từ BE
 */
export function apiPriorityToUI(p: PriorityType | null): Priority {
  if (!p) return "medium";
  return p.toLowerCase() as Priority;
}

/**
 * Ánh xạ mức độ ưu tiên từ UI FE sang API BE.
 * @param p Mức độ ưu tiên từ FE
 */
export function uiPriorityToApi(p: Priority): PriorityType {
  return p.toUpperCase() as PriorityType;
}

/**
 * Ánh xạ thông tin người dùng từ BE sang định dạng UI User của FE.
 * @param u Thông tin user từ BE
 */
export function apiUserToUI(u: UserSummary): User & { uuid?: string } {
  return {
    id: uuidToId(u.id),
    email: "",
    display_name: u.profileName,
    avt: avatarUrl(u.profileName, u.picture),
    uuid: u.id,
  };
}

let _taskIdCounter = 0;
const uuidToNumId = new Map<string, number>();

/**
 * Đăng ký và chuyển đổi chuỗi UUID (từ API) sang mã số ID kiểu số nguyên duy nhất (cho UI/FE).
 * @param uuid Chuỗi định danh UUID từ API
 */
export function uuidToId(uuid: string): number {
  if (!uuidToNumId.has(uuid)) {
    uuidToNumId.set(uuid, ++_taskIdCounter);
  }
  return uuidToNumId.get(uuid)!;
}

/**
 * Chuyển ngược mã số ID kiểu số nguyên (FE) sang chuỗi UUID tương ứng (nếu có).
 * @param id Số định danh nguyên ở FE
 */
export function idToUuid(id: number): string | undefined {
  for (const [uuid, numId] of uuidToNumId.entries()) {
    if (numId === id) return uuid;
  }
  return undefined;
}

/**
 * Chuyển đổi toàn bộ đối tượng IssueResponse của API BE sang cấu trúc đối tượng Task của UI FE.
 * Đồng thời tự động giải quyết quan hệ cha con giữa các Task.
 * @param issue Đối tượng issue từ API
 * @param allIssues Danh sách tất cả issues để phân giải cấu trúc cây cha con
 */
export function issueToTask(
  issue: IssueResponse,
  allIssues: IssueResponse[] = [],
): Task & { _uuid: string; _projectId: string; _assigneeUuids: string[]; _statusId: string | null; _statusMeta: ProjectStatusResponse | null } {
  const children = allIssues
    .filter((i) => i.parentId === issue.id)
    .map((i) => uuidToId(i.id));

  const assignees = (issue.assignees ?? []).map(apiUserToUI);

  return {
    id: uuidToId(issue.id),
    _uuid: issue.id,
    _projectId: issue.projectId,
    _assigneeUuids: (issue.assignees ?? []).map((u) => u.id),
    /** The UUID of the ProjectStatus column — used for API calls. */
    _statusId: issue.status?.id ?? null,
    /** The full status object — used for rendering custom name/color. */
    _statusMeta: issue.status ?? null,
    title: issue.issueName,
    description: issue.description ?? undefined,
    type: apiTypeToUI(issue.issueType),
    priority: apiPriorityToUI(issue.priority),
    assigned_to: assignees,
    deadline: issue.deadline ? issue.deadline.split("T")[0] : null,
    // status on UI is still the simple 3-value string for backward compat with rendering logic
    status: apiStatusToUI(issue.status),
    subtasks: (issue.subtasks ?? []).map((sub) => {
      uuidToId(sub.id);
      return {
        id: uuidToId(sub.id),
        title: sub.subtaskName,
        done: sub.isDone,
      };
    }),
    parentId: issue.parentId ? uuidToId(issue.parentId) : null,
    childIds: children,
    attachments: issue.attachments,
    issueType: issue.issueType,
  };
}
