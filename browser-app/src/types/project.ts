import { type IconType } from "react-icons";
import { FaTasks, FaBook, FaRocket } from "react-icons/fa";

// Enums / literal types
export type TaskType = "task" | "story" | "epic";
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
  assigned_to: User[];   // multi-assignee
  deadline: string | null;
  status: Status;
  subtasks: Subtask[];
  parentId?: number | null;
  childIds?: number[];
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

// Constants
export const typeIconMap: Record<TaskType, IconType> = {
  task: FaTasks,
  story: FaBook,
  epic: FaRocket,
};

export const typeColorMap: Record<TaskType, string> = {
  task: "text-blue-700",
  story: "text-green-700",
  epic: "text-purple-700",
};

export const typeLabelMap: Record<TaskType, string> = {
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
  { label: string; headerColor: string; dotColor: string }
> = {
  to_do: {
    label: "To Do",
    headerColor: "border-gray-400",
    dotColor: "bg-gray-400",
  },
  in_progress: {
    label: "In Progress",
    headerColor: "border-blue-500",
    dotColor: "bg-blue-500",
  },
  done: {
    label: "Done",
    headerColor: "border-green-500",
    dotColor: "bg-green-500",
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
