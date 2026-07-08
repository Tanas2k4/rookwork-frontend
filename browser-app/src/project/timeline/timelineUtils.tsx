import type { TaskType } from "../../types/project";
import type { IssueResponse } from "../../api/contracts/issue";
import type { ProjectStatusResponse } from "../../api/contracts/projectStatus";
import { addDays, diffDays } from "../../utils/date";
import { avatarUrl } from "../../utils/avatar";

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
  _statusId?: string;
  _statusMeta?: ProjectStatusResponse | null;
  dependencyIds?: string[];
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

const TYPE_DURATION: Record<string, number> = {
  task: 7,
  story: 14,
  epic: 28,
};

function statusToGantt(s: ProjectStatusResponse | null | undefined): GanttTask["status"] {
  if (!s || !s.statusCategory) return "todo";
  const cat = s.statusCategory;
  if (cat === "TO_DO") return "todo";
  if (cat === "IN_PROGRESS") return "in_progress";
  return "done";
}

// simple string hash function for consistent avatar colors
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function issueToGantt(
  issue: IssueResponse,
  progress: number
): GanttTask {
  const rawGroupName = issue.issueType?.name || "Task";
  const groupName = rawGroupName.charAt(0).toUpperCase() + rawGroupName.slice(1).toLowerCase();

  const start = issue.startDate
    ? new Date(issue.startDate)
    : new Date(issue.createdAt);

  const duration = TYPE_DURATION[issue.issueType.name.toLowerCase()] || 7;
  const end = issue.deadline
    ? new Date(issue.deadline)
    : new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);

  return {
    id: issue.id,
    name: issue.issueName,
    start,
    end,
    progress,
    color: issue.issueType?.color || "#64748B",
    status: statusToGantt(issue.status),
    group: groupName,
    type: issue.issueType.name.toLowerCase() as any,
    assignees: Array.isArray(issue.assignees)
      ? issue.assignees.map((u) => ({
          id: u.id,
          name: u.profileName,
          avatar: avatarUrl(u.profileName, u.picture) || undefined,
          color: USER_COLORS[Math.abs(hashCode(u.id)) % USER_COLORS.length] || USER_COLORS[0],
        }))
      : [],
    _statusId: issue.status?.id || undefined,
    _statusMeta: issue.status || null,
    dependencyIds: issue.dependencyIds || [],
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
