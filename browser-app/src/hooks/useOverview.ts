/**
 * @file useOverview.ts
 * @description Hook quản lý dữ liệu tổng quan dự án (Overview), xử lý tính toán tiến độ, công việc quá hạn, phân bổ tải công việc của thành viên và các hoạt động gần đây.
 * @author Warmdrobe
 */

import { useState, useEffect, useContext } from "react";
import { ProjectContext } from "../context/ProjectContext";
import { issueApi } from "../api/services/issueApi";
import { activityApi } from "../api/services/activityApi";
import type { IssueResponse } from "../api/contracts/issue";
import type { ActivityResponse } from "../api/contracts/activity";
import { apiStatusToUI } from "../utils/issueMapper";
import { avatarUrl } from "../utils/avatar";

//  Helpers 

/**
 * Tính số ngày còn lại đến hạn chéo (deadline).
 * @param deadline Chuỗi ngày đến hạn
 * @returns Số ngày còn lại (dương nếu chưa tới hạn, âm nếu quá hạn)
 */
export function getDaysLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}

/**
 * Định dạng ngày hạn hiển thị rút gọn (ví dụ: "Jun 19").
 * @param deadline Chuỗi ngày cần định dạng
 */
export function fmtDeadline(deadline: string): string {
  return new Date(deadline).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Tính toán thời gian tương đối so với hiện tại (ví dụ: "2 hours ago", "Yesterday").
 * @param iso Chuỗi định dạng ISO của thời điểm cần so sánh
 */
function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

//  Derived types 

export interface OverviewIssue extends IssueResponse {
  daysLeft: number;
  deadlineLabel: string;
}

export interface MilestoneItem {
  id: string;
  name: string;
  deadline: string;
  status: "to_do" | "in_progress" | "done";
  progress: number;
  taskCount: number;
}

export interface WorkloadItem {
  id: string;         // assignedTo.id (UUID)
  name: string;
  picture: string;
  email: string;
  count: number;
}

export interface ActivityItem {
  id: string;
  actorName: string;
  actorPicture: string | null;
  action: string;
  time: string;
}

export interface OverviewData {
  // Stats
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueCount: number;
  dueSoonCount: number;
  overallProgress: number;

  // Timeline
  timelineTasks: OverviewIssue[];

  // Attention (top 5)
  attentionTasks: OverviewIssue[];

  // Milestones (epics)
  milestones: MilestoneItem[];

  // Workload
  workload: WorkloadItem[];
  maxWorkload: number;

  // Recent activity
  activities: ActivityItem[];
}

/**
 * Tính toán tỷ lệ phần trăm hoàn thành cơ bản của một issue.
 */
function computeProgress(issue: IssueResponse): number {
  if (issue.status === "DONE") return 100;
  if (issue.status === "IN_PROGRESS") return 40;
  return 0;
}

/**
 * Xử lý chuỗi nhãn hành động hiển thị cho nhật ký hoạt động.
 */
function actionLabel(a: ActivityResponse): string {
  const meta = a.metadata
    ? (() => { try { return JSON.parse(a.metadata); } catch { return {}; } })()
    : {};

  if (a.entityType === "COMMENT") {
    switch (a.actionType) {
      case "COMMENTED": return `commented on issue "${a.entityName}"`;
      case "DELETED":   return `deleted a comment on issue "${a.entityName}"`;
      default:          return `${a.actionType.toLowerCase()} a comment on issue "${a.entityName}"`;
    }
  }

  if (a.entityType === "SUBTASK") {
    switch (a.actionType) {
      case "CREATED":   return `created subtask "${a.entityName}"`;
      case "COMPLETED": return `completed subtask "${a.entityName}"`;
      case "UPDATED":   return `updated subtask "${a.entityName}" (${meta.field ?? "details"})`;
      case "DELETED":   return `deleted subtask "${a.entityName}"`;
      default:          return `${a.actionType.toLowerCase()} subtask "${a.entityName}"`;
    }
  }

  const typeLabel = a.entityType === "ISSUE" ? "issue" : a.entityType.toLowerCase();
  switch (a.actionType) {
    case "CREATED":   return `created ${typeLabel} "${a.entityName}"`;
    case "COMPLETED": return `completed ${typeLabel} "${a.entityName}"`;
    case "MOVED":     return `moved ${typeLabel} "${a.entityName}" from ${meta.from ?? "?"} to ${meta.to ?? "?"}`;
    case "ASSIGNED":  return `assigned ${typeLabel} "${a.entityName}" to ${meta.assigned_to_name ?? "someone"}`;
    case "UPDATED":   return `updated ${meta.field ?? "field"} of ${typeLabel} "${a.entityName}"`;
    case "DELETED":   return `deleted ${typeLabel} "${a.entityName}"`;
    default:          return `${a.actionType.toLowerCase()} ${typeLabel} "${a.entityName}"`;
  }
}

/**
 * Hàm phân tích và tổng hợp dữ liệu tổng quan (Overview) từ danh sách công việc và lịch sử hoạt động.
 */
function deriveOverview(issues: IssueResponse[], activities: ActivityResponse[]): OverviewData {
  const total = issues.length;
  const done = issues.filter((i) => i.status === "DONE").length;
  const inProgress  = issues.filter((i) => i.status === "IN_PROGRESS").length; 

  const overdue = issues.filter(
    (i) => i.deadline && getDaysLeft(i.deadline) < 0 && i.status !== "DONE",
  ).length;
  const dueSoon = issues.filter(
    (i) =>
      i.deadline &&
      getDaysLeft(i.deadline) >= 0 &&
      getDaysLeft(i.deadline) <= 7 &&
      i.status !== "DONE",
  ).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  // Timeline — issues with deadline, sorted by daysLeft
  const timelineTasks: OverviewIssue[] = issues
    .filter((i) => i.deadline)
    .map((i) => ({
      ...i,
      daysLeft: getDaysLeft(i.deadline!),
      deadlineLabel: fmtDeadline(i.deadline!),
    }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // Attention — overdue first, then due soon, top 5
  const attentionTasks: OverviewIssue[] = [
    ...issues.filter((i) => i.deadline && getDaysLeft(i.deadline) < 0 && i.status !== "DONE"),
    ...issues.filter((i) => i.deadline && getDaysLeft(i.deadline) >= 0 && i.status !== "DONE"),
  ]
    .slice(0, 5)
    .map((i) => ({
      ...i,
      daysLeft: getDaysLeft(i.deadline!),
      deadlineLabel: fmtDeadline(i.deadline!),
    }));

  // Milestones — use EPICs
  const epics = issues.filter((i) => i.issueType === "EPIC");
  const milestones: MilestoneItem[] = epics.map((epic) => {
    const children = issues.filter((i) => i.parentId === epic.id);
    const all = [epic, ...children];
    const prog = Math.round(all.reduce((s, i) => s + computeProgress(i), 0) / all.length);
    return {
      id: epic.id,
      name: epic.issueName,
      deadline: epic.deadline ? fmtDeadline(epic.deadline) : "No deadline",
      status: apiStatusToUI(epic.status),
      progress: prog,
      taskCount: all.length,
    };
  });

  // Workload — count per assignee
  const workloadMap = new Map<string, WorkloadItem>();
  issues.forEach((i) => {
    if (!i.assignees) return;
    i.assignees.forEach((assignee) => {
      const { id, profileName, picture } = assignee;
      if (!workloadMap.has(id)) {
        workloadMap.set(id, {
          id,
          name: profileName,
          picture: avatarUrl(profileName, picture),
          email: "",
          count: 0,
        });
      }
      workloadMap.get(id)!.count += 1;
    });
  });
  const workload = Array.from(workloadMap.values()).sort((a, b) => b.count - a.count);
  const maxWorkload = Math.max(...workload.map((w) => w.count), 1);

  // Recent activity
  const activityItems: ActivityItem[] = activities.map((a) => ({
    id: a.id,
    actorName: a.actorName,
    actorPicture: avatarUrl(a.actorName, a.actorPicture),
    action: actionLabel(a),
    time: fmtRelative(a.createdAt),
  }));

  return {
    totalTasks: total,
    doneTasks: done,
    inProgressTasks: inProgress, 
    overdueCount: overdue,
    dueSoonCount: dueSoon,
    overallProgress: progress,
    timelineTasks,
    attentionTasks,
    milestones,
    workload,
    maxWorkload,
    activities: activityItems,
  };
}

//  Hook 

export interface UseOverviewReturn {
  data: OverviewData | null;
  error: string | null;
  reload: () => void;
}

/**
 * Hook useOverview tải thông tin tóm tắt dự án, bao gồm số liệu công việc hoàn thành,
 * quá hạn, sắp tới hạn, biểu đồ tải công việc thành viên và luồng hoạt động gần đây.
 */
export function useOverview(): UseOverviewReturn {
  const { projectId } = useContext(ProjectContext);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const [prevProjectId, setPrevProjectId] = useState(projectId);
  const [prevTick, setPrevTick] = useState(tick);

  if (projectId !== prevProjectId || tick !== prevTick) {
    setPrevProjectId(projectId);
    setPrevTick(tick);
    setData(null);
    setError(null);
  }

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    Promise.all([
      issueApi.getAll(projectId),
      activityApi.getByProject(projectId, 20),
    ])
      .then(([issues, activities]) => {
        if (!cancelled) setData(deriveOverview(issues, activities));
      })
      .catch((err) => {
        console.error("useOverview: failed to load", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load overview");
      });

    return () => { cancelled = true; };
  }, [projectId, tick]);

  const reload = () => setTick((n) => n + 1);

  return { data, error, reload };
}