import { useState, useMemo } from "react";
import {
  MdAdd,
  MdClose,
  MdKeyboardArrowDown,
  MdChevronRight,
} from "react-icons/md";
import { TbSubtask } from "react-icons/tb";
import type { Task } from "../../../types/project";
import {
  typeIconMap,
  typeColorMap,
  statusMap,
  childTypeMap,
  childLabelMap,
} from "../../../types/project";

interface Props {
  task: Task;
  allTasks: Task[];
  onOpenTask: (t: Task) => void;
  onLink: (parentId: number, childId: number) => void;
  onUnlink: (parentId: number, childId: number) => void;
}

export function ChildrenSection({
  task,
  allTasks,
  onOpenTask,
  onLink,
  onUnlink,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [showLinkDd, setShowLinkDd] = useState(false);

  const childType = childTypeMap[task.type];

  const children = useMemo(() => {
    return allTasks.filter((t) => (task.childIds ?? []).includes(t.id));
  }, [allTasks, task.childIds]);

  const candidates = useMemo(() => {
    return allTasks.filter(
      (t) =>
        t.type === childType &&
        !(task.childIds ?? []).includes(t.id) &&
        t.parentId == null
    );
  }, [allTasks, task.childIds, childType]);

  
  if (!childType) {
    return null;
  }

  const label = childLabelMap[task.type]!;

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
          {label} ({children.length})
        </button>

        <div className="relative">
          <button
            onClick={() => setShowLinkDd((p) => !p)}
            className="flex items-center gap-0.5 text-xs text-purple-700 hover:text-purple-900 transition"
          >
            <MdAdd size={13} />
            Link {childType}
          </button>
          {showLinkDd && (
            <>
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-60 max-h-56 overflow-y-auto">
                {candidates.length === 0 ? (
                  <p className="text-xs text-gray-400 italic px-3 py-2">
                    No available {childType}s to link
                  </p>
                ) : (
                  candidates.map((c) => {
                    const Icon = typeIconMap[c.type];
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          onLink(task.id, c.id);
                          setShowLinkDd(false);
                        }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                      >
                        <Icon
                          className={`${typeColorMap[c.type]} shrink-0`}
                          size={12}
                        />
                        <span className="truncate">{c.title}</span>
                      </button>
                    );
                  })
                )}
              </div>
              <div
                className="fixed inset-0 z-29"
                onClick={() => setShowLinkDd(false)}
              />
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-1.5">
          {children.length === 0 ? (
            <p className="text-xs text-gray-300 italic">
              No {childType}s linked yet
            </p>
          ) : (
            children.map((child) => {
              const Icon = typeIconMap[child.type];
              const doneCount = child.subtasks.filter((s) => s.done).length;
              return (
                <div
                  key={child.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 group/child hover:bg-white hover:shadow-sm transition"
                >
                  <Icon
                    className={`${typeColorMap[child.type]} shrink-0`}
                    size={12}
                  />
                  <button
                    onClick={() => onOpenTask(child)}
                    className="flex-1 text-left text-sm text-gray-700 hover:text-purple-700 truncate transition"
                  >
                    {child.title}
                  </button>
                  <div className="flex items-center gap-2 ml-auto shrink-0">
                    <span
                      className={`flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-medium ${statusMap[child.status].dotColor} bg-opacity-10 text-gray-600`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusMap[child.status].dotColor}`}
                      />
                      {statusMap[child.status].label}
                    </span>
                    {child.subtasks.length > 0 && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <TbSubtask size={11} />
                        {doneCount}/{child.subtasks.length}
                      </span>
                    )}
                    <button
                      onClick={() => onUnlink(task.id, child.id)}
                      className="opacity-0 group-hover/child:opacity-100 text-gray-300 hover:text-red-400 transition"
                      title={`Unlink ${child.type}`}
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
