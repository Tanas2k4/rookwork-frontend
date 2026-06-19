import type { RefObject } from "react";
import { CiFilter } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import { FaTasks, FaBook, FaRocket } from "react-icons/fa";
import type { User } from "../../types/project";

const typeOptions = [
  { label: "Task",  value: "task",  icon: <FaTasks  size={12} />, color: "bg-blue-100 text-blue-700" },
  { label: "Story", value: "story", icon: <FaBook   size={12} />, color: "bg-green-100 text-green-700" },
  { label: "Epic",  value: "epic",  icon: <FaRocket size={12} />, color: "bg-purple-100 text-purple-700" },
];

const statusOptions = [
  { label: "To Do",       value: "to_do",       color: "bg-gray-100 text-gray-800" },
  { label: "In Progress", value: "in_progress", color: "bg-blue-100 text-blue-800" },
  { label: "Done",        value: "done",        color: "bg-green-100 text-green-800" },
];

interface Props {
  open: boolean;
  onToggle: () => void;
  filterRef: RefObject<HTMLDivElement | null>;
  users: User[];
  selectedStatuses: string[];
  selectedUsers: string[]; // UUID strings
  selectedTypes: string[];
  onToggleStatus: (s: string) => void;
  onToggleUser: (uuid: string) => void;
  onToggleType: (t: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function ListFilterPanel({
  open, onToggle, filterRef, users,
  selectedStatuses, selectedUsers, selectedTypes,
  onToggleStatus, onToggleUser, onToggleType,
  onClear, hasActiveFilters,
}: Props) {
  const count = selectedStatuses.length + selectedUsers.length + selectedTypes.length;

  return (
    <div className="relative" ref={filterRef}>
      <button onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-md border-gray-500 text-sm transition
          ${hasActiveFilters ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}>
        <CiFilter size={16} />
        Filter
        {hasActiveFilters && (
          <span className="bg-purple-500 text-white text-xs px-1.5 rounded-full">{count}</span>
        )}
        <MdKeyboardArrowDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-125 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-800">Filter Tasks</h3>
              {hasActiveFilters && (
                <button onClick={onClear} className="text-xs text-purple-600 hover:text-purple-700">
                  Clear all
                </button>
              )}
            </div>

            {/* Type */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
              <div className="space-y-1.5">
                {typeOptions.map((t) => (
                  <label key={t.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                    <input type="checkbox" checked={selectedTypes.includes(t.value)}
                      onChange={() => onToggleType(t.value)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1.5 ${t.color}`}>
                      {t.icon}{t.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
              <div className="space-y-1.5">
                {statusOptions.map((s) => (
                  <label key={s.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                    <input type="checkbox" checked={selectedStatuses.includes(s.value)}
                      onChange={() => onToggleStatus(s.value)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${s.color}`}>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Assignee — keyed by UUID */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Assigned to</label>
              <div className="space-y-1.5">
                {users.map((u) => (
                  <label key={u.avt} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                    <input type="checkbox"
                      checked={selectedUsers.includes(u.avt /* used as stable key */)}
                      onChange={() => onToggleUser(u.avt)}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500" />
                    <img src={u.avt} className="w-5 h-5 rounded-full" />
                    <span className="text-sm text-gray-700">{u.display_name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}