/**
 * @file DeadlineTimeline.tsx
 * @description Component hiển thị dòng thời gian biểu đồ (Timeline) cho các sự vụ sắp đến hạn và quá hạn của dự án.
 * @author Warmdrobe
 */

import { useState } from "react";
import type { OverviewData } from "../../hooks/useOverview";
import { apiTypeToUI, apiPriorityToUI, apiStatusToUI } from "../../utils/issueMapper";
import { avatarUrl } from "../../utils/avatar";

type TaskStatus = "to_do" | "in_progress" | "done";
type TaskType = "epic" | "story" | "task";
type TaskPriority = "urgent" | "high" | "medium" | "low";

function TypeChip({ type }: { type: TaskType }) {
  const cls: Record<TaskType, string> = { epic: "bg-violet-100 text-violet-700", story: "bg-sky-100 text-sky-700", task: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${cls[type]}`}>{type}</span>;
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

/**
 * Component DeadlineTimeline hiển thị danh sách các sự vụ được sắp xếp theo thời hạn hoàn thành của chúng.
 * Giúp người quản lý nhanh chóng phát hiện các công việc quá hạn hoặc sắp đến hạn cần chú ý.
 */
export default function DeadlineTimeline({ data }: { data: OverviewData }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const { timelineTasks, overdueCount, dueSoonCount } = data;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm col-span-2">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-800">Deadline Timeline</h2>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <span className="text-[10px] font-semibold bg-red-50 text-red-500 border border-red-100 px-2.5 py-1 rounded-full">
              {overdueCount} overdue
            </span>
          )}
          {dueSoonCount > 0 && (
            <span className="text-[14px] font-semibold text-orange-600 px-2.5 py-1 rounded-full">
              {dueSoonCount} due soon
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 px-4 mb-1">
        {[{ dot: "bg-red-600", label: "Overdue" }, { dot: "bg-orange-600", label: "≤2 days" },
          { dot: "bg-orange-600", label: "≤7 days" }, { dot: "bg-blue-600", label: "Upcoming" },
          { dot: "bg-green-600", label: "Done" }].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${dot}`} />
            <span className="text-[9px] text-gray-700">{label}</span>
          </div>
        ))}
      </div>

      {timelineTasks.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">No deadlines found.</p>
      ) : (
        <div className="relative px-4 py-6">
          <div className="absolute top-13.25 left-8 right-8 h-px bg-gray-400" />
          <div className="flex items-start justify-between gap-1 relative">
            {timelineTasks.map((item) => {
              const isDone = item.status === "DONE";
              const isOverdue = item.daysLeft < 0;
              const isUrgent = !isDone && item.daysLeft >= 0 && item.daysLeft <= 2;
              const isSoon = !isDone && item.daysLeft > 2 && item.daysLeft <= 7;
              const nodeBg = isDone ? "bg-green-600 border-none" : isOverdue ? "bg-red-600 border-none" : isUrgent || isSoon ? "bg-orange-600 border-none" : "bg-blue-600 border-none";
              const labelCls = isOverdue ? "text-red-600" : isUrgent || isSoon ? "text-orange-600" : isDone ? "text-green-600" : "text-gray-600";
              const daysLabel = isDone ? "Done" : isOverdue ? `${Math.abs(item.daysLeft)}d ago` : item.daysLeft === 0 ? "Today" : item.daysLeft === 1 ? "1d left" : `${item.daysLeft}d`;
              const isHovered = hovered === item.id;
              const type = apiTypeToUI(item.issueType);
              const priority = apiPriorityToUI(item.priority);
              const status = apiStatusToUI(item.status);

              return (
                <div key={item.id} className="flex flex-col items-center gap-1.5 cursor-pointer relative"
                  style={{ minWidth: 0, flex: 1 }}
                  onMouseEnter={() => setHovered(item.id)}
                  onMouseLeave={() => setHovered(null)}>
                  <span className={`text-[9px] font-semibold whitespace-nowrap ${labelCls}`}>{item.deadlineLabel}</span>
                  <div className={`w-5 h-5 rounded-full border-2 z-10 shrink-0 transition-transform duration-150 ${nodeBg} ${isHovered ? "scale-125" : ""}`} />
                  <span className={`text-[9px] font-semibold whitespace-nowrap ${labelCls}`}>{daysLabel}</span>
                  <span className="text-[9px] text-gray-500 text-center leading-tight max-w-18 truncate px-0.5">{item.issueName}</span>
                  <TypeChip type={type} />

                  {isHovered && (
                    <div className="absolute top-full mt-2 left-1/2 z-50 w-52 bg-white border border-gray-200 rounded-xl shadow-xl p-3 pointer-events-none">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TypeChip type={type} />
                        <PriorityBadge priority={priority} />
                      </div>
                      <p className="text-[12px] font-semibold text-gray-800 leading-snug mb-2">{item.issueName}</p>
                      <div className="flex items-center gap-1.5 mb-2">
                        {item.assignees && item.assignees.length > 0 ? (
                          <>
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {item.assignees.slice(0, 2).map((a, idx) => (
                                <img
                                  key={idx}
                                  src={avatarUrl(a.profileName, a.picture)}
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover border border-white"
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-500 truncate max-w-35">
                              {item.assignees.length === 1
                                ? item.assignees[0].profileName
                                : `${item.assignees.length} people`}
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
                        <StatusBadge status={status} />
                        <span className={`text-[10px] font-semibold ${labelCls}`}>{item.deadlineLabel}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}