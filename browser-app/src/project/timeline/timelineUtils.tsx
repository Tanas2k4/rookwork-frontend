import type { Task, TaskType, TaskStatus } from "../../types/project";
import { addDays, diffDays } from "../../utils/date";

// Types
export type ViewMode = "day" | "week" | "month";

export interface Assignee {
  id: string;
  name: string;
  avatar?: string;
  color: string;
}

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  color?: string;
  assignees?: Assignee[];
  group?: string;
  status?: "todo" | "in_progress" | "done";
  type?: TaskType;
}

// Constants
export const COL_WIDTH_DAY = 60;
export const COL_WIDTH_WEEK = 120;
export const COL_WIDTH_MONTH = 200;
export const ROW_HEIGHT = 52;
export const LEFT_PANEL_W = 280;

export const STATUS_CONFIG: Record<
  "todo" | "in_progress" | "done",
  { label: string; dot: string }
> = {
  todo: { label: "To Do", dot: "bg-slate-400" },
  in_progress: { label: "In Progress", dot: "bg-blue-400" },
  done: { label: "Done", dot: "bg-emerald-400" },
};

// Adapter
const USER_COLORS = [
  "#f472b6",
  "#60a5fa",
  "#34d399",
  "#fb923c",
  "#a78bfa",
  "#f87171",
];

function statusToGantt(s: TaskStatus): GanttTask["status"] {
  if (s === "to_do") return "todo";
  if (s === "in_progress") return "in_progress";
  return "done";
}

function calcProgress(task: Task): number {
  if (task.status === "done") return 100;
  if (task.subtasks.length === 0) return task.status === "in_progress" ? 40 : 0;
  return Math.round(
    (task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100,
  );
}

function inferStart(task: Task): Date {
  const deadline = task.deadline
    ? new Date(task.deadline)
    : new Date("2026-03-15");
  const durationMap: Record<string, number> = { task: 7, story: 14, epic: 28 };
  const duration = durationMap[task.type.toLowerCase()] || 7;
  const d = new Date(deadline);
  d.setDate(d.getDate() - duration);
  return d;
}

export function taskToGantt(task: Task): GanttTask {
  const rawGroupName = task.issueType?.name || "Task";
  const groupName = rawGroupName.charAt(0).toUpperCase() + rawGroupName.slice(1).toLowerCase();

  return {
    id: String(task.id),
    name: task.title,
    start: inferStart(task),
    end: task.deadline ? new Date(task.deadline) : new Date("2026-03-15"),
    progress: calcProgress(task),
    color: task.issueType?.color || "#64748B",
    status: statusToGantt(task.status),
    group: groupName,
    type: task.type,
    assignees: Array.isArray(task.assigned_to)
      ? task.assigned_to.map((u) => ({
          id: String(u.id),
          name: u.display_name,
          avatar: u.avt,
          color: USER_COLORS[Math.abs(u.id - 1) % USER_COLORS.length] || USER_COLORS[0],
        }))
      : [],
  };
}

// Column builder
function getWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

export function buildTimelineColumns(
  start: Date,
  totalDays: number,
  mode: ViewMode,
): { label: string; start: Date; days: number; monthText: string; dayText: string }[] {
  const cols: { label: string; start: Date; days: number; monthText: string; dayText: string }[] = [];
  let cursor = new Date(start);

  if (mode === "day") {
    for (let i = 0; i < totalDays; i++) {
      cols.push({
        label: cursor.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
        }),
        start: new Date(cursor),
        days: 1,
        monthText: cursor.toLocaleDateString("en-US", { weekday: "short" }),
        dayText: cursor.toLocaleDateString("en-US", { day: "numeric" }),
      });
      cursor = addDays(cursor, 1);
    }
  } else if (mode === "week") {
    let weekStart = new Date(cursor);
    while (diffDays(start, cursor) < totalDays) {
      const days = Math.min(7, totalDays - diffDays(start, cursor));
      cols.push({
        label: `W${getWeekNumber(weekStart)} ${weekStart.toLocaleDateString("en-US", { month: "short" })}`,
        start: new Date(cursor),
        days,
        monthText: weekStart.toLocaleDateString("en-US", { month: "short" }),
        dayText: weekStart.toLocaleDateString("en-US", { day: "numeric" }),
      });
      cursor = addDays(cursor, 7);
      weekStart = new Date(cursor);
    }
  } else {
    while (cursor < addDays(start, totalDays)) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const daysLeft =
        new Date(year, month + 1, 0).getDate() - cursor.getDate() + 1;
      const days = Math.min(daysLeft, totalDays - diffDays(start, cursor));
      cols.push({
        label: cursor.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        start: new Date(cursor),
        days,
        monthText: cursor.toLocaleDateString("en-US", { year: "numeric" }),
        dayText: cursor.toLocaleDateString("en-US", { month: "long" }),
      });
      cursor = new Date(year, month + 1, 1);
    }
  }
  return cols;
}
