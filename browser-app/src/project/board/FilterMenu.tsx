import { useRef, useEffect, useContext } from "react";
import { CiFilter } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import type { TaskType, Priority } from "../../types/project";
import {
  priorities,
  priorityColorMap,
  priorityLabelMap,
  issueTypeIcons,
} from "../../types/project";
import { ProjectContext } from "../../context/ProjectContext";

interface Props {
  filterType: TaskType | "";
  filterPriority: Priority | "";
  onTypeChange: (t: TaskType | "") => void;
  onPriorityChange: (p: Priority | "") => void;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function FilterMenu({
  filterType,
  filterPriority,
  onTypeChange,
  onPriorityChange,
  open,
  onToggle,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const activeFilters = (filterPriority ? 1 : 0) + (filterType ? 1 : 0);
  const { issueTypes } = useContext(ProjectContext);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 text-sm border font-semibold px-3 py-1.5 rounded-md hover:bg-gray-100 transition relative ${
          activeFilters > 0
            ? "border-purple-600 bg-purple-50 text-purple-700"
            : "border-gray-500 text-gray-700"
        }`}
      >
        <CiFilter size={16} />
        Filters
        {activeFilters > 0 && (
          <span className="ml-1 bg-purple-700 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
            {activeFilters}
          </span>
        )}
        <MdKeyboardArrowDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Filter issues
            </span>
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  onTypeChange("");
                  onPriorityChange("");
                }}
                className="text-[10px] text-purple-700 hover:text-purple-900 font-semibold"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Type */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="space-y-1.5">
              {issueTypes.map((t) => {
                const Icon = issueTypeIcons[t.iconKey] || issueTypeIcons.task;
                const value = t.name.toLowerCase();
                const isChecked = filterType === value;
                return (
                  <label
                    key={t.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onTypeChange(isChecked ? "" : value)}
                      className="w-4 h-4 text-purple-800 rounded focus:ring-purple-700"
                    />
                    <span
                      className="flex items-center gap-1.5 text-xs font-semibold"
                      style={{ color: t.color }}
                    >
                      <Icon size={12} />
                      {t.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="space-y-1.5">
              {priorities.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                >
                  <input
                    type="checkbox"
                    checked={filterPriority === p}
                    onChange={() => onPriorityChange(filterPriority === p ? "" : p)}
                    className="w-4 h-4 text-purple-800 rounded focus:ring-purple-700"
                  />
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <span className={`w-2.5 h-2.5 rounded-full ${priorityColorMap[p]}`} />
                    {priorityLabelMap[p]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
