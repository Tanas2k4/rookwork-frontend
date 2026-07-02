import { useRef, useMemo, useCallback, useContext, useState, useEffect } from "react";
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
import { issueApi } from "../api/services/issueApi";

const GROUP_ORDER = ["Epic", "Story", "Task"];

export default function TimelineView() {
  const { projectId, openIssueModal } = useContext(ProjectContext);
  const { ganttTasks: TASKS, error, reload } = useTimeline(projectId);

  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
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
      Array.from(new Set(TASKS.map((t) => t.group || "Other"))).sort((a, b) => {
        const idxA = GROUP_ORDER.indexOf(a);
        const idxB = GROUP_ORDER.indexOf(b);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.localeCompare(b);
      }),
    [TASKS],
  );

  function toggleGroup(g: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) { next.delete(g); } else { next.add(g); }
      return next;
    });
  }

  const dayToX = useCallback(
    (date: Date) => diffDays(timelineStart, date) * colWidth,
    [timelineStart, colWidth]
  );

  const handleUpdateTaskDates = async (taskId: string, newStart: Date, newEnd: Date) => {
    if (!projectId) return;
    try {
      const startStr = newStart.toISOString().split("T")[0];
      const endStr = newEnd.toISOString().split("T")[0];
      await issueApi.update(projectId, taskId, {
        startDate: startStr,
        deadline: endStr,
      });
      reload();
    } catch (err) {
      console.error("Failed to update issue dates on timeline", err);
    }
  };

  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null);
  const [linkStart, setLinkStart] = useState<{ x: number; y: number } | null>(null);
  const [linkCurrent, setLinkCurrent] = useState<{ x: number; y: number } | null>(null);

  const handleStartLink = (taskId: string, startX: number, startY: number) => {
    setLinkingSourceId(taskId);
    setLinkStart({ x: startX, y: startY });
    setLinkCurrent({ x: startX, y: startY });
  };

  const handleEndLink = async (targetId: string) => {
    if (!linkingSourceId || !projectId) return;
    try {
      const targetTask = TASKS.find((t) => t.id === targetId);
      if (!targetTask) return;

      const currentDeps = targetTask.dependencyIds || [];
      if (currentDeps.includes(linkingSourceId)) return;

      const newDeps = [...currentDeps, linkingSourceId];
      await issueApi.update(projectId, targetId, {
        dependencyIds: newDeps,
      });
      reload();
    } catch (err) {
      console.error("Failed to link issues:", err);
    } finally {
      setLinkingSourceId(null);
      setLinkStart(null);
      setLinkCurrent(null);
    }
  };

  useEffect(() => {
    if (!linkingSourceId || !scrollRef.current) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const rect = scrollRef.current?.getBoundingClientRect();
      if (!rect) return;

      const scrollLeft = scrollRef.current?.scrollLeft ?? 0;
      const scrollTop = scrollRef.current?.scrollTop ?? 0;

      const mouseX = e.clientX - rect.left + scrollLeft;
      const mouseY = e.clientY - rect.top + scrollTop;

      setLinkCurrent({ x: mouseX, y: mouseY });
    };

    const handleGlobalMouseUp = () => {
      setTimeout(() => {
        setLinkingSourceId(null);
        setLinkStart(null);
        setLinkCurrent(null);
      }, 50);
    };

    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [linkingSourceId]);

  const taskCoords = useMemo(() => {
    const coords: Record<string, { id: string; x: number; y: number; width: number }> = {};
    let rowOffset = 0;
    
    groups.forEach((group) => {
      const groupTasks = TASKS.filter((t) => (t.group || "Other") === group);
      rowOffset++; // group header row
      
      if (!collapsedGroups.has(group)) {
        groupTasks.forEach((task) => {
          const rowTop = rowOffset++ * ROW_HEIGHT;
          const x = dayToX(task.start);
          const y = rowTop + (ROW_HEIGHT - 28) / 2;
          const width = Math.max(
            diffDays(task.start, task.end) * colWidth,
            colWidth * 0.8,
          );
          coords[task.id] = { id: task.id, x, y, width };
        });
      }
    });
    
    return coords;
  }, [groups, TASKS, collapsedGroups, colWidth, dayToX]);

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
          collapsedGroups={collapsedGroups}
          onOpenModal={openIssueModal}
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
                  className="flex items-center justify-center border-r border-gray-200 shrink-0"
                >
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-[12px] font-medium text-gray-400 leading-none">
                      {col.monthText}
                    </span>
                    <span className="text-[16px] font-bold text-gray-800 leading-none">
                      {col.dayText}
                    </span>
                  </div>
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
                          className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors"
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

              {/* SVG Connector Lines */}
              <svg className="absolute inset-0 pointer-events-none" style={{ width: totalWidth, height: "100%", zIndex: 5 }}>
                <defs>
                  <marker
                    id="arrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 2 L 6 5 L 0 8 z" fill="#6366f1" />
                  </marker>
                </defs>
                
                {Object.values(taskCoords).flatMap((coordsB) => {
                  const task = TASKS.find(t => t.id === coordsB.id);
                  if (!task || !task.dependencyIds) return [];
                  
                  return task.dependencyIds.map((depId) => {
                    const coordsA = taskCoords[depId];
                    if (!coordsA) return null;
                    
                    const startX = coordsA.x + coordsA.width;
                    const startY = coordsA.y + 14;
                    const endX = coordsB.x;
                    const endY = coordsB.y + 14;
                    
                    let d = "";
                    if (endX >= startX + 16) {
                      const midX = startX + (endX - startX) / 2;
                      d = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
                    } else {
                      const midX1 = startX + 12;
                      const midX2 = endX - 12;
                      
                      const rowA = Math.floor(coordsA.y / ROW_HEIGHT);
                      const rowB = Math.floor(coordsB.y / ROW_HEIGHT);
                      const y_gutter = rowA < rowB ? rowB * ROW_HEIGHT : (rowB + 1) * ROW_HEIGHT;
                      
                      d = `M ${startX} ${startY} H ${midX1} V ${y_gutter} H ${midX2} V ${endY} H ${endX}`;
                    }
                    
                    return (
                      <path
                        key={`${coordsA.id}->${coordsB.id}`}
                        d={d}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                        markerEnd="url(#arrow)"
                        style={{ opacity: 0.7 }}
                      />
                    );
                  });
                })}

                {linkStart && linkCurrent && (
                  <line
                    x1={linkStart.x}
                    y1={linkStart.y}
                    x2={linkCurrent.x}
                    y2={linkCurrent.y}
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    markerEnd="url(#arrow)"
                  />
                )}
              </svg>

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
                          onHover={setHoveredTask}
                          onOpenModal={openIssueModal}
                          colWidth={colWidth}
                          timelineStart={timelineStart}
                          onUpdateDates={handleUpdateTaskDates}
                          onStartLink={handleStartLink}
                          onEndLink={handleEndLink}
                          linkingSourceId={linkingSourceId}
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}