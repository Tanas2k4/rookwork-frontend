import { createContext } from "react";
import type { ProjectResponse } from "../api/contracts";
import type { UserSummary } from "../api/contracts/issue";

export interface ProjectContextValue {
  projectId: string | null;
  projectKey: string | null;
  project: ProjectResponse | null;
  members: UserSummary[];
  loading: boolean;
  refresh: () => void;
  reloadIssues: () => void;
  setReloadIssues: (fn: () => void) => void;
  /** Mở TaskModal chi tiết từ bất kỳ view nào bằng UUID của issue */
  openIssueModal: (uuid: string) => void;
  /** Được gọi bởi SharedIssueModal để đăng ký hàm mở modal */
  setOpenIssueModal: (fn: (uuid: string) => void) => void;
  /**
   * Tăng khi có thao tác cập nhật issue (status, assignee, title...).
   * Timeline và ListView subscribe vào tick này để tự reload.
   */
  issueUpdateTick: number;
  /** Gọi sau mỗi thao tác cập nhật để trigger reload ở các view khác */
  notifyIssueUpdated: () => void;
}

export const ProjectContext = createContext<ProjectContextValue>({
  projectId: null,
  projectKey: null,
  project: null,
  members: [],
  loading: false,
  refresh: () => {},
  reloadIssues: () => {},
  setReloadIssues: () => {},
  openIssueModal: () => {},
  setOpenIssueModal: () => {},
  issueUpdateTick: 0,
  notifyIssueUpdated: () => {},
});