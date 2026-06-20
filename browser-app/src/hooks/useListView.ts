/**
 * @file useListView.ts
 * @description Hook quản lý trạng thái, tìm kiếm, lọc và các chức năng cập nhật trực tiếp trên giao diện danh sách (List View).
 * @author Warmdrobe
 */

import { useState, useRef, useEffect } from "react";
import { useContext } from "react";
import type { Task, Status, TaskType, User } from "../types/project";
import type { UpdateIssueRequest } from "../api/contracts/issue";
import { issueApi } from "../api/services/issueApi";
import { ProjectContext } from "../context/ProjectContext";
import {
  apiUserToUI,
  issueToTask,
  uiStatusToApi,
} from "../utils/issueMapper";
import { useToast } from "./useToast";
import { useClickOutside } from "./useClickOutside";

//  Types 

export interface DropdownState {
  type: "user" | "status" | "date" | "type" | null;
  taskId: string | null;
  position?: { top: number; left: number; maxHeight: number };
}

//  Hook 

/**
 * Hook quản lý trạng thái, tìm kiếm, bộ lọc và các dropdown chỉnh sửa nhanh 
 * của màn hình xem dạng danh sách (List View).
 */
export function useListView() {
  const { projectId } = useContext(ProjectContext);

  const [tasks, setTasks]                   = useState<(Task & { _uuid: string })[]>([]);
  const [users, setUsers]                   = useState<User[]>([]);
  const [searchQuery, setSearchQuery]       = useState("");
  const [filterOpen, setFilterOpen]         = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers]   = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes]   = useState<string[]>([]);
  const [openDropdown, setOpenDropdown]     = useState<DropdownState>({ type: null, taskId: null });
  const [tick, setTick]                     = useState(0);
  const { toasts, addToast, removeToast }   = useToast();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef   = useRef<HTMLDivElement>(null);

  //  Fetch issues 

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    issueApi
      .getAll(projectId)
      .then((issues) => {
        if (cancelled) return;
        const mapped = issues.map((i) => issueToTask(i, issues));
        setTasks(mapped);

        const seen = new Set<string>();
        const assignees: User[] = [];
        issues.forEach((i) => {
          if (i.assignedTo && !seen.has(i.assignedTo.id)) {
            seen.add(i.assignedTo.id);
            assignees.push(apiUserToUI(i.assignedTo));
          }
        });
        setUsers(assignees);
      })
      .catch(() => addToast("Failed to load issues", "error"));

    return () => { cancelled = true; };
  }, [projectId, tick, addToast]);

  //  Close on outside click 

  useClickOutside(dropdownRef, () => setOpenDropdown({ type: null, taskId: null }));
  useClickOutside(filterRef, () => setFilterOpen(false));

  //  Filter 

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch  = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus  = selectedStatuses.length === 0 || selectedStatuses.includes(task.status);
    const matchesUser    = selectedUsers.length === 0 || selectedUsers.includes((task.assigned_to as any)?.uuid ?? "");
    const matchesType    = selectedTypes.length === 0 || selectedTypes.includes(task.type);
    return matchesSearch && matchesStatus && matchesUser && matchesType;
  });

  //  Dropdown position 

  function openDropdownWithPosition(e: React.MouseEvent, type: DropdownState["type"], taskId: string) {
    const rect           = e.currentTarget.getBoundingClientRect();
    const spaceBelow     = window.innerHeight - rect.bottom;
    const spaceAbove     = rect.top;
    const estimatedHeight = type === "date" ? 120 : 200;

    let top       = rect.bottom + window.scrollY + 4;
    let maxHeight = Math.min(estimatedHeight, spaceBelow - 20);

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      top       = rect.top + window.scrollY - Math.min(estimatedHeight, spaceAbove - 20);
      maxHeight = Math.min(estimatedHeight, spaceAbove - 20);
    }

    setOpenDropdown({ type, taskId, position: { top, left: rect.left + window.scrollX, maxHeight } });
  }

  function closeDropdown() {
    setOpenDropdown({ type: null, taskId: null });
  }

  //  API update helper 

  async function updateIssue(taskId: string, data: UpdateIssueRequest, successMsg: string) {
    if (!projectId) return;
    try {
      await issueApi.update(projectId, taskId, data);
      addToast(successMsg, "success");
    } catch {
      addToast("Update failed. Please try again.", "error");
      // Rollback: reload from server
      setTick((n) => n + 1);
    }
  }

  //  Handlers 

  function handleAssignUser(taskId: string, user: User & { _uuid?: string } | null) {
    // Optimistic
    setTasks((p) => p.map((t) => t._uuid === taskId ? { ...t, assigned_to: user } : t));
    closeDropdown();

    const assignedToId = (user as (User & { _uuid?: string }) | null)?._uuid ?? null;
    updateIssue(taskId, { assignedToId: assignedToId ?? undefined }, 
      user ? `Assigned to ${user.display_name}` : "Assignee removed"
    );
  }

  function handleStatusChange(taskId: string, status: Status) {
    // Optimistic
    setTasks((p) => p.map((t) => t._uuid === taskId ? { ...t, status } : t));
    closeDropdown();

    updateIssue(taskId, { status: uiStatusToApi(status) }, `Status → ${status.replace("_", " ")}`);
  }

  function handleTypeChange(taskId: string, type: TaskType) {
    // Optimistic update only — issueType is not in UpdateIssueRequest
    setTasks((p) => p.map((t) => t._uuid === taskId ? { ...t, type } : t));
    closeDropdown();
    // NOTE: API không có field issueType trong UpdateIssueRequest, bỏ qua API call
  }

  function handleDeadlineChange(taskId: string, deadline: string) {
    // Optimistic
    setTasks((p) => p.map((t) => t._uuid === taskId ? { ...t, deadline: deadline || null } : t));
    closeDropdown();

    // datetime-local trả về "YYYY-MM-DDTHH:mm", Spring nhận "YYYY-MM-DDTHH:mm:ss"
    const formatted = deadline ? `${deadline}:00` : undefined;
    updateIssue(taskId, { deadline: formatted },
      deadline ? "Deadline updated" : "Deadline cleared"
    );
  }

  //  Filter toggles 

  function toggleFilterStatus(status: string) {
    setSelectedStatuses((p) => p.includes(status) ? p.filter((s) => s !== status) : [...p, status]);
  }

  function toggleFilterUser(uuid: string) {
    setSelectedUsers((p) => p.includes(uuid) ? p.filter((id) => id !== uuid) : [...p, uuid]);
  }

  function toggleFilterType(type: string) {
    setSelectedTypes((p) => p.includes(type) ? p.filter((t) => t !== type) : [...p, type]);
  }

  function clearFilters() {
    setSelectedStatuses([]);
    setSelectedUsers([]);
    setSelectedTypes([]);
  }

  const hasActiveFilters = selectedStatuses.length > 0 || selectedUsers.length > 0 || selectedTypes.length > 0;

  const reload = () => setTick((n) => n + 1);

  return {
    tasks,
    filteredTasks,
    users,
    searchQuery,
    setSearchQuery,
    filterOpen,
    setFilterOpen,
    selectedStatuses,
    selectedUsers,
    selectedTypes,
    toggleFilterStatus,
    toggleFilterUser,
    toggleFilterType,
    clearFilters,
    hasActiveFilters,
    openDropdown,
    dropdownRef,
    filterRef,
    openDropdownWithPosition,
    closeDropdown,
    handleAssignUser,
    handleStatusChange,
    handleTypeChange,
    handleDeadlineChange,
    toasts,
    removeToast,
    reload,
  };
}