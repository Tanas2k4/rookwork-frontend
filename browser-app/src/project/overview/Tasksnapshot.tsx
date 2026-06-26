import type { OverviewData } from "../../hooks/useOverview";
import type { IssueType, PriorityType } from "../../api/contracts/issue";
import { avatarUrl } from "../../utils/avatar";

type TaskType = "epic" | "story" | "task";
type TaskPriority = "urgent" | "high" | "medium" | "low";

function apiTypeToUI(t: IssueType): TaskType { return t.toLowerCase() as TaskType; }
function apiPriorityToUI(p: PriorityType | null): TaskPriority { return (p?.toLowerCase() ?? "medium") as TaskPriority; }

function TypeChip({ type }: { type: TaskType }) {
  const cls: Record<TaskType, string> = { epic: "bg-violet-100 text-violet-700", story: "bg-sky-100 text-sky-700", task: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${cls[type]}`}>{type}</span>;
}
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cls: Record<TaskPriority, string> = { urgent: "bg-red-100 text-red-600", high: "bg-orange-50 text-orange-500", medium: "bg-orange-50 text-orange-600", low: "bg-green-50 text-green-600" };
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${cls[priority]}`}>{priority}</span>;
}

export default function TaskSnapshot({ data }: { data: OverviewData }) {
  const { totalTasks, doneTasks, overdueCount, dueSoonCount, attentionTasks } = data;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Task Snapshot</h2>
        <button className="text-xs text-gray-700 border border-gray-500 font-semibold hover:bg-gray-100 px-2.5 py-1 rounded-md transition-colors">
          View all tasks
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {[
          { n: totalTasks, label: "Total",    cls: "text-gray-800" },
          { n: doneTasks,  label: "Done",     cls: "text-green-500" },
          { n: overdueCount, label: "Overdue", cls: "text-red-500" },
          { n: dueSoonCount, label: "Due Soon", cls: "text-orange-500" },
        ].map(({ n, label, cls }) => (
          <div key={label} className="bg-gray-50 border border-gray-500 rounded-xl p-3 text-center">
            <p className={`text-2xl font-black ${cls}`}>{n}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Top 5 — Needs Attention</p>
      <div className="flex flex-col divide-y divide-gray-50">
        {attentionTasks.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">All caught up! 🎉</p>
        ) : (
          attentionTasks.map((t) => {
            const isOv = t.daysLeft < 0;
            return (
              <div key={t.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
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
                <div className="flex items-center gap-2 shrink-0">
                  <TypeChip type={apiTypeToUI(t.issueType)} />
                  <PriorityBadge priority={apiPriorityToUI(t.priority)} />
                  <span className={`text-[11px] font-semibold whitespace-nowrap ${isOv ? "text-red-500" : "text-orange-500"}`}>
                    {t.deadlineLabel}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}