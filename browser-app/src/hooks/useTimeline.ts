/**
 * @file useTimeline.ts
 * @description Hook quản lý dữ liệu và chuyển đổi cấu trúc sự vụ sang định dạng biểu đồ Gantt (Timeline).
 * @author Warmdrobe
 */

import { useState, useEffect } from "react";
import { issueApi } from "../api/services/issueApi";
import { taskToGantt } from "../project/timeline/timelineUtils";
import type { GanttTask } from "../project/timeline/timelineUtils";
import type { IssueResponse } from "../api/contracts/issue";
import { issueToTask } from "../utils/issueMapper";

const TYPE_DURATION: Record<IssueResponse["issueType"], number> = {
  TASK: 7,
  STORY: 14,
  EPIC: 28,
};

/**
 * Cộng thêm số ngày vào một đối tượng Date.
 * @param date Đối tượng Date gốc
 * @param days Số ngày cộng thêm
 */
function addDaysToDate(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Chuyển đổi một đối tượng IssueResponse của API thành đối tượng GanttTask dùng cho thư viện Timeline.
 * @param issue Đối tượng issue từ API BE
 */
function issueToGantt(issue: IssueResponse): GanttTask {
  const minimalTask = issueToTask(issue);
  const gantt = taskToGantt(minimalTask);
  const start = new Date(issue.createdAt);
  const end = issue.deadline
    ? new Date(issue.deadline)
    : addDaysToDate(start, TYPE_DURATION[issue.issueType]);
  return { ...gantt, id: issue.id, start, end };
}

//  Hook 

export interface UseTimelineReturn {
  ganttTasks: GanttTask[];
  error: string | null;
  reload: () => void;
}

/**
 * Hook useTimeline tải danh sách các sự vụ của dự án và chuyển đổi chúng thành dạng dữ liệu Timeline Gantt.
 * @param projectId ID định danh dự án hiện tại
 */
export function useTimeline(projectId: string | null): UseTimelineReturn {
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    issueApi
      .getAll(projectId)
      .then((issues) => {
        if (!cancelled) setGanttTasks(issues.map(issueToGantt));
      })
      .catch((err) => {
        console.error("useTimeline: failed to load issues", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load timeline data");
      });

    return () => { cancelled = true; };
  }, [projectId, tick]);

  const reload = () => setTick((n) => n + 1);

  return { ganttTasks, error, reload };
}