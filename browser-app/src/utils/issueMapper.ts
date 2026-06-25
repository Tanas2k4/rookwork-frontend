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
  IssueType,
  PriorityType,
  Status as ApiStatus,
  UserSummary,
} from "../api/contracts/issue";

/**
 * Chuyển đổi loại công việc từ API BE (viết hoa) sang loại công việc trên UI FE (viết thường).
 * @param t Loại công việc từ BE
 */
export function apiTypeToUI(t: IssueType): TaskType {
  return t.toLowerCase() as TaskType;
}

/**
 * Chuyển đổi loại công việc từ UI FE (viết thường) sang loại công việc của API BE (viết hoa).
 * @param t Loại công việc từ FE
 */
export function uiTypeToApi(t: TaskType): IssueType {
  return t.toUpperCase() as IssueType;
}

/**
 * Ánh xạ trạng thái công việc từ API BE sang trạng thái hiển thị trên UI FE.
 * @param s Trạng thái từ BE
 */
export function apiStatusToUI(s: ApiStatus | null): Status {
  if (!s) return "to_do";
  const map: Record<ApiStatus, Status> = {
    TO_DO: "to_do",
    IN_PROGRESS: "in_progress",
    DONE: "done",
  };
  return map[s];
}

/**
 * Ánh xạ trạng thái công việc từ UI FE sang trạng thái cho API BE.
 * @param s Trạng thái từ FE
 */
export function uiStatusToApi(s: Status): ApiStatus {
  const map: Record<Status, ApiStatus> = {
    to_do: "TO_DO",
    in_progress: "IN_PROGRESS",
    done: "DONE",
  };
  return map[s];
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
    avt: u.picture ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.profileName)}&background=7c3aed&color=fff`,
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
): Task & { _uuid: string; _projectId: string; _assigneeUuids: string[] } {
  const children = allIssues
    .filter((i) => i.parentId === issue.id)
    .map((i) => uuidToId(i.id));

  const assignees = (issue.assignees ?? []).map(apiUserToUI);

  return {
    id: uuidToId(issue.id),
    _uuid: issue.id,
    _projectId: issue.projectId,
    _assigneeUuids: (issue.assignees ?? []).map((u) => u.id),
    title: issue.issueName,
    description: issue.description ?? undefined,
    type: apiTypeToUI(issue.issueType),
    priority: apiPriorityToUI(issue.priority),
    assigned_to: assignees,
    deadline: issue.deadline ? issue.deadline.split("T")[0] : null,
    status: apiStatusToUI(issue.status),
    subtasks: [],
    parentId: issue.parentId ? uuidToId(issue.parentId) : null,
    childIds: children,
    attachments: issue.attachments,
  };
}
