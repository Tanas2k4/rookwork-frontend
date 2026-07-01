/**
 * @file DeadlineTimeline.tsx
 * @description Component hiển thị dòng thời gian biểu đồ (Timeline) cho các sự vụ sắp đến hạn và quá hạn của dự án.
 * @author Warmdrobe
 */

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { IssueTypeResponse, UserSummary } from "../../api/contracts/issue";
import type { OverviewData, OverviewIssue } from "../../hooks/useOverview";
import { apiPriorityToUI, apiStatusToUI } from "../../utils/issueMapper";
import { avatarUrl } from "../../utils/avatar";

type TaskStatus = "to_do" | "in_progress" | "done";
type TaskPriority = "urgent" | "high" | "medium" | "low";

function TypeChip({ issueType }: { issueType: IssueTypeResponse }) {
  if (!issueType) return null;
  const color = issueType.color;
  return (
    <span
      className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border"
      style={{
        backgroundColor: `${color}15`,
        color: color,
        borderColor: `${color}30`
      }}
    >
      {issueType.name}
    </span>
  );
}
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cls: Record<TaskPriority, string> = { urgent: "bg-red-100 text-red-600", high: "bg-orange-50 text-orange-500", medium: "bg-orange-50 text-orange-600", low: "bg-green-50 text-green-600" };
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${cls[priority]}`}>{priority}</span>;
}
function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg: Record<TaskStatus, { cls: string; label: string }> = {
    to_do: { cls: "bg-gray-100 text-gray-800 border-none", label: "To Do" },
    in_progress: { cls: "bg-blue-100 text-blue-800 border-none", label: "In Progress" },
    done: { cls: "bg-green-100 text-green-800 border-none", label: "Done" },
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cfg[status].cls}`}>{cfg[status].label}</span>;
}

export default function DeadlineTimeline({ data }: { data: OverviewData }) {
  // Use state to store the hovered item and its DOMRect for the portal
  const [hoveredData, setHoveredData] = useState<{ id: string; rect: DOMRect; item: OverviewIssue } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { timelineTasks, overdueCount, dueSoonCount } = data;

  // Handle scroll events to clear tooltip if user scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (hoveredData) setHoveredData(null);
    };
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (el) el.removeEventListener("scroll", handleScroll);
    };
  }, [hoveredData]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm col-span-2 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Deadline Timeline</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Track upcoming and overdue tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="text-[11px] font-bold bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {overdueCount} overdue
            </span>
          )}
          {dueSoonCount > 0 && (
            <span className="text-[11px] font-bold bg-orange-50 text-orange-600 border border-orange-100 px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              {dueSoonCount} due soon
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-3">
        {[
          { dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]", label: "Overdue" }, 
          { dot: "bg-orange-500", label: "≤2 days" },
          { dot: "bg-amber-400", label: "≤7 days" }, 
          { dot: "bg-blue-500", label: "Upcoming" },
          { dot: "bg-green-500", label: "Done" }
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">{label}</span>
          </div>
        ))}
      </div>

      {/* Timeline Area */}
      {timelineTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[13px] font-medium text-gray-500">No deadlines found</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Your project is all caught up!</p>
        </div>
      ) : (
        <div className="relative w-full flex-1 group">
          {/* Custom Horizontal Scroll Container */}
          <div 
            ref={scrollRef}
            className="flex items-start gap-12 overflow-x-auto pb-8 pt-8 px-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent snap-x snap-mandatory"
            style={{ scrollBehavior: 'smooth' }}
          >
            {/* The continuous line background */}
            <div className="absolute top-10.25 left-8 right-8 h-0.5 bg-linear-to-r from-gray-200 via-gray-300 to-gray-200 z-0 pointer-events-none" />

            {timelineTasks.map((item) => {
              const isDone = item.status?.statusCategory === "DONE";
              const isOverdue = item.daysLeft < 0;
              const isUrgent = !isDone && item.daysLeft >= 0 && item.daysLeft <= 2;
              const isSoon = !isDone && item.daysLeft > 2 && item.daysLeft <= 7;
              
              const nodeBg = isDone ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                          : isOverdue ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" 
                          : isUrgent ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" 
                          : isSoon ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                          : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]";
                          
              const pulseEffect = (isOverdue || isUrgent) && !isDone 
                                ? "animate-pulse ring-4 ring-opacity-20 " + (isOverdue ? "ring-red-500" : "ring-orange-500") 
                                : "";
              
              const labelColor = isOverdue ? "text-red-600 font-bold" 
                               : isUrgent ? "text-orange-600 font-bold" 
                               : isSoon ? "text-amber-600 font-semibold"
                               : isDone ? "text-green-600 font-semibold" 
                               : "text-blue-600 font-semibold";
                               
              const daysLabel = isDone ? "Done" : isOverdue ? `${Math.abs(item.daysLeft)}d ago` : item.daysLeft === 0 ? "Today" : item.daysLeft === 1 ? "1d left" : `${item.daysLeft}d left`;
              
              const isHovered = hoveredData?.id === item.id;

              return (
                <div 
                  key={item.id} 
                  className="flex flex-col items-center gap-2 cursor-pointer relative z-10 shrink-0 min-w-20 snap-center group/node"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredData({ id: item.id, rect, item });
                  }}
                  onMouseLeave={() => setHoveredData(null)}
                >
                  {/* Top Date Label */}
                  <span className={`text-[10px] whitespace-nowrap bg-white px-1 -translate-y-1 ${labelColor}`}>
                    {item.deadlineLabel}
                  </span>
                  
                  {/* The Timeline Node */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 border-white transition-all duration-300 ease-out 
                                    ${nodeBg} ${pulseEffect} ${isHovered ? "scale-150 ring-4 ring-black/5" : ""}`} />
                  </div>
                  
                  {/* Bottom Info */}
                  <span className={`text-[11px] whitespace-nowrap mt-1 ${labelColor}`}>{daysLabel}</span>
                  <span className="text-[10px] text-gray-600 font-medium text-center leading-tight w-25 line-clamp-2 mt-0.5 group-hover/node:text-purple-700 transition-colors">
                    {item.issueName}
                  </span>
                  <div className="mt-1">
                    <TypeChip issueType={item.issueType} />
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Gradient Edges for scroll indication */}
          <div className="absolute top-0 bottom-0 left-0 w-8 bg-linear-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-8 bg-linear-to-l from-white to-transparent pointer-events-none" />
        </div>
      )}

      {/* Tooltip Portal */}
      {hoveredData && createPortal(
        <div 
          className="fixed z-50 w-52 bg-white border border-gray-200 rounded-xl shadow-xl p-3 pointer-events-none"
          style={{ 
            bottom: window.innerHeight - hoveredData.rect.top + 8, // Display above the node with 8px gap
            left: hoveredData.rect.left + hoveredData.rect.width / 2,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <TypeChip issueType={hoveredData.item.issueType} />
            <PriorityBadge priority={apiPriorityToUI(hoveredData.item.priority)} />
          </div>
          <p className="text-[12px] font-semibold text-gray-800 leading-snug mb-2">{hoveredData.item.issueName}</p>
          <div className="flex items-center gap-1.5 mb-2">
            {hoveredData.item.assignees && hoveredData.item.assignees.length > 0 ? (
              <>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {hoveredData.item.assignees.slice(0, 2).map((a: UserSummary, idx: number) => (
                    <img
                      key={idx}
                      src={avatarUrl(a.profileName, a.picture)}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover border border-white"
                    />
                  ))}
                </div>
                <span className="text-[10px] text-gray-500 truncate max-w-35">
                  {hoveredData.item.assignees.length === 1
                    ? hoveredData.item.assignees[0].profileName
                    : `${hoveredData.item.assignees.length} people`}
                </span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 bg-gray-200 rounded-full" />
                <span className="text-[10px] text-gray-500">Unassigned</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-between">
            <StatusBadge status={apiStatusToUI(hoveredData.item.status)} />
            <span className={`text-[10px] font-semibold ${hoveredData.item.daysLeft < 0 ? "text-red-600" : (hoveredData.item.daysLeft <= 7 && hoveredData.item.status?.statusCategory !== "DONE") ? "text-orange-600" : hoveredData.item.status?.statusCategory === "DONE" ? "text-green-600" : "text-blue-600"}`}>
              {hoveredData.item.deadlineLabel}
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}