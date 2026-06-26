import type { ProjectResponse } from "./project";
import { getDaysLeft } from "../../utils/date";

export interface ProjectUI extends ProjectResponse {
  progress: number;
  accentColor: string;
  daysLeft: number | null;
}

const ACCENT_COLORS = ["#7c3aed", "#f59e0b", "#f43f5e", "#06b6d4", "#10b981"];

export function toProjectUI(p: ProjectResponse, index: number): ProjectUI {
  const daysLeft = p.deadline ? getDaysLeft(p.deadline) : null;

  const progress = p.totalIssues > 0
    ? Math.round((p.doneIssues / p.totalIssues) * 100)
    : 0;

  return {
    ...p,
    progress,
    accentColor: ACCENT_COLORS[index % ACCENT_COLORS.length],
    daysLeft,
  };
}