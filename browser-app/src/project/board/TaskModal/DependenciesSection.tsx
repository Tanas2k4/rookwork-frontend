import { useState, useMemo, useRef, useEffect } from "react";
import {
  MdAdd,
  MdClose,
  MdKeyboardArrowDown,
  MdChevronRight,
} from "react-icons/md";
import type { Task, TaskWithMeta } from "../../../types/project";
import {
  statusMap,
  issueTypeIcons,
} from "../../../types/project";

interface Props {
  task: Task;
  allTasks: Task[];
  onOpenTask: (t: Task) => void;
  onSaveDependencies: (dependencyIds: string[]) => void;
}

export function DependenciesSection({
  task,
  allTasks,
  onOpenTask,
  onSaveDependencies,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showLinkDd, setShowLinkDd] = useState(false);
  const [search, setSearch] = useState("");
  const ddRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showLinkDd) return;
    function handler(e: MouseEvent) {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) {
        setShowLinkDd(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showLinkDd]);

  const dependencyIds = useMemo(() => {
    return task.dependencyIds || [];
  }, [task.dependencyIds]);

  const dependencies = useMemo(() => {
    return allTasks.filter((t) => {
      const tUuid = (t as TaskWithMeta)._uuid;
      return tUuid && dependencyIds.includes(tUuid);
    });
  }, [allTasks, dependencyIds]);

  const candidates = useMemo(() => {
    return allTasks.filter((t) => {
      const tUuid = (t as TaskWithMeta)._uuid;
      if (!tUuid) return false;
      if (t.id === task.id || tUuid === (task as TaskWithMeta)._uuid) return false; // exclude self
      if (dependencyIds.includes(tUuid)) return false; // exclude already selected
      if (search.trim()) {
        return t.title.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [allTasks, task.id, (task as TaskWithMeta)._uuid, dependencyIds, search]);

  const handleAddDependency = (uuid: string) => {
    const newDeps = [...dependencyIds, uuid];
    onSaveDependencies(newDeps);
    setShowLinkDd(false);
    setSearch("");
  };

  const handleRemoveDependency = (uuid: string) => {
    const newDeps = dependencyIds.filter((id) => id !== uuid);
    onSaveDependencies(newDeps);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setExpanded((p) => !p)}
          className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition"
        >
          {expanded ? (
            <MdKeyboardArrowDown size={14} />
          ) : (
            <MdChevronRight size={14} />
          )}
          Depends On ({dependencies.length})
        </button>

        <div className="relative" ref={ddRef}>
          <button
            onClick={() => {
              setShowLinkDd((p) => !p);
              setSearch("");
            }}
            className="flex items-center gap-0.5 text-xs text-purple-700 hover:text-purple-900 transition"
          >
            <MdAdd size={13} />
            Add Dependency
          </button>
          {showLinkDd && (
            <>
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 z-30 w-64 max-h-56 overflow-y-auto">
                <div className="px-2 pb-1.5 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="Search issues..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-gray-200 rounded outline-none focus:border-purple-500"
                    autoFocus
                  />
                </div>
                <div className="py-1">
                  {candidates.length === 0 ? (
                    <p className="text-xs text-gray-400 italic px-3 py-2">
                      No available issues
                    </p>
                  ) : (
                    candidates.map((c) => {
                      const cit = c.issueType;
                      const Icon = issueTypeIcons[cit?.iconKey || "task"] || issueTypeIcons.task;
                      const tUuid = (c as TaskWithMeta)._uuid;
                      return (
                        <button
                          key={c.id}
                          onClick={() => tUuid && handleAddDependency(tUuid)}
                          className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700 truncate"
                          title={c.title}
                        >
                          <Icon
                            style={{ color: cit?.color || "#64748B" }}
                            className="shrink-0"
                            size={12}
                          />
                          <span className="truncate">{c.title}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-1.5">
          {dependencies.length === 0 ? (
            <p className="text-xs text-gray-300 italic">
              No dependencies yet
            </p>
          ) : (
            dependencies.map((depTask) => {
              const cit = depTask.issueType;
              const Icon = issueTypeIcons[cit?.iconKey || "task"] || issueTypeIcons.task;
              const depUuid = (depTask as TaskWithMeta)._uuid;
              
              // Get status display
              const currentStatus = statusMap[depTask.status] || { label: "To Do", badgeColor: "bg-gray-100 text-gray-800" };
              
              return (
                <div
                  key={depTask.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 group/child hover:bg-white hover:shadow-sm transition"
                >
                  <Icon
                    style={{ color: cit?.color || "#64748B" }}
                    className="shrink-0"
                    size={12}
                  />
                  <button
                    onClick={() => onOpenTask(depTask)}
                    className="flex-1 text-left text-sm text-gray-700 hover:text-purple-700 truncate transition font-medium"
                  >
                    {depTask.title}
                  </button>
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <span
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-0.75 rounded-full font-semibold ${currentStatus.badgeColor}`}
                    >
                      {currentStatus.label}
                    </span>
                    <button
                      onClick={() => depUuid && handleRemoveDependency(depUuid)}
                      className="opacity-0 group-hover/child:opacity-100 text-gray-300 hover:text-red-400 transition"
                      title="Remove dependency"
                    >
                      <MdClose size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
