import { STATUS_CONFIG, ROW_HEIGHT, LEFT_PANEL_W } from "./timelineUtils";
import type { GanttTask } from "./timelineUtils";


interface TaskListPanelProps {
  groups: string[];
  tasks: GanttTask[];
  collapsedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  /** Click vào tên task → mở TaskModal đầy đủ */
  onOpenModal: (uuid: string) => void;
}

export function TaskListPanel({
  groups, tasks, collapsedGroups, onToggleGroup, onOpenModal,
}: TaskListPanelProps) {
  return (
    <div
      style={{ width: LEFT_PANEL_W, minWidth: LEFT_PANEL_W }}
      className="flex flex-col border-r border-gray-200 bg-white z-10 overflow-hidden"
    >
      <div style={{ height: 48 }} className="flex items-end px-4 pb-2 border-b border-gray-200 bg-slate-50">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Issues</span>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
        {groups.map((group) => {
          const isCollapsed = collapsedGroups.has(group);
          const groupTasks = tasks.filter((t) => (t.group || "Other") === group);

          return (
            <div key={group}>
              {/* Group header */}
              <div
                style={{ height: ROW_HEIGHT }}
                className="flex items-center gap-2 px-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-200"
                onClick={() => onToggleGroup(group)}
              >
                <svg
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{group}</span>
                <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  {groupTasks.length}
                </span>
              </div>

              {/* Task rows */}
              {!isCollapsed && groupTasks.map((task) => {
                const status = STATUS_CONFIG[task.status || "todo"];

                return (
                  <div
                    key={task.id}
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => onOpenModal(task.id)}
                    title="Click để xem chi tiết"
                    className="flex items-center gap-2 px-4 pl-7 cursor-pointer transition-all duration-150 border-b border-gray-200 hover:bg-indigo-50 group"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`} />
                    <span className="text-[13px] text-slate-600 truncate flex-1 leading-tight group-hover:text-indigo-700 transition-colors">
                      {task.name}
                    </span>
                    {/* Assignee avatars */}
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center flex-shrink-0" style={{ marginLeft: 6 }}>
                        {task.assignees.slice(0, 2).map((a, i) => (
                          <img
                            key={a.id}
                            src={a.avatar}
                            alt={a.name}
                            title={a.name}
                            style={{
                              width: 20, height: 20,
                              borderRadius: "50%",
                              border: "2px solid #fff",
                              marginLeft: i === 0 ? 0 : -6,
                              objectFit: "cover",
                              zIndex: 2 - i,
                              position: "relative",
                            }}
                            onError={(e) => {
                              const el = e.target as HTMLImageElement;
                              el.style.display = "none";
                            }}
                          />
                        ))}
                        {task.assignees.length > 2 && (
                          <span
                            style={{
                              width: 20, height: 20,
                              borderRadius: "50%",
                              border: "2px solid #fff",
                              marginLeft: -6,
                              fontSize: 9,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#ede9fe",
                              color: "#7c3aed",
                              position: "relative",
                            }}
                          >
                            +{task.assignees.length - 2}
                          </span>
                        )}
                      </div>
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