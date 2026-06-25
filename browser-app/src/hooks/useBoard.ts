/**
 * @file useBoard.ts
 * @description Hook quản lý trạng thái, dữ liệu và các hành động chính trên bảng Kanban (Kanban Board) của dự án.
 * @author Warmdrobe
 */

import { useState, useRef, useEffect, useCallback } from "react";
import type {
  Task,
  Status,
  Priority,
  TaskType,
  User,
  Subtask,
} from "../types/project";
import { statusMap, priorityLabelMap } from "../types/project";
import { issueApi } from "../api/services/issueApi";
import {
  uiTypeToApi,
  uiStatusToApi,
  uiPriorityToApi,
  uuidToId,
  idToUuid,
  issueToTask,
} from "../utils/issueMapper";
import { useToast } from "../hooks/useToast";

//  Hook 

/**
 * Hook quản lý trạng thái của Bảng công việc (Kanban Board).
 * Xử lý việc tải danh sách các sự vụ từ API, thêm mới, sửa, xóa, kéo thả sắp xếp lại các Task,
 * cũng như quản lý các công việc con (subtasks) ở local.
 * 
 * @param projectId ID định danh của dự án hiện tại
 */
export function useBoard(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { toasts, addToast: pushToast, removeToast } = useToast();
  const [loading, setLoading] = useState(false);

  const tempIdRef = useRef(-1);

  //  Load issues 

  const loadIssues = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const issues = await issueApi.getAll(projectId);
      // pre-register all UUIDs so childIds resolve correctly
      issues.forEach((i) => uuidToId(i.id));
      setTasks(issues.map((i) => issueToTask(i, issues)));
    } catch (err) {
      console.error("Failed to load issues", err);
      pushToast(err instanceof Error ? err.message : "Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [projectId, pushToast]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) loadIssues();
    });
    return () => {
      active = false;
    };
  }, [loadIssues]);

  //  Optimistic task updater 

  function updateTaskLocal(id: number, patch: Partial<Task & { _assigneeUuids?: string[] }>) {
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (selectedTask?.id === id)
      setSelectedTask((p) => (p ? { ...p, ...patch } : p));
  }

  //  Panel 

  function openTask(task: Task) {
    const fresh = tasks.find((t) => t.id === task.id) ?? task;
    setSelectedTask(fresh);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setTimeout(() => setSelectedTask(null), 300);
  }

  //  Create 

  async function createTask(title: string, type: TaskType, priority: Priority, status: Status) {
    if (!projectId) return;

    // Optimistic add with temp id
    const tempId = tempIdRef.current--;
    const tempTask: Task = {
      id: tempId,
      title,
      type,
      priority,
      status,
      assigned_to: [],
      deadline: null,
      subtasks: [],
      parentId: null,
      childIds: [],
    };
    setTasks((p) => [...p, tempTask]);
    pushToast("Creating task...", "info");

    try {
      const created = await issueApi.create(projectId, {
        issueName: title,
        issueType: uiTypeToApi(type),
        priority: uiPriorityToApi(priority),
        status: uiStatusToApi(status),
      });

      uuidToId(created.id); // register uuid
      const realTask = issueToTask(created, []);

      setTasks((p) => p.map((t) => (t.id === tempId ? realTask : t)));
      pushToast("Task created");
      return realTask;
    } catch (err) {
      setTasks((p) => p.filter((t) => t.id !== tempId));
      pushToast(err instanceof Error ? err.message : "Failed to create task", "error");
    }
  }

  //  Delete 

  async function deleteTask(task: Task) {
    if (!projectId) return;
    const uuid = (task as Task & { _uuid?: string })._uuid ?? idToUuid(task.id);
    if (!uuid) return;

    // Optimistic remove
    setTasks((p) => p.filter((t) => t.id !== task.id));
    closePanel();
    pushToast("Task deleted", "info");

    try {
      await issueApi.delete(projectId, uuid);
    } catch (err) {
      // Rollback
      setTasks((p) => [...p, task]);
      pushToast(err instanceof Error ? err.message : "Failed to delete task", "error");
    }
  }

  //  Update helpers 

  async function patchIssue(taskId: number, patch: Parameters<typeof issueApi.update>[2]) {
    if (!projectId) return;
    // Find uuid from stored _uuid on task object first, fallback to reverse map
    const task = tasks.find((t) => t.id === taskId) as (Task & { _uuid?: string }) | undefined;
    const uuid = task?._uuid ?? idToUuid(taskId);
    if (!uuid) return;
    try {
      await issueApi.update(projectId, uuid, patch);
    } catch (err) {
      console.error("Failed to update issue", err);
      pushToast(err instanceof Error ? err.message : "Failed to save change", "error");
    }
  }

  function saveTitle(title: string) {
    if (!selectedTask || !title.trim()) return;
    const cleanTitle = title.trim();
    if (selectedTask.title === cleanTitle) return;
    updateTaskLocal(selectedTask.id, { title: cleanTitle });
    pushToast("Title updated");
    patchIssue(selectedTask.id, { issueName: cleanTitle });
  }

  function saveDescription(description: string) {
    if (!selectedTask) return;
    if ((selectedTask.description ?? "") === (description ?? "")) return;
    updateTaskLocal(selectedTask.id, { description });
    pushToast("Description updated");
    patchIssue(selectedTask.id, { description });
  }

  function changeStatus(s: Status) {
    if (!selectedTask) return;
    if (selectedTask.status === s) return;
    updateTaskLocal(selectedTask.id, { status: s });
    pushToast(`Status → ${statusMap[s].label}`);
    patchIssue(selectedTask.id, { status: uiStatusToApi(s) });
  }

  function changeTaskStatus(task: Task, newStatus: Status) {
    if (task.status === newStatus) return;
    updateTaskLocal(task.id, { status: newStatus });
    pushToast(`${task.title} moved to ${statusMap[newStatus].label}`);
    patchIssue(task.id, { status: uiStatusToApi(newStatus) });
  }

  function changePriority(p: Priority) {
    if (!selectedTask) return;
    if (selectedTask.priority === p) return;
    updateTaskLocal(selectedTask.id, { priority: p });
    pushToast(`Priority → ${priorityLabelMap[p]}`);
    patchIssue(selectedTask.id, { priority: uiPriorityToApi(p) });
  }

  function changeAssignee(users: User[]) {
    if (!selectedTask) return;
    const currentUuids = ((selectedTask as any)._assigneeUuids as string[] | undefined) ?? [];
    const newUuids = users.map((u) => (u as any)._uuid ?? (u as any).uuid ?? "").filter(Boolean);
    // shallow compare
    if (JSON.stringify([...currentUuids].sort()) === JSON.stringify([...newUuids].sort())) return;
    updateTaskLocal(selectedTask.id, { assigned_to: users, _assigneeUuids: newUuids } as any);
    pushToast(users.length > 0 ? `Assigned to ${users.map((u) => u.display_name).join(", ")}` : "Unassigned");
    patchIssue(selectedTask.id, { assigneeIds: newUuids.length > 0 ? newUuids : [] });
  }

  function saveDeadline(val: string) {
    if (!selectedTask) return;
    const date = val ? val.split("T")[0] : null;
    if (selectedTask.deadline === date) return;
    updateTaskLocal(selectedTask.id, { deadline: date });
    pushToast("Deadline updated");
    // UpdateIssueRequest.deadline is LocalDate → send "YYYY-MM-DD" only
    patchIssue(selectedTask.id, { deadline: date ?? undefined });
  }

  // linkchild
  async function linkChild(parentId: number, childId: number) {
    if (!projectId) {
      pushToast("No projectId available", "error");
      return;
    }

    const parentTask = tasks.find((t) => t.id === parentId) as (Task & { _uuid?: string }) | undefined;
    const childTask = tasks.find((t) => t.id === childId) as (Task & { _uuid?: string }) | undefined;

    const parentUuid = parentTask?._uuid ?? idToUuid(parentId);
    const childUuid = childTask?._uuid ?? idToUuid(childId);

    if (!childUuid) {
      pushToast("Cannot find UUID of child task", "error");
      return;
    }

    // Optimistic update - Update UI immediately
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === parentId) {
          return { ...t, childIds: [...(t.childIds ?? []), childId] };
        }
        if (t.id === childId) {
          return { ...t, parentId };
        }
        return t;
      })
    );

    // Also update selected task if it's the parent
    if (selectedTask?.id === parentId) {
      setSelectedTask((p) =>
        p ? { ...p, childIds: [...(p.childIds ?? []), childId] } : p
      );
    }

    // Call API to save to database
    try {
      await issueApi.update(projectId, childUuid, {
        parentId: parentUuid,
      });
      pushToast("Linked successfully ✓");
    } catch (err) {
      console.error("Link child API error:", err);

      // Rollback on failure
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === parentId) {
            return { ...t, childIds: (t.childIds ?? []).filter((id) => id !== childId) };
          }
          if (t.id === childId) {
            return { ...t, parentId: null };
          }
          return t;
        })
      );

      if (selectedTask?.id === parentId) {
        setSelectedTask((p) =>
          p ? { ...p, childIds: (p.childIds ?? []).filter((id) => id !== childId) } : p
        );
      }

      pushToast(err instanceof Error ? err.message : "Failed to link - Changes reverted", "error");
    }
  }

  // unlinkchild
  async function unlinkChild(parentId: number, childId: number) {
    if (!projectId) return;

    const childTask = tasks.find((t) => t.id === childId) as (Task & { _uuid?: string }) | undefined;
    const childUuid = childTask?._uuid ?? idToUuid(childId);

    if (!childUuid) {
      pushToast("Cannot find UUID of task", "error");
      return;
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === parentId) {
          return { ...t, childIds: (t.childIds ?? []).filter((id) => id !== childId) };
        }
        if (t.id === childId) {
          return { ...t, parentId: null };
        }
        return t;
      })
    );

    if (selectedTask?.id === parentId) {
      setSelectedTask((p) =>
        p ? { ...p, childIds: (p.childIds ?? []).filter((id) => id !== childId) } : p
      );
    }

    try {
      await issueApi.update(projectId, childUuid, { parentId: null });
      pushToast("Unlinked successfully", "info");
    } catch (err) {
      console.error("Unlink child API error:", err);
      pushToast(err instanceof Error ? err.message : "Failed to unlink", "error");
    }
  }

  //  Reorder (local only) 
  function reorderTasks(taskId: number, fromIndex: number, toIndex: number) {
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (!task) return prev;
      const sameStatusTasks = prev.filter((t) => t.status === task.status);
      sameStatusTasks.splice(fromIndex, 1);
      if (toIndex >= sameStatusTasks.length) {
        sameStatusTasks.push(task);
      } else {
        sameStatusTasks.splice(toIndex, 0, task);
      }
      let reorderedIndex = 0;
      return prev.map((t) => {
        if (t.status === task.status) {
          return sameStatusTasks[reorderedIndex++];
        }
        return t;
      });
    });
    pushToast("Task reordered");
  }

  //  Subtasks (local only — no subtask API yet) 

  function toggleSubtask(subtaskId: number) {
    if (!selectedTask) return;
    const updated = selectedTask.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, done: !s.done } : s,
    );
    updateTaskLocal(selectedTask.id, { subtasks: updated });
  }

  function addSubtask(title: string) {
    if (!selectedTask || !title.trim()) return;
    const newSub: Subtask = {
      id: tempIdRef.current--,
      title: title.trim(),
      done: false,
    };
    updateTaskLocal(selectedTask.id, {
      subtasks: [...selectedTask.subtasks, newSub],
    });
    pushToast("Subtask added");
  }

  function deleteSubtask(subtaskId: number) {
    if (!selectedTask) return;
    updateTaskLocal(selectedTask.id, {
      subtasks: selectedTask.subtasks.filter((s) => s.id !== subtaskId),
    });
    pushToast("Subtask removed", "info");
  }

  return {
    tasks,
    selectedTask,
    panelOpen,
    toasts,
    loading,
    openTask,
    closePanel,
    linkChild,
    unlinkChild,
    createTask,
    deleteTask,
    saveTitle,
    saveDescription,
    changeStatus,
    changeTaskStatus,
    changePriority,
    changeAssignee,
    saveDeadline,
    reorderTasks,
    toggleSubtask,
    addSubtask,
    deleteSubtask,
    removeToast,
    reload: loadIssues,
  };
}