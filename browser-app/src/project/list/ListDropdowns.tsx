// components/list/ListDropdowns.tsx
import type { RefObject } from "react";
import { IoClose } from "react-icons/io5";
import { MdCheck } from "react-icons/md";
import type { Task, User, Status, TaskType } from "../../types/project";
import type { DropdownState } from "../../hooks/useListView";
import { typeOptions, statusOptions } from "../shared/dropdownConstants";

interface Props {
  openDropdown: DropdownState;
  dropdownRef: RefObject<HTMLDivElement | null>;
  tasks: (Task & { _uuid: string })[];
  users: User[];
  onAssignUser: (taskId: string, user: User | null) => void;
  onStatusChange: (taskId: string, status: Status) => void;
  onTypeChange: (taskId: string, type: TaskType) => void;
  onDeadlineChange: (taskId: string, deadline: string) => void;
}

export function ListDropdowns({
  openDropdown, dropdownRef, tasks, users,
  onAssignUser, onStatusChange, onTypeChange, onDeadlineChange,
}: Props) {
  if (!openDropdown.type || !openDropdown.position) return null;

  const { top, left, maxHeight } = openDropdown.position;
  const taskId = openDropdown.taskId!;
  const currentTask = tasks.find((t) => t._uuid === taskId);

  const baseStyle = {
    position: "fixed" as const,
    top: `${top}px`,
    left: `${left}px`,
    zIndex: 100,
  };

  return (
    <>
      {openDropdown.type === "type" && (
        <div ref={dropdownRef} style={{ ...baseStyle, maxHeight: `${maxHeight}px` }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 w-44 overflow-y-auto" style={{ maxHeight: `${maxHeight - 16}px` }}>
            {typeOptions.map((t) => (
              <button key={t.value} onClick={() => onTypeChange(taskId, t.value)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition ${
                  currentTask?.type === t.value ? "bg-purple-50" : ""
                }`}>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1.5 ${t.color}`}>
                  {t.icon}{t.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {openDropdown.type === "user" && (
        <div ref={dropdownRef} style={{ ...baseStyle, maxHeight: `${maxHeight}px` }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 w-56 overflow-y-auto" style={{ maxHeight: `${maxHeight - 16}px` }}>
            {/* Unassign all */}
            <button onClick={() => onAssignUser(taskId, null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <IoClose size={14} className="text-gray-500" />
              </div>
              <span className="italic text-gray-500">Unassigned (clear all)</span>
            </button>
            <div className="border-t border-gray-200 my-1" />
            {users.map((u) => {
              const typedU = u as User & { _uuid?: string; uuid?: string };
              const assignedArr = (currentTask?.assigned_to ?? []) as (User & { _uuid?: string; uuid?: string })[];
              const userUuid = typedU._uuid ?? typedU.uuid ?? typedU.avt;
              const isSelected = assignedArr.some(
                (a) => (a._uuid ?? a.uuid ?? a.avt) === userUuid,
              );
              return (
                <button key={u.avt} onClick={() => onAssignUser(taskId, u)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-purple-50 rounded transition ${
                    isSelected ? "bg-purple-50/50 text-gray-700 font-medium" : "text-gray-700"
                  }`}>
                  <span className={`w-4 h-4 rounded flex items-center justify-center border transition shrink-0 ${
                    isSelected ? "bg-purple-900 border-purple-900" : "border-gray-300"
                  }`}>
                    {isSelected && <MdCheck size={11} className="text-white" />}
                  </span>
                  <img src={u.avt} className="w-6 h-6 rounded-full object-cover shrink-0" />
                  <span className="truncate">{u.display_name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {openDropdown.type === "date" && (
        <div ref={dropdownRef} style={baseStyle}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-64">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Deadline
          </p>
          <input
            type="datetime-local"
            value={currentTask?.deadline ? currentTask.deadline.slice(0, 16) : ""}
            onChange={(e) => onDeadlineChange(taskId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          {currentTask?.deadline && (
            <button
              onClick={() => onDeadlineChange(taskId, "")}
              className="mt-2 w-full text-xs text-gray-400 hover:text-red-500 transition text-center"
            >
              Clear deadline
            </button>
          )}
        </div>
      )}

      {openDropdown.type === "status" && (
        <div ref={dropdownRef} style={{ ...baseStyle, maxHeight: `${maxHeight}px` }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 w-44 overflow-y-auto" style={{ maxHeight: `${maxHeight - 16}px` }}>
            {statusOptions.map((s) => (
              <button key={s.value} onClick={() => onStatusChange(taskId, s.value)}
                className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-100 rounded transition ${
                  currentTask?.status === s.value ? "bg-purple-50" : ""
                }`}>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${s.color}`}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}