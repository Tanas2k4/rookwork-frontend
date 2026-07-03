/**
 * @file MiniGanttChart.tsx
 * @description Component hiển thị biểu đồ Gantt rút gọn (Mini Gantt Chart) tự động mở rộng trục thời gian để hiển thị đầy đủ mọi task.
 * @author Warmdrobe
 */

import { useState, useRef, useContext, useMemo } from "react";
import { ProjectContext } from "../../context/ProjectContext";
import type { OverviewData } from "../../hooks/useOverview";
import type { IssueResponse } from "../../api/contracts/issue";
import { apiPriorityToUI } from "../../utils/issueMapper";
import { priorityColorMap, issueTypeIcons } from "../../types/project";
import { computeAllProgress } from "../../utils/progress";

interface GanttTaskData {
  issue: IssueResponse;
  barX: number;
  barW: number;
  progress: number;
  startDateStr: string;
  deadlineStr: string;
  uiPriority: string;
  priorityColor: string;
}

const TYPE_DURATION: Record<string, number> = {
  task: 7,
  story: 14,
  epic: 28,
};

const svgWidth = 500;
const paddingLeft = 160; 
const chartWidth = svgWidth - paddingLeft; 
const rowHeight = 26; 
const paddingTop = 18;
const svgHeight = paddingTop + 5 * rowHeight;

const priorityTextColorMap: Record<string, string> = {
  low: "text-green-500",
  medium: "text-yellow-500",
  high: "text-orange-500",
  urgent: "text-purple-500",
};

export default function MiniGanttChart({ data }: { data: OverviewData }) {
  const { openIssueModal } = useContext(ProjectContext);
  const issues = data.issues;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Lọc và lấy 5 task quan trọng nhất cần thực hiện (chưa DONE)
  const activeIssues = useMemo((): IssueResponse[] => {
    const uncompleted = issues.filter(
      (i: IssueResponse) => i.status?.statusCategory !== "DONE"
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    // Hệ số ưu tiên mức độ khẩn cấp
    const priorityWeight = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    return uncompleted
      .sort((a: IssueResponse, b: IssueResponse) => {
        // Ưu tiên có deadline lên trước
        if (a.deadline && !b.deadline) return -1;
        if (!a.deadline && b.deadline) return 1;
        if (!a.deadline && !b.deadline) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }

        const deadA = new Date(a.deadline!).getTime();
        const deadB = new Date(b.deadline!).getTime();

        const isLateA = deadA < todayMs;
        const isLateB = deadB < todayMs;

        // Trễ hạn xếp trước
        if (isLateA && !isLateB) return -1;
        if (!isLateA && isLateB) return 1;

        // Cả 2 đều trễ, hoặc cả 2 đều chưa trễ -> xếp theo hạn chót gần nhất
        if (deadA !== deadB) return deadA - deadB;

        // Cùng hạn chót -> xếp theo độ ưu tiên
        const weightA = priorityWeight[a.priority || "LOW"] || 1;
        const weightB = priorityWeight[b.priority || "LOW"] || 1;
        return weightB - weightA;
      })
      .slice(0, 5);
  }, [issues]);

  // Tính toán tiến độ công việc đồng bộ
  const progressMap = useMemo(() => {
    return computeAllProgress(issues);
  }, [issues]);

  // 2. Thiết lập trục hoành tự động mở rộng để bao phủ tất cả ngày bắt đầu và kết thúc của 5 task
  const { ganttStart, dateLabels, todayIndex, totalDays } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Mặc định khoảng thời gian: Hôm nay - 3 ngày đến Hôm nay + 11 ngày (14 ngày)
    let start = new Date(today);
    start.setDate(today.getDate() - 3);

    let end = new Date(today);
    end.setDate(today.getDate() + 11);

    // Duyệt qua 5 task active để mở rộng khoảng hiển thị nếu cần thiết
    if (activeIssues.length > 0) {
      activeIssues.forEach((issue) => {
        const taskStart = issue.startDate ? new Date(issue.startDate) : new Date(issue.createdAt);
        taskStart.setHours(0, 0, 0, 0);

        const duration = TYPE_DURATION[issue.issueType.name.toLowerCase()] || 7;
        const taskEnd = issue.deadline ? new Date(issue.deadline) : new Date(taskStart.getTime() + duration * 24 * 60 * 60 * 1000);
        taskEnd.setHours(23, 59, 59, 999);

        if (taskStart.getTime() < start.getTime()) {
          start = new Date(taskStart);
        }
        if (taskEnd.getTime() > end.getTime()) {
          end = new Date(taskEnd);
        }
      });
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const totalDaysCount = Math.max(14, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Điều chỉnh ngày kết thúc chuẩn khớp số ngày
    const adjustedEnd = new Date(start);
    adjustedEnd.setDate(start.getDate() + totalDaysCount);
    adjustedEnd.setHours(23, 59, 59, 999);

    const todayIndexVal = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      ganttStart: start,
      dateLabels: [
        start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        adjustedEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ],
      todayIndex: todayIndexVal,
      totalDays: totalDaysCount,
    };
  }, [activeIssues]);

  // 3. Tính toán vị trí thanh Gantt
  const ganttTasks = useMemo((): GanttTaskData[] => {
    return activeIssues.map((issue) => {
      const taskStart = issue.startDate ? new Date(issue.startDate) : new Date(issue.createdAt);
      taskStart.setHours(0, 0, 0, 0);

      const duration = TYPE_DURATION[issue.issueType.name.toLowerCase()] || 7;
      const taskEnd = issue.deadline ? new Date(issue.deadline) : new Date(taskStart.getTime() + duration * 24 * 60 * 60 * 1000);
      taskEnd.setHours(23, 59, 59, 999);

      const getDaysElapsed = (d: Date) => {
        const diff = d.getTime() - ganttStart.getTime();
        return diff / (1000 * 60 * 60 * 24);
      };

      const startDiff = getDaysElapsed(taskStart);
      const endDiff = getDaysElapsed(taskEnd);

      // Do trục thời gian đã được tự động mở rộng bao phủ, các giá trị này chắc chắn thuộc [0, totalDays]
      const sVal = Math.max(0, Math.min(totalDays, startDiff));
      const eVal = Math.max(0, Math.min(totalDays, endDiff));

      const barX = paddingLeft + (sVal / totalDays) * chartWidth;
      const barW = Math.max(10, ((eVal - sVal) / totalDays) * chartWidth);

      const progress = progressMap[issue.id] !== undefined ? progressMap[issue.id] : 0;
      const uiPriority = apiPriorityToUI(issue.priority || "LOW");
      const priorityColor = priorityColorMap[uiPriority];

      return {
        issue,
        barX,
        barW,
        progress,
        startDateStr: taskStart.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        deadlineStr: issue.deadline ? new Date(issue.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "None",
        uiPriority,
        priorityColor,
      };
    });
  }, [activeIssues, ganttStart, totalDays, progressMap]);

  // 4. Tính toán các đường Dependencies nối giữa các thanh Gantt
  const dependencyLines = useMemo(() => {
    const lines: { pathD: string; color: string; toIssueId: string }[] = [];

    ganttTasks.forEach((b, bIdx) => {
      const depIds = b.issue.dependencyIds || [];
      depIds.forEach((depId) => {
        const aIdx = ganttTasks.findIndex((t) => t.issue.id === depId);
        if (aIdx !== -1) {
          const a = ganttTasks[aIdx];
          
          const x1 = a.barX + a.barW;
          const y1 = paddingTop + aIdx * rowHeight + (rowHeight - 10) / 2 + 5;
          
          const x2 = b.barX;
          const y2 = paddingTop + bIdx * rowHeight + (rowHeight - 10) / 2 + 5;

          const midX = x1 + 6;
          const pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;

          lines.push({
            pathD,
            color: b.issue.status?.color || "#94a3b8",
            toIssueId: b.issue.id,
          });
        }
      });
    });
    return lines;
  }, [ganttTasks]);

  const hoveredTask = hoveredIndex !== null ? ganttTasks[hoveredIndex] : null;

  return (
    <div className="bg-linear-to-br from-white to-slate-50/50 rounded-2xl border border-gray-200 p-5 col-span-2 flex flex-col h-full relative group shadow-2xs hover:shadow-xs transition-all duration-300" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Mini Gantt Chart</h2>
          <p className="text-[10px] text-gray-400 mt-px">Top 5 urgent/overdue issues timeline (Auto-scaled)</p>
        </div>
      </div>

      {activeIssues.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-2 shadow-2xs">
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[12px] font-semibold text-gray-500">All tasks caught up!</p>
          <p className="text-[10px] text-gray-400 mt-0.5">No active issues found</p>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col justify-between select-none">
          <div className="flex-1 relative min-h-27.5 w-full">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="4.5"
                  markerHeight="4.5"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#94a3b8" />
                </marker>

                {ganttTasks.map((t) => {
                  const statusColor = t.issue.status?.color || "#6366f1";
                  return (
                    <linearGradient key={t.issue.id} id={`grad-${t.issue.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor={statusColor} />
                      <stop offset="100%" stopColor={statusColor} stopOpacity={0.65} />
                    </linearGradient>
                  );
                })}
              </defs>

              {/* 1. Vẽ các đường gióng dọc ngày (Gridlines) */}
              {Array.from({ length: totalDays + 1 }).map((_, j) => {
                const dayW = chartWidth / totalDays;
                const x = paddingLeft + j * dayW;
                const isToday = j === todayIndex;

                return (
                  <g key={j}>
                    <line
                      x1={x}
                      y1={paddingTop - 6}
                      x2={x}
                      y2={svgHeight}
                      stroke={isToday ? "#f43f5e" : "#f1f5f9"}
                      strokeWidth={isToday ? 1.2 : 0.8}
                      strokeDasharray={isToday ? "2 2" : undefined}
                    />
                  </g>
                );
              })}

              {/* Highlight cột ngày hôm nay */}
              <rect
                x={paddingLeft + todayIndex * (chartWidth / totalDays)}
                y={paddingTop - 6}
                width={chartWidth / totalDays}
                height={svgHeight - paddingTop + 6}
                fill="#f43f5e"
                fillOpacity={0.05}
                className="pointer-events-none"
              />

              {/* 2. Nhãn thời gian trục hoành ở hai đầu */}
              <text x={paddingLeft} y={paddingTop - 10} textAnchor="start" className="fill-gray-400 font-extrabold text-[7.5px] tracking-wide select-none">
                {dateLabels[0]}
              </text>
              <text x={paddingLeft + (todayIndex + 0.5) * (chartWidth / totalDays)} y={paddingTop - 10} textAnchor="middle" className="fill-rose-500 font-black text-[8px] tracking-wide select-none">
                Today
              </text>
              <text x={svgWidth} y={paddingTop - 10} textAnchor="end" className="fill-gray-400 font-extrabold text-[7.5px] tracking-wide select-none">
                {dateLabels[1]}
              </text>

              {/* 3. Đường lưới ngang nền */}
              {Array.from({ length: 6 }).map((_, idx) => (
                <line
                  key={idx}
                  x1={0}
                  y1={paddingTop + idx * rowHeight}
                  x2={svgWidth}
                  y2={paddingTop + idx * rowHeight}
                  stroke="#f8fafc"
                  strokeWidth={1}
                />
              ))}

              {/* 4. Vẽ đường nối dependencies */}
              {dependencyLines.map((line, idx) => {
                const isFocused = hoveredTask ? hoveredTask.issue.id === line.toIssueId : false;
                return (
                  <path
                    key={idx}
                    d={line.pathD}
                    fill="none"
                    stroke={isFocused ? "#4f46e5" : "#cbd5e1"}
                    strokeWidth={isFocused ? 1.5 : 1}
                    strokeDasharray={isFocused ? "none" : "3 3"}
                    markerEnd="url(#arrow)"
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* 5. Vẽ nhãn task, icon issue type và thanh Gantt tương ứng */}
              {ganttTasks.map((t, idx) => {
                const y = paddingTop + idx * rowHeight;
                const isHovered = hoveredIndex === idx;
                const isAnyHovered = hoveredIndex !== null;
                const statusColor = t.issue.status?.color || "#6366f1";

                const displayTitle = t.issue.issueName.length > 20 
                  ? t.issue.issueName.substring(0, 18) + "..." 
                  : t.issue.issueName;

                return (
                  <g
                    key={t.issue.id}
                    className="cursor-pointer transition-all duration-200"
                    style={{
                      opacity: isAnyHovered && !isHovered ? 0.45 : 1,
                      filter: isAnyHovered && !isHovered ? "blur(0.2px)" : "none"
                    }}
                    onClick={() => openIssueModal(t.issue.id)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Background hàng khi hover */}
                    <rect
                      x={0}
                      y={y}
                      width={svgWidth}
                      height={rowHeight}
                      fill={isHovered ? "#f8fafc" : "transparent"}
                      className="transition-colors duration-150"
                    />

                    {/* VẼ ICON LOẠI ISSUE */}
                    {(() => {
                      const IconComponent = issueTypeIcons[t.issue.issueType.iconKey || "task"] || issueTypeIcons.task;
                      const typeColor = t.issue.issueType.color || "#64748B";
                      return (
                        <g 
                          transform={`translate(4, ${y + rowHeight / 2 - 5})`}
                          style={{ color: typeColor }}
                        >
                          <IconComponent size={10} />
                        </g>
                      );
                    })()}

                    {/* Tên task nằm hàng ngang chuẩn mực */}
                    <text
                      x={17}
                      y={y + rowHeight / 2 + 3}
                      className={`font-normal text-[8.5px]  tracking-wide transition-colors ${
                        isHovered ? "fill-gray-800 font-bold" : "fill-slate-700"
                      }`}
                    >
                      {displayTitle}
                    </text>

                    {/* Trục kẻ ngăn cách giữa cột trái và cột Gantt */}
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft}
                      y2={y + rowHeight}
                      stroke="#f1f5f9"
                      strokeWidth={1}
                    />

                    {/* THANH GANTT BAR */}
                    {t.barW > 0 && (
                      <g>
                        {/* Thanh Gantt nền */}
                        <rect
                          x={t.barX}
                          y={y + 5}
                          width={t.barW}
                          height={rowHeight - 10}
                          rx={4}
                          fill={`url(#grad-${t.issue.id})`}
                          fillOpacity={0.2}
                          stroke={statusColor}
                          strokeWidth={1.2}
                          className="transition-all duration-200"
                          style={{
                            filter: isHovered ? `drop-shadow(0 2px 6px ${statusColor}40)` : "none",
                            transform: isHovered ? "scaleY(1.05)" : "scaleY(1)",
                            transformOrigin: `${t.barX}px ${y + rowHeight / 2}px`
                          }}
                        />

                        {/* Thanh tiến độ bên trong */}
                        {t.progress > 0 && (
                          <rect
                            x={t.barX}
                            y={y + 5}
                            width={t.barW * (t.progress / 100)}
                            height={rowHeight - 10}
                            rx={4}
                            fill={`url(#grad-${t.issue.id})`}
                            fillOpacity={0.95}
                            className="transition-all duration-200"
                            style={{
                              transform: isHovered ? "scaleY(1.05)" : "scaleY(1)",
                              transformOrigin: `${t.barX}px ${y + rowHeight / 2}px`
                            }}
                          />
                        )}

                        {/* Nhãn tiến độ % hiển thị trong thanh */}
                        {t.barW > 35 && (
                          <text
                            x={t.barX + 6}
                            y={y + rowHeight / 2 + 2.5}
                            fill={t.progress > 0 ? "#fff" : statusColor}
                            className="font-black text-[7px] pointer-events-none select-none"
                            style={{
                              textShadow: t.progress > 0 ? "0 0.5px 2px rgba(0,0,0,0.3)" : "none"
                            }}
                          >
                            {t.progress}%
                          </text>
                        )}
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip absolute positioned */}
            {hoveredIndex !== null && hoveredTask && (
              <div
                className="absolute z-10 bg-gray-50 border border-gray-200 text-gray-800 rounded-md shadow-sm p-2.5 pointer-events-none text-[10px] w-48 transition-all duration-100 ease-out"
                style={{
                  left: `${Math.min(
                    65,
                    Math.max(
                      5,
                      ((hoveredTask.barX - paddingLeft) / chartWidth) * 100
                    )
                  )}%`,
                  top: `${Math.max(
                    -10,
                    ((paddingTop + hoveredIndex * rowHeight) / svgHeight) * 100 - 55
                  )}%`,
                }}
              >
                <p className="font-bold text-gray-700 border-b border-gray-300 pb-1 mb-1 truncate">
                  {hoveredTask.issue.issueName}
                </p>
                <div className="flex flex-col gap-1 mt-1 text-[9px]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-semibold text-gray-700">
                      {hoveredTask.startDateStr} - {hoveredTask.deadlineStr}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Status:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hoveredTask.issue.status?.color }} />
                      <span className="font-semibold">{hoveredTask.issue.status?.statusName}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Priority:</span>
                    <span className={`font-semibold capitalize ${priorityTextColorMap[hoveredTask.uiPriority] || "text-rose-400"}`}>
                      {hoveredTask.uiPriority}
                    </span>
                  </div>
                  <div className="flex justify-between items-center ">
                    <span className="text-gray-500">Assignees:</span>
                  <span className="text-gray-700   truncate max-w-24">
                      {hoveredTask.issue.assignees && hoveredTask.issue.assignees.length > 0
                        ? hoveredTask.issue.assignees.map(a => a.profileName).join(", ")
                        : "Unassigned"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
