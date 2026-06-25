import { STATUS_CONFIG, ROW_HEIGHT, LEFT_PANEL_W } from "./timelineUtils";
import type { GanttTask } from "./timelineUtils";


interface TaskListPanelProps {
  groups: string[];
  tasks: GanttTask[];
  selectedTask: string | null;
  collapsedGroups: Set<string>;
  onSelectTask: (id: string | null) => void;
  onToggleGroup: (group: string) => void;
}

export function TaskListPanel({
  groups, tasks, selectedTask, collapsedGroups, onSelectTask, onToggleGroup,
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
                const isSelected = selectedTask === task.id;
                const status = STATUS_CONFIG[task.status || "todo"];

                return (
                  <div
                    key={task.id}
                    style={{ height: ROW_HEIGHT }}
                    onClick={() => onSelectTask(isSelected ? null : task.id)}
                    className={`flex items-center gap-2 px-4 pl-7 cursor-pointer transition-all duration-150 border-b border-gray-200 ${
                      isSelected ? "bg-indigo-50 border-l-2 border-l-indigo-500" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                    <span
                      className="text-[13px] text-slate-600 truncate flex-1 leading-tight"
                      style={{ fontWeight: isSelected ? 600 : 400 }}
                    >
                      {task.name}
                    </span>
                    {task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center shrink-0" style={{ marginLeft: 6 }}>
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