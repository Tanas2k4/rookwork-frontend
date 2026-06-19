import { useState, useRef, useMemo, useContext } from "react";
import { GanttBar } from "./timeline/GanttBar";
import { TaskListPanel } from "./timeline/TaskListPanel";
import { addDays, diffDays } from "../utils/date";
import type { ViewMode } from "./timeline/timelineUtils";
import {
  buildTimelineColumns,
  STATUS_CONFIG,
  COL_WIDTH_DAY,
  COL_WIDTH_WEEK,
  COL_WIDTH_MONTH,
  ROW_HEIGHT,
} from "./timeline/timelineUtils";
import { useTimeline } from "../hooks/useTimeline";
import { ProjectContext } from "../context/ProjectContext";

const GROUP_ORDER = ["Epic", "Story", "Task"];

export default function TimelineView() {
  const { projectId } = useContext(ProjectContext);
  const { ganttTasks: TASKS, error, reload } = useTimeline(projectId);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const isDraggingScroll = useRef(false);
  const didDragScroll = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartLeft = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => new Date(), []);

  // Timeline bounds — keep today always in range
  const allDates = useMemo(() => {
    if (TASKS.length === 0) return [today, addDays(today, 30)];
    return TASKS.flatMap((t) => [t.start, t.end]).concat(today);
  }, [TASKS, today]);

  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
  const timelineStart = addDays(minDate, -3);
  const totalDays = diffDays(timelineStart, addDays(maxDate, 7));

  const colWidth =
    viewMode === "day"
      ? COL_WIDTH_DAY
      : viewMode === "week"
        ? COL_WIDTH_WEEK
        : COL_WIDTH_MONTH;

  const columns = useMemo(
    () => buildTimelineColumns(timelineStart, totalDays, viewMode),
    [timelineStart, totalDays, viewMode],
  );

  const totalWidth = columns.reduce((sum, c) => sum + c.days * colWidth, 0);
  const todayX = diffDays(timelineStart, today) * colWidth;

  const groups = useMemo(
    () =>
      Array.from(new Set(TASKS.map((t) => t.group || "Other"))).sort(
        (a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b),
      ),
    [TASKS],
  );

  function toggleGroup(g: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) { next.delete(g); } else { next.add(g); }
      return next;
    });
  }

  function dayToX(date: Date) {
    return diffDays(timelineStart, date) * colWidth;
  }

  const selectedTaskData = TASKS.find((t) => t.id === selectedTask);

  //  Loading state 
  //  Error state 
  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <svg className="w-8 h-8 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span className="text-sm">{error}</span>
          <button
            onClick={reload}
            className="text-xs px-3 py-1.5 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  //  Empty state 
  if (TASKS.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <p className="text-sm text-slate-400">No issues found for this project.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white text-gray-700 select-none overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-gray-500 gap-1 rounded-md p-1">
            {(["day", "week", "month"] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 capitalize ${
                  viewMode === m
                    ? "bg-purple-800 text-white shadow"
                    : "text-gray-500 hover:text-purple-800 hover:bg-purple-100"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
                <span className="text-xs text-gray-700">{v.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={reload}
            title="Reload"
            className="text-xs px-2 py-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors border border-gray-300"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (scrollRef.current)
                scrollRef.current.scrollLeft = todayX - 200;
            }}
            className="text-xs px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-700 transition-colors border border-gray-500"
          >
            Today
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <TaskListPanel
          groups={groups}
          tasks={TASKS}
          selectedTask={selectedTask}
          collapsedGroups={collapsedGroups}
          onSelectTask={setSelectedTask}
          onToggleGroup={toggleGroup}
        />

        {/* Gantt scroll area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto relative cursor-grab active:cursor-grabbing"
          style={{ scrollBehavior: "smooth" }}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            isDraggingScroll.current = true;
            didDragScroll.current = false;
            dragStartX.current = e.clientX;
            scrollStartLeft.current = scrollRef.current?.scrollLeft ?? 0;
            e.preventDefault();
          }}
          onMouseMove={(e) => {
            if (!isDraggingScroll.current || !scrollRef.current) return;
            const dx = e.clientX - dragStartX.current;
            if (Math.abs(dx) > 4) didDragScroll.current = true;
            scrollRef.current.scrollLeft = scrollStartLeft.current - dx;
          }}
          onMouseUp={() => { isDraggingScroll.current = false; }}
          onMouseLeave={() => { isDraggingScroll.current = false; }}
        >
          <div style={{ width: totalWidth, minWidth: totalWidth, position: "relative" }}>
            {/* Column headers */}
            <div
              style={{ height: 48, position: "sticky", top: 0, zIndex: 20 }}
              className="flex border-b border-gray-200 bg-gray-50"
            >
              {columns.map((col, i) => (
                <div
                  key={i}
                  style={{ width: col.days * colWidth, minWidth: col.days * colWidth }}
                  className="flex items-end pb-2 pl-2 border-r border-gray-200 shrink-0"
                >
                  <span className="text-[11px] font-medium text-gray-400 truncate leading-none">
                    {col.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid + bars */}
            <div style={{ position: "relative" }}>
              {/* Vertical column lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {columns.map((col, i) => {
                  const w = col.days * colWidth;
                  const isWeekend =
                    viewMode === "day" &&
                    (col.start.getDay() === 0 || col.start.getDay() === 6);
                  return (
                    <div
                      key={i}
                      style={{ width: w, minWidth: w, flexShrink: 0 }}
                      className={`border-r border-gray-100 h-full ${isWeekend ? "bg-gray-50" : ""}`}
                    />
                  );
                })}
              </div>

              {/* Row backgrounds */}
              {groups.map((group) => {
                const groupTasks = TASKS.filter((t) => (t.group || "Other") === group);
                return (
                  <div key={group}>
                    <div style={{ height: ROW_HEIGHT }} className="border-b border-gray-100 bg-gray-50" />
                    {!collapsedGroups.has(group) &&
                      groupTasks.map((task) => (
                        <div
                          key={task.id}
                          style={{ height: ROW_HEIGHT }}
                          className={`border-b border-gray-100 transition-colors ${
                            selectedTask === task.id ? "bg-indigo-50/60" : ""
                          }`}
                        />
                      ))}
                  </div>
                );
              })}

              {/* Today line */}
              {todayX > 0 && todayX < totalWidth && (
                <div
                  className="absolute top-0 pointer-events-none"
                  style={{
                    left: todayX,
                    width: 1,
                    height: "100%",
                    background: "linear-gradient(to bottom, #f43f5e, transparent)",
                    zIndex: 10,
                  }}
                >
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-500" />
                </div>
              )}

              {/* Task bars */}
              <div className="absolute inset-0 pointer-events-none">
                {(() => {
                  let rowOffset = 0;
                  return groups.flatMap((group) => {
                    const groupTasks = TASKS.filter(
                      (t) => (t.group || "Other") === group,
                    );
                    rowOffset++; // group header row
                    if (collapsedGroups.has(group)) return [];
                    return groupTasks.map((task) => {
                      const rowTop = rowOffset++ * ROW_HEIGHT;
                      return (
                        <GanttBar
                          key={task.id}
                          task={task}
                          x={dayToX(task.start)}
                          y={rowTop + (ROW_HEIGHT - 28) / 2}
                          width={Math.max(
                            diffDays(task.start, task.end) * colWidth,
                            colWidth * 0.8,
                          )}
                          isHovered={hoveredTask === task.id}
                          isSelected={selectedTask === task.id}
                          onHover={setHoveredTask}
                          onSelect={(id) => {
                            if (!didDragScroll.current) setSelectedTask(id);
                          }}
                        />
                      );
                    });
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task detail panel */}
      {selectedTaskData && (
        <div className="border-t border-gray-200 bg-white px-6 py-3 flex items-center gap-8 animate-slide-up">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedTaskData.color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {selectedTaskData.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {selectedTaskData.start.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}{" "}
                →{" "}
                {selectedTaskData.end.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}{" "}
                · {diffDays(selectedTaskData.start, selectedTaskData.end)} days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            {/* Progress */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedTaskData.progress}%`, backgroundColor: selectedTaskData.color }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600">
                  {selectedTaskData.progress}%
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">Status</span>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[selectedTaskData.status || "todo"].dot}`} />
                <span className="text-xs text-gray-600">
                  {STATUS_CONFIG[selectedTaskData.status || "todo"].label}
                </span>
              </div>
            </div>

            {/* Assignees */}
            {selectedTaskData.assignees && selectedTaskData.assignees.length > 0 && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Assignee</span>
                <div className="flex items-center gap-2">
                  {selectedTaskData.assignees.map((a) => (
                    <img
                      key={a.id}
                      src={a.avatar}
                      alt={a.name}
                      title={a.name}
                      className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  ))}
                  <span className="text-xs text-gray-600">
                    {selectedTaskData.assignees.map((a) => a.name.split(" ")[0]).join(", ")}
                  </span>
                </div>
              </div>
            )}

            {/* Type badge */}
            {selectedTaskData.type && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Type</span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                    selectedTaskData.type === "epic"
                      ? "bg-amber-100 text-amber-600"
                      : selectedTaskData.type === "story"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {selectedTaskData.type}
                </span>
              </div>
            )}

            <button
              onClick={() => setSelectedTask(null)}
              className="text-gray-300 hover:text-gray-600 transition-colors p-1 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slide-up { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .animate-slide-up { animation: slide-up 0.2s ease; }
      `}</style>
    </div>
  );
}