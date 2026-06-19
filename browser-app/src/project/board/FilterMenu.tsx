import { useRef, useEffect } from "react";
import { CiFilter } from "react-icons/ci";
import { MdKeyboardArrowDown } from "react-icons/md";
import type { TaskType, Priority } from "../../types/project";
import {
  typeIconMap,
  typeColorMap,
  typeLabelMap,
  priorities,
  priorityColorMap,
  priorityLabelMap,
} from "../../types/project";

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm transition
          ${activeFilters ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-500 hover:bg-gray-50 text-gray-700"}`}
      >
        <CiFilter size={16} />
        Filter
        {activeFilters > 0 && (
          <span className="bg-purple-500 text-white text-xs px-1.5 rounded-full">
            {activeFilters}
          </span>
        )}
        <MdKeyboardArrowDown
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-100 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3 sticky top-0 bg-white pb-2 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-800">
                Filter Tasks
              </h3>
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    onTypeChange("");
                    onPriorityChange("");
                  }}
                  className="text-xs text-purple-600 hover:text-purple-700"
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
                {(["task", "story", "epic"] as TaskType[]).map((t) => {
                  const Icon = typeIconMap[t];
                  return (
                    <label
                      key={t}
                      className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={filterType === t}
                        onChange={() => onTypeChange(filterType === t ? "" : t)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span
                        className={`flex items-center gap-1.5 text-xs font-medium ${typeColorMap[t]}`}
                      >
                        <Icon size={12} />
                        {typeLabelMap[t]}
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
                      onChange={() =>
                        onPriorityChange(filterPriority === p ? "" : p)
                      }
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-700">
                      <span
                        className={`w-2 h-2 rounded-full ${priorityColorMap[p]}`}
                      />
                      {priorityLabelMap[p]}
                    </span>
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
