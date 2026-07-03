import type { OverviewData } from "../../hooks/useOverview";

type TaskStatus = "to_do" | "in_progress" | "done";

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg: Record<TaskStatus, { cls: string; label: string }> = {
    to_do: { cls: "bg-gray-100 text-gray-800 border-none", label: "To Do" },
    in_progress: { cls: "bg-blue-100 text-blue-800 border-none", label: "In Progress" },
    done: { cls: "bg-green-100 text-green-800 border-none", label: "Done" },
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${cfg[status].cls}`}>
      {cfg[status].label}
    </span>
  );
}

export default function Milestones({ data, animated }: { data: OverviewData; animated: boolean }) {
  const { milestones } = data;
  const completed = milestones.filter((m) => m.status === "done").length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6  col-span-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-800">Milestones</h2>
        <span className="text-xs text-gray-400">{completed}/{milestones.length} completed</span>
      </div>

      {milestones.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">No epics found.</p>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {milestones.map((m) => {
            const barCls = m.status === "done" ? "bg-green-600" : m.status === "in_progress" ? "bg-blue-600" : "bg-gray-400";
            return (
              <div key={m.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all">
                <p className="text-xs font-semibold text-gray-800 mb-2 leading-snug">{m.name}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400">{m.deadline}</span>
                  <StatusBadge status={m.status} />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] font-semibold text-gray-500 w-7">{m.progress}%</span>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
                    <div className={`h-full rounded-full ${barCls} transition-all duration-700 ease-out`}
                      style={{ width: animated ? `${m.progress}%` : "0%" }} />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">{m.taskCount} {m.taskCount === 1 ? "task" : "tasks"}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}