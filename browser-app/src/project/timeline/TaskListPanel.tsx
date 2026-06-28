import { ROW_HEIGHT, LEFT_PANEL_W } from "./timelineUtils";
import type { GanttTask, Assignee } from "./timelineUtils";
import { typeIconMap } from "../../types/project";
import type { TaskType } from "../../types/project";

interface TaskListPanelProps {
  groups: string[];
  tasks: GanttTask[];
  collapsedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  /** Click vào tên task → mở TaskModal đầy đủ */
  onOpenModal: (uuid: string) => void;
}

// Helpers for group specific styling
const getGroupConfig = (group: string) => {
  const normalized = group.toLowerCase() as TaskType;
  const Icon = typeIconMap[normalized];

  if (normalized === "story") {
    return {
      bg: "bg-gray-100",
      text: "text-emerald-800 font-bold",
      badge: "bg-emerald-50 text-emerald-800 border border-emerald-200/50",
      icon: Icon ? <Icon className="text-emerald-700 shrink-0" size={14} /> : null,
      borderLeft: "border-l-[3px] border-l-emerald-500",
      arrowColor: "text-emerald-500",
      label: "Stories",
    };
  }
  if (normalized === "task") {
    return {
      bg: "bg-gray-100",
      text: "text-blue-600 font-bold",
      badge: "bg-blue-50 text-blue-800 border border-blue-200/50",
      icon: Icon ? <Icon className="text-blue-700 shrink-0" size={14} /> : null,
      borderLeft: "border-l-[3px] border-l-blue-500",
      arrowColor: "text-blue-500",
      label: "Tasks",
    };
  }
  if (normalized === "epic") {
    return {
      bg: "bg-gray-100",
      text: "text-purple-800 font-bold",
      badge: "bg-purple-50 text-purple-800 border border-purple-200/50",
      icon: Icon ? <Icon className="text-purple-700 shrink-0" size={14} /> : null,
      borderLeft: "border-l-[3px] border-l-purple-500",
      arrowColor: "text-purple-500",
      label: "Epics",
    };
  }
  return {
    bg: "bg-gray-100 ",
    text: "text-gray-700 font-bold",
    badge: "bg-gray-50 text-gray-700 border border-gray-200/50",
    icon: null,
    borderLeft: "border-l-[3px] border-l-gray-400",
    arrowColor: "text-gray-400",
    label: group,
  };
};

const getStatusIcon = (status: "todo" | "in_progress" | "done") => {
  switch (status) {
    case "todo":
      return (
        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
      );
    case "in_progress":
      return (
        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
      );
    case "done":
      return (
        <div className="w-2 h-2 rounded-full bg-green-600"></div>
      );
  }
};

const AvatarGroup = ({ assignees }: { assignees: Assignee[] }) => {
  if (!assignees || assignees.length === 0) return null;

  return (
    <div className="flex items-center shrink-0 -space-x-1.5 ml-2">
      {assignees.slice(0, 2).map((a, idx) => {
        // Fallback initials
        const initials = a.name
          ? a.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
          : "?";

        return (
          <div
            key={a.id}
            title={a.name}
            className="relative rounded-full border border-white flex items-center justify-center shrink-0 select-none shadow-sm overflow-hidden"
            style={{
              width: 22,
              height: 22,
              backgroundColor: a.color || "#cbd5e1",
              zIndex: 10 - idx,
            }}
          >
            {a.avatar ? (
              <img
                src={a.avatar}
                alt={a.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  const fallback = img.nextElementSibling as HTMLSpanElement;
                  if (fallback) fallback.style.display = "flex";
                }}
              />
            ) : null}
            <span
              className="text-[9px] font-bold text-white uppercase"
              style={{
                display: a.avatar ? "none" : "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {initials}
            </span>
          </div>
        );
      })}
      {assignees.length > 2 && (
        <div
          title={`${assignees.length - 2} more assignees`}
          className="relative rounded-full border border-white flex items-center justify-center shrink-0 bg-gray-100 text-gray-600 shadow-sm z-0"
          style={{ width: 22, height: 22 }}
        >
          <span className="text-[9px] font-extrabold">
            +{assignees.length - 2}
          </span>
        </div>
      )}
    </div>
  );
};

export function TaskListPanel({
  groups,
  tasks,
  collapsedGroups,
  onToggleGroup,
  onOpenModal,
}: TaskListPanelProps) {
  return (
    <div
      style={{ width: LEFT_PANEL_W, minWidth: LEFT_PANEL_W }}
      className="flex flex-col border-r border-gray-200/80 bg-white z-10 overflow-hidden"
    >
      {/* Issues List Header */}
      <div
        style={{ height: 48 }}
        className="flex items-center justify-between px-4 border-b border-gray-200/80 bg-white shrink-0"
      >
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold text-gray-700 uppercase tracking-widest">
            Issues List
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups.has(group);
          const groupTasks = tasks.filter(
            (t) => (t.group || "Other") === group,
          );
          const config = getGroupConfig(group);

          return (
            <div key={group}>
              {/* Group header */}
              <div
                style={{ height: ROW_HEIGHT }}
                className={`flex items-center gap-2 px-4 cursor-pointer transition-all duration-200 border-b border-gray-200/70 ${config.bg} ${config.borderLeft}`}
                onClick={() => onToggleGroup(group)}
              >
                <svg
                  className={`w-3.5 h-3.5 ${config.arrowColor} transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <div className="flex items-center gap-1.5 min-w-0">
                  {config.icon}
                  <span
                    className="text-[11px] uppercase tracking-wider font-bold truncate"
                  >
                    {config.label}
                  </span>
                </div>
                <span
                  className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full bg-gray-200"
                >
                  {groupTasks.length}
                </span>
              </div>

              {/* Task rows */}
              {!isCollapsed &&
                groupTasks.map((task) => {
                  return (
                    <div
                      key={task.id}
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => onOpenModal(task.id)}
                      title={`${task.name}\nClick để xem chi tiết`}
                      className="flex items-center gap-2.5 px-4 pl-8 cursor-pointer transition-all duration-150 border-b border-gray-100 bg-white hover:bg-gray-50/50 group"
                    >
                      {getStatusIcon(task.status || "todo")}
                      <span className="text-[13px] font-medium text-gray-600 truncate flex-1 leading-normal group-hover:text-purple-600 transition-colors">
                        {task.name}
                      </span>
                      
                      <AvatarGroup assignees={task.assignees || []} />
                      {task.progress !== undefined &&
                        task.progress > 0 &&
                        task.progress < 100 && (
                          <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200/60 px-1.5 py-0.5 rounded font-semibold shrink-0">
                            {task.progress}%
                          </span>
                        )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
