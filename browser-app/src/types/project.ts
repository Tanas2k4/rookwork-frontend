import { type IconType } from "react-icons";
import { FaTasks, FaBook, FaRocket, FaCheckSquare } from "react-icons/fa";
import {
  LuBug,
  LuSparkles,
  LuBookOpen,
  LuFlag,
  LuSearch,
  LuWrench,
  LuFileText,
  LuTestTube,
  LuLifeBuoy,
} from "react-icons/lu";
import type { AttachmentResponse } from "../api/contracts/attachment";
import type { IssueTypeResponse } from "../api/contracts/issue";

// Enums / literal types
export type TaskType = string;
export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "to_do" | "in_progress" | "done";
export type TaskPriority = Priority;
export type TaskStatus = Status;

// Domain models
export interface User {
  id: number;
  email: string;
  display_name: string;
  avt: string;
}

export interface Subtask {
  id: number;
  title: string;
  done: boolean;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  type: TaskType;
  priority: Priority;
  assigned_to: User[]; // multi-assignee
  deadline: string | null;
  status: Status;
  subtasks: Subtask[];
  parentId?: number | null;
  childIds?: number[];
  attachments?: AttachmentResponse[];
  issueType: IssueTypeResponse;
}

export interface Comment {
  id: number;
  taskId: number;
  userId: number;
  content: string;
  createdAt: string;
  parentId?: number | null;
  replies?: Comment[];
}

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

// Icons Registry
export const issueTypeIcons: Record<string, IconType> = {
  task: FaTasks,
  story: FaBook,
  epic: FaRocket,
  bug: LuBug,
  sparkles: LuSparkles,
  "check-square": FaCheckSquare,
  "book-open": LuBookOpen,
  flag: LuFlag,
  search: LuSearch,
  wrench: LuWrench,
  "file-text": LuFileText,
  "test-tube": LuTestTube,
  "life-buoy": LuLifeBuoy,
};

// Constants (For backward compatibility and default system types)
export const typeIconMap: Record<string, IconType> = {
  task: FaTasks,
  story: FaBook,
  epic: FaRocket,
};

export const typeColorMap: Record<string, string> = {
  task: "text-blue-700",
  story: "text-green-700",
  epic: "text-purple-700",
};

export const typeLabelMap: Record<string, string> = {
  task: "Task",
  story: "Story",
  epic: "Epic",
};

export const priorityColorMap: Record<Priority, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  urgent: "bg-purple-500",
};

export const priorityLabelMap: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const priorities: Priority[] = ["low", "medium", "high", "urgent"];
export const statuses: Status[] = ["to_do", "in_progress", "done"];

export const statusMap: Record<
  Status,
  { label: string; headerColor: string; dotColor: string; badgeColor: string }
> = {
  to_do: {
    label: "To Do",
    headerColor: "border-gray-600",
    dotColor: "bg-gray-400",
    badgeColor: "bg-gray-100 text-gray-800",
  },
  in_progress: {
    label: "In Progress",
    headerColor: "border-blue-500",
    dotColor: "bg-blue-500",
    badgeColor: "bg-blue-100 text-blue-800",
  },
  done: {
    label: "Done",
    headerColor: "border-green-500",
    dotColor: "bg-green-500",
    badgeColor: "bg-green-100 text-green-800",
  },
};

/** Epic chứa Story, Story chứa Task */
export const childTypeMap: Partial<Record<TaskType, TaskType>> = {
  epic: "story",
  story: "task",
};

export const childLabelMap: Partial<Record<TaskType, string>> = {
  epic: "Stories",
  story: "Tasks",
};
