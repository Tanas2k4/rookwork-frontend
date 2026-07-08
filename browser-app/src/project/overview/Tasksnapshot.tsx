import type { OverviewData } from "../../hooks/useOverview";
import type { IssueTypeResponse } from "../../api/contracts/issue";
import { avatarUrl } from "../../utils/avatar";
import { issueTypeIcons, type Priority } from "../../types/project";
import { apiPriorityToUI } from "../../utils/issueMapper";

function TypeChip({ issueType }: { issueType: IssueTypeResponse }) {
  if (!issueType) return null;
  const color = issueType.color || "#64748B";
  const Icon = issueTypeIcons[issueType.iconKey || "task"] || issueTypeIcons.task;
  return (
    <div style={{ color }} title={issueType.name} className="inline-flex items-center">
      <Icon size={14} className="shrink-0" />
    </div>
  );
}
function PriorityBadge({ priority }: { priority: Priority }) {
  const cls: Record<Priority, string> = { urgent: "bg-red-100 text-red-600", high: "bg-orange-50 text-orange-500", medium: "bg-orange-50 text-orange-600", low: "bg-green-50 text-green-600" };
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${cls[priority]}`}>{priority}</span>;
}

export default function TaskSnapshot({ data }: { data: OverviewData }) {
  const { attentionTasks } = data;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6  col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Task Snapshot</h2>
        <button className="text-xs text-gray-700 border border-gray-500 font-semibold hover:bg-gray-100 px-2.5 py-1 rounded-md transition-colors">
          View all tasks
        </button>
      </div>

      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Top 5 — Needs Attention</p>
      <div className="flex flex-col divide-y divide-gray-100">
        {attentionTasks.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">All caught up! 🎉</p>
        ) : (
          <>
            {/* Column Headers in English */}
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-2 mb-1 border-b border-gray-100">
              <span>Task & Assignee</span>
              <div className="flex items-center gap-4 shrink-0">
                <span className="w-10 text-center">Type</span>
                <span className="w-18 text-left">Priority</span>
                <span className="w-16 text-right">Deadline</span>
              </div>
            </div>

            {attentionTasks.map((t) => {
              const isOv = t.daysLeft < 0;
              return (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[13px] font-medium text-gray-800 truncate">{t.issueName}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {t.assignees && t.assignees.length > 0 ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                            {t.assignees.slice(0, 2).map((a, idx) => (
                              <img
                                key={idx}
                                src={avatarUrl(a.profileName, a.picture)}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover border border-white"
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-gray-400 truncate max-w-30">
                            {t.assignees.length === 1
                              ? t.assignees[0].profileName
                              : `${t.assignees.length} people`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-5 h-5 bg-gray-200 rounded-full shrink-0" />
                          <span className="text-[11px] text-gray-400">Unassigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-10 flex justify-center">
                      <TypeChip issueType={t.issueType} />
                    </div>
                    <div className="w-18 flex justify-start">
                      <PriorityBadge priority={apiPriorityToUI(t.priority)} />
                    </div>
                    <div className="w-16 text-right">
                      <span className={`text-[11px] font-semibold whitespace-nowrap ${isOv ? "text-red-500" : "text-gray-700"}`}>
                        {t.deadlineLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}