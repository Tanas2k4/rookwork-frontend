/**
 * @file useTimeline.ts
 * @description Hook quản lý dữ liệu và chuyển đổi cấu trúc sự vụ sang định dạng biểu đồ Gantt (Timeline).
 * @author Warmdrobe
 */

import { useState, useEffect, useContext } from "react";
import { issueApi } from "../api/services/issueApi";
import { issueToGantt } from "../project/timeline/timelineUtils";
import type { GanttTask } from "../project/timeline/timelineUtils";
import { ProjectContext } from "../context/ProjectContext";
import { computeAllProgress } from "../utils/progress";

//  Hook

export interface UseTimelineReturn {
  ganttTasks: GanttTask[];
  error: string | null;
  reload: () => void;
}

/**
 * Hook useTimeline tải danh sách các sự vụ của dự án và chuyển đổi chúng thành dạng dữ liệu Timeline Gantt.
 * Subscribe vào issueUpdateTick để tự động reload khi có thao tác cập nhật từ TaskModal.
 * @param projectId ID định danh dự án hiện tại
 */
export function useTimeline(projectId: string | null): UseTimelineReturn {
  const { issueUpdateTick } = useContext(ProjectContext);
  const [ganttTasks, setGanttTasks] = useState<GanttTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    issueApi
      .getAll(projectId)
      .then((issues) => {
        if (!cancelled) {
          const progressMap = computeAllProgress(issues);
          setGanttTasks(issues.map((i) => issueToGantt(i, progressMap[i.id] || 0)));
        }
      })
      .catch((err) => {
        console.error("useTimeline: failed to load issues", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load timeline data");
      });

    return () => { cancelled = true; };
  // issueUpdateTick: khi SharedIssueModal cập nhật issue → tự reload
  }, [projectId, tick, issueUpdateTick]);

  const reload = () => setTick((n) => n + 1);

  return { ganttTasks, error, reload };
}