import { useState, useRef, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { MdOutlineExpandMore, MdCheck } from "react-icons/md";
import type { Task, Status, Priority, User } from "../../../types/project";
import {
  statuses,
  statusMap,
  priorities,
  priorityColorMap,
  priorityLabelMap,
} from "../../../types/project";
import { useProject } from "../../../hooks/useProject";
import { formatDeadline } from "../../shared/dropdownConstants";

interface Props {
  task: Task;
  onChangeStatus: (s: Status) => void;
  onChangePriority: (p: Priority) => void;
  onChangeAssignee: (users: User[]) => void;
  onSaveDeadline: (val: string) => void;
}

export function TaskPanelDetails({
  task,
  onChangeStatus,
  onChangePriority,
  onChangeAssignee,
  onSaveDeadline,
}: Props) {
  const { members } = useProject();

  const [showStatusDd,    setShowStatusDd]    = useState(false);
  const [showPriorityDd,  setShowPriorityDd]  = useState(false);
  const [showAssigneeDd,  setShowAssigneeDd]  = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineValue,   setDeadlineValue]   = useState(task.deadline ?? "");
  const assigneeDdRef = useRef<HTMLDivElement>(null);

  // Close assignee dropdown on outside click
  useEffect(() => {
    if (!showAssigneeDd) return;
    function handler(e: MouseEvent) {
      if (assigneeDdRef.current && !assigneeDdRef.current.contains(e.target as Node)) {
        setShowAssigneeDd(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAssigneeDd]);

  function closeAll() {
    setShowStatusDd(false);
    setShowPriorityDd(false);
    setShowAssigneeDd(false);
  }

  const memberUsers = members.map((m) => ({
    id: 0,
    email: "",
    display_name: m.profileName,
    avt:
      m.picture ??
      `https://ui-avatars.com/api/?name=${encodeURIComponent(m.profileName)}&background=7c3aed&color=fff`,
    _uuid: m.id,
  }));

  // Current assignee UUIDs
  const currentAssignees = (task.assigned_to ?? []) as (User & { _uuid?: string; uuid?: string })[];
  const currentUuids = new Set(
    currentAssignees.map((u) => (u as any)._uuid ?? (u as any).uuid ?? ""),
  );

  function toggleMember(member: (typeof memberUsers)[0]) {
    const uuid = member._uuid;
    let newList: User[];
    if (currentUuids.has(uuid)) {
      newList = currentAssignees.filter(
        (u) => ((u as any)._uuid ?? (u as any).uuid) !== uuid,
      );
    } else {
      newList = [...currentAssignees, member];
    }
    onChangeAssignee(newList);
  }

  const avatarStack = currentAssignees.slice(0, 3);
  const extraCount = currentAssignees.length - 3;

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
      {/* Status */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Status
        </p>
        <div className="relative inline-block border border-gray-400 px-2 rounded-md">
          <button
            onClick={() => { setShowStatusDd((p) => !p); setShowPriorityDd(false); setShowAssigneeDd(false); }}
            className="flex items-center gap-1.5 text-sm text-gray-700 px-2 py-1 transition"
          >
            <span className={`w-2 h-2 rounded-full ${statusMap[task.status].dotColor}`} />
            {statusMap[task.status].label}
            <MdOutlineExpandMore size={16} className="text-gray-400" />
          </button>
          {showStatusDd && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-40">
              {statuses.map((s) => (
                <button key={s}
                  onClick={() => { onChangeStatus(s); closeAll(); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    task.status === s ? "text-purple-700 font-medium" : "text-gray-700"
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${statusMap[s].dotColor}`} />
                  {statusMap[s].label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Priority */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Priority
        </p>
        <div className="relative inline-block border border-gray-400 px-2 rounded-md">
          <button
            onClick={() => { setShowPriorityDd((p) => !p); setShowStatusDd(false); setShowAssigneeDd(false); }}
            className="flex items-center gap-2 text-sm text-gray-700 px-2 py-1 transition"
          >
            {priorityLabelMap[task.priority]}
            <div className="flex gap-0.5 h-1.5 w-14">
              {priorities.map((p, i) => (
                <div key={p} className={`flex-1 rounded-sm ${
                  i <= priorities.indexOf(task.priority) ? priorityColorMap[p] : "bg-gray-200"
                }`} />
              ))}
            </div>
            <MdOutlineExpandMore size={16} className="text-gray-400" />
          </button>
          {showPriorityDd && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-40">
              {priorities.map((p) => (
                <button key={p}
                  onClick={() => { onChangePriority(p); closeAll(); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${
                    task.priority === p ? "text-purple-700 font-medium" : "text-gray-700"
                  }`}>
                  <span className={`w-2 h-2 rounded-full ${priorityColorMap[p]}`} />
                  {priorityLabelMap[p]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deadline */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Deadline
        </p>
        {editingDeadline ? (
          <input
            autoFocus
            type="datetime-local"
            value={deadlineValue ? deadlineValue.slice(0, 16) : ""}
            onChange={(e) => setDeadlineValue(e.target.value)}
            onBlur={() => { onSaveDeadline(deadlineValue); setEditingDeadline(false); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setEditingDeadline(false);
              if (e.key === "Enter") { onSaveDeadline(deadlineValue); setEditingDeadline(false); }
            }}
            className="text-sm text-gray-700 outline-none border-b border-gray-400 bg-transparent"
          />
        ) : (
          <p
            onDoubleClick={() => { setDeadlineValue(task.deadline ?? ""); setEditingDeadline(true); }}
            className="text-sm text-gray-700 cursor-default hover:bg-gray-50 rounded px-2 py-1 -ml-2 transition inline-block"
            title="Double-click to edit"
          >
            {formatDeadline(task.deadline ?? "")}
          </p>
        )}
      </div>

      {/* Assignees — multi-select */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Assigned To
        </p>
        <div className="relative" ref={assigneeDdRef}>
          <button
            onClick={() => { setShowAssigneeDd((p) => !p); setShowStatusDd(false); setShowPriorityDd(false); }}
            className="flex items-center gap-2 text-sm text-gray-700 px-2 py-1 border border-gray-400 rounded-md transition hover:bg-gray-50 max-w-44"
          >
            {currentAssignees.length > 0 ? (
              <div className="flex items-center gap-1">
                {/* Avatar stack */}
                <div className="flex -space-x-2">
                  {avatarStack.map((u, i) => (
                    <img
                      key={i}
                      src={u.avt}
                      title={u.display_name}
                      className="w-5 h-5 rounded-full border-2 border-white shrink-0"
                    />
                  ))}
                  {extraCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-purple-700 shrink-0">
                      +{extraCount}
                    </span>
                  )}
                </div>
                <span className="truncate text-xs text-gray-600 max-w-20">
                  {currentAssignees.length === 1
                    ? currentAssignees[0].display_name
                    : `${currentAssignees.length} people`}
                </span>
              </div>
            ) : (
              <span className="italic text-gray-400">
                Unassigned</span>
            )}
            <MdOutlineExpandMore size={16} className="text-gray-400 shrink-0 ml-auto" />
          </button>

          {showAssigneeDd && (
            <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-56">
              {/* Clear all */}
              <button
                onClick={() => onChangeAssignee([])}
                className="w-full text-left pl-3 py-1.5 text-sm text-gray-500 italic hover:bg-gray-50 flex items-center"
              >
                <div className="p-1.5 bg-gray-200 rounded-full ml-1">
                  <IoClose size={14} className=" text-gray-500" />
                </div>
                <span className="w-3 h-4" />
                Unassigned (clear all)
              </button>
              <div className="border-t border-gray-100 my-1" />
              {memberUsers.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400 italic">No members found</p>
              ) : (
                memberUsers.map((u, i) => {
                  const isSelected = currentUuids.has(u._uuid);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleMember(u)}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 flex items-center gap-2 ${
                        isSelected ? " font-medium bg-purple-50/50" : "text-gray-700"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        isSelected
                          ? "bg-purple-900 border-purple-900"
                          : "border-gray-300"
                      }`}>
                        {isSelected && <MdCheck size={11} className="text-white" />}
                      </span>
                      <img src={u.avt} className="w-5 h-5 rounded-full shrink-0" />
                      <span className="truncate">{u.display_name}</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
