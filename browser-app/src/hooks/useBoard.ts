import { useState, useRef, useEffect, useCallback } from "react";
import type {
  Task,
  Comment,
  Toast,
  Status,
  Priority,
  TaskType,
  User,
  Subtask,
} from "../types/project";
import { statusMap, priorityLabelMap } from "../types/project";
import { issueApi } from "../api/services/issueApi";
import type { IssueResponse, IssueType, PriorityType, Status as ApiStatus, UserSummary } from "../api/contracts/issue";
import { formatNow } from "../utils/date";

//  Mapping helpers 

function apiTypeToUI(t: IssueType): TaskType {
  return t.toLowerCase() as TaskType;
}

function uiTypeToApi(t: TaskType): IssueType {
  return t.toUpperCase() as IssueType;
}

function apiStatusToUI(s: ApiStatus | null): Status {
  if (!s) return "to_do";
  const map: Record<ApiStatus, Status> = {
    TO_DO: "to_do",
    IN_PROGRESS: "in_progress",
    DONE: "done",
  };
  return map[s];
}

function uiStatusToApi(s: Status): ApiStatus {
  const map: Record<Status, ApiStatus> = {
    to_do: "TO_DO",
    in_progress: "IN_PROGRESS",
    done: "DONE",
  };
  return map[s];
}

function apiPriorityToUI(p: PriorityType | null): Priority {
  if (!p) return "medium";
  return p.toLowerCase() as Priority;
}

function uiPriorityToApi(p: Priority): PriorityType {
  return p.toUpperCase() as PriorityType;
}

function apiUserToUI(u: UserSummary): User {
  return {
    id: 0, // not used for API calls — we use u.id (string uuid) separately
    email: "",
    display_name: u.profileName,
    avt: u.picture ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.profileName)}&background=7c3aed&color=fff`,
    uuid: u.id, // store uuid for API usage
  } as User & { uuid: string };
}

let _taskIdCounter = 0;
const uuidToNumId = new Map<string, number>();

function uuidToId(uuid: string): number {
  if (!uuidToNumId.has(uuid)) {
    uuidToNumId.set(uuid, ++_taskIdCounter);
  }
  return uuidToNumId.get(uuid)!;
}

function idToUuid(id: number): string | undefined {
  for (const [uuid, numId] of uuidToNumId.entries()) {
    if (numId === id) return uuid;
  }
  return undefined;
}

function issueToTask(issue: IssueResponse, allIssues: IssueResponse[]): Task & { _uuid: string } {
  const children = allIssues
    .filter((i) => i.parentId === issue.id)
    .map((i) => uuidToId(i.id));

  return {
    id: uuidToId(issue.id),
    _uuid: issue.id,  // store real UUID for API calls
    title: issue.issueName,
    description: issue.description ?? undefined,
    type: apiTypeToUI(issue.issueType),
    priority: apiPriorityToUI(issue.priority),
    assigned_to: issue.assignedTo ? apiUserToUI(issue.assignedTo) : null,
    deadline: issue.deadline ? issue.deadline.split("T")[0] : null,
    status: apiStatusToUI(issue.status),
    subtasks: [],
    parentId: issue.parentId ? uuidToId(issue.parentId) : null,
    childIds: children,
  };
}

//  Hook 

export function useBoard(projectId: string | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(false);

  const toastIdRef = useRef(0);
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
      pushToast("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  //  Toast helpers 

  function pushToast(message: string, type: Toast["type"] = "success") {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }

  function removeToast(id: number) {
    setToasts((p) => p.filter((t) => t.id !== id));
  }

  //  Optimistic task updater 

  function updateTaskLocal(id: number, patch: Partial<Task>) {
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
      assigned_to: null,
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
    } catch {
      setTasks((p) => p.filter((t) => t.id !== tempId));
      pushToast("Failed to create task", "error");
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
    } catch {
      // Rollback
      setTasks((p) => [...p, task]);
      pushToast("Failed to delete task", "error");
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
      pushToast("Failed to save change", "error");
    }
  }

  function saveTitle(title: string) {
    if (!selectedTask || !title.trim()) return;
    updateTaskLocal(selectedTask.id, { title: title.trim() });
    pushToast("Title updated");
    patchIssue(selectedTask.id, { issueName: title.trim() });
  }

  function saveDescription(description: string) {
    if (!selectedTask) return;
    updateTaskLocal(selectedTask.id, { description });
    pushToast("Description updated");
    patchIssue(selectedTask.id, { description });
  }

  function changeStatus(s: Status) {
    if (!selectedTask) return;
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
    updateTaskLocal(selectedTask.id, { priority: p });
    pushToast(`Priority → ${priorityLabelMap[p]}`);
    patchIssue(selectedTask.id, { priority: uiPriorityToApi(p) });
  }

  function changeAssignee(u: User | null) {
    if (!selectedTask) return;
    updateTaskLocal(selectedTask.id, { assigned_to: u });
    pushToast(u ? `Assigned to ${u.display_name}` : "Unassigned");
    // uuid được attach vào User object bởi TaskPanelDetails dưới key "_uuid"
    const assigneeUuid = (u as (User & { _uuid?: string }) | null)?._uuid ?? null;
    patchIssue(selectedTask.id, { assignedToId: assigneeUuid ?? undefined });
  }

  function saveDeadline(val: string) {
    if (!selectedTask) return;
    const date = val ? val.split("T")[0] : null;
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

    pushToast("Failed to link - Changes reverted", "error");
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
    pushToast("Failed to unlink", "error");
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

  //  Comments (local only — no comment API yet) 

  const [localComments, setLocalComments] = useState<Comment[]>([]);

  function submitComment(content: string, parentId?: number) {
    if (!selectedTask || !content.trim()) return;
    const c: Comment = {
      id: tempIdRef.current--,
      taskId: selectedTask.id,
      userId: 0,
      content: content.trim(),
      createdAt: formatNow(),
      parentId: parentId ?? null,
    };
    setLocalComments((p) => [...p, c]);
    pushToast(parentId ? "Reply posted" : "Comment posted");
  }

  function editComment(id: number, content: string) {
    if (!content.trim()) return;
    setLocalComments((p) =>
      p.map((c) => (c.id === id ? { ...c, content: content.trim() } : c)),
    );
    pushToast("Comment updated");
  }

  function deleteComment(id: number) {
    setLocalComments((p) => p.filter((c) => c.id !== id));
    pushToast("Comment deleted", "info");
  }

  const taskComments = selectedTask
    ? localComments.filter((c) => c.taskId === selectedTask.id)
    : [];

  return {
    tasks,
    comments: localComments,
    taskComments,
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
    submitComment,
    editComment,
    deleteComment,
    removeToast,
    reload: loadIssues,
  };
}