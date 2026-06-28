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
  uiTypeToApi,
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
  const { projectId, issueUpdateTick } = useContext(ProjectContext);

  const [tasks, setTasks] = useState<(Task & { _uuid: string; _assigneeUuids: string[] })[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<DropdownState>({ type: null, taskId: null });
  const [tick, setTick] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;
  const { toasts, addToast, removeToast } = useToast();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

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
          (i.assignees ?? []).forEach((u) => {
            if (!seen.has(u.id)) {
              seen.add(u.id);
              assignees.push(apiUserToUI(u));
            }
          });
        });
        setUsers(assignees);
      })
      .catch((err) => addToast(err instanceof Error ? err.message : "Failed to load issues", "error"));

    return () => { cancelled = true; };
  // issueUpdateTick: khi SharedIssueModal cập nhật issue → tự reload list
  }, [projectId, tick, issueUpdateTick, addToast]);

  //  Close on outside click 

  useClickOutside(dropdownRef, () => setOpenDropdown({ type: null, taskId: null }));
  useClickOutside(filterRef, () => setFilterOpen(false));

  //  Filter 

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(task.status);
    const matchesUser =
      selectedUsers.length === 0 ||
      task.assigned_to.some((u) => {
        const typedU = u as User & { _uuid?: string; uuid?: string };
        return selectedUsers.includes(typedU._uuid ?? typedU.uuid ?? typedU.avt);
      });
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(task.type);
    return matchesSearch && matchesStatus && matchesUser && matchesType;
  });

  //  Pagination 

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedTasks = filteredTasks.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, selectedStatuses, selectedUsers, selectedTypes]);

  //  Dropdown position 

  function openDropdownWithPosition(e: React.MouseEvent, type: DropdownState["type"], taskId: string) {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = type === "date" ? 120 : 200;

    let top = rect.bottom + window.scrollY + 4;
    let maxHeight = Math.min(estimatedHeight, spaceBelow - 20);

    if (spaceBelow < estimatedHeight && spaceAbove > spaceBelow) {
      top = rect.top + window.scrollY - Math.min(estimatedHeight, spaceAbove - 20);
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
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Update failed. Please try again.", "error");
      // Rollback: reload from server
      setTick((n) => n + 1);
    }
  }

  //  Handlers 

  function handleAssignUser(taskId: string, user: (User & { uuid?: string; _uuid?: string }) | null) {
    const task = tasks.find((t) => t._uuid === taskId);
    if (!task) return;

    const currentUuids = task._assigneeUuids ?? [];
    const clickedUuid = user?.uuid ?? user?._uuid ?? null;

    let newUuids: string[];
    let newUsers: User[];

    if (clickedUuid === null) {
      // "Unassigned" clicked — xóa hết
      newUuids = [];
      newUsers = [];
    } else if (currentUuids.includes(clickedUuid)) {
      // toggle off
      newUuids = currentUuids.filter((id) => id !== clickedUuid);
      newUsers = (task.assigned_to as (User & { _uuid?: string; uuid?: string })[]).filter(
        (u) => (u._uuid ?? u.uuid) !== clickedUuid,
      );
    } else {
      // toggle on
      newUuids = [...currentUuids, clickedUuid];
      newUsers = [...(task.assigned_to as User[]), user!];
    }

    // Optimistic update
    setTasks((p) =>
      p.map((t) =>
        t._uuid === taskId
          ? { ...t, assigned_to: newUsers, _assigneeUuids: newUuids }
          : t,
      ),
    );

    updateIssue(
      taskId,
      { assigneeIds: newUuids },
      newUsers.length > 0
        ? `Assigned to ${newUsers.map((u) => u.display_name).join(", ")}`
        : "Assignee removed",
    );
  }

  function handleStatusChange(taskId: string, status: Status) {
    const task = tasks.find((t) => t._uuid === taskId);
    if (!task) return;
    if (task.status === status) {
      closeDropdown();
      return;
    }

    // Optimistic
    setTasks((p) => p.map((t) => t._uuid === taskId ? { ...t, status } : t));
    closeDropdown();

    updateIssue(taskId, { status: uiStatusToApi(status) }, `Status → ${status.replace("_", " ")}`);
  }

  function handleTypeChange(taskId: string, type: TaskType) {
    // Optimistic
    setTasks((p) => p.map((t) => t._uuid === taskId ? { ...t, type } : t));
    closeDropdown();

    updateIssue(taskId, { issueType: uiTypeToApi(type) }, `Type → ${type}`);
  }

  function handleDeadlineChange(taskId: string, deadline: string) {
    const task = tasks.find((t) => t._uuid === taskId);
    if (!task) return;
    const currentDeadline = task.deadline ? task.deadline.split("T")[0] : "";
    const newDeadline = deadline ? deadline.split("T")[0] : "";
    if (currentDeadline === newDeadline) {
      closeDropdown();
      return;
    }

    // Optimistic
    setTasks((p) => p.map((t) => t._uuid === taskId ? { ...t, deadline: deadline || null } : t));
    closeDropdown();

    // UpdateIssueRequest.deadline is LocalDate → send "YYYY-MM-DD" only
    const formatted = deadline ? deadline.split("T")[0] : undefined;
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

  //  Pagination handlers 

  function goToPage(page: number) {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }

  function goToPrevPage() { goToPage(safePage - 1); }
  function goToNextPage() { goToPage(safePage + 1); }

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
    pagedTasks,
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
    currentPage: safePage,
    totalPages,
    goToPage,
    goToPrevPage,
    goToNextPage,
    PAGE_SIZE,
  };
}