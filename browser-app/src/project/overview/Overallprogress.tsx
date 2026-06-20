import type { OverviewData } from "../../hooks/useOverview";

function DonutChart({ data, animated }: { data: OverviewData; animated: boolean }) {
  const done       = data.doneTasks;
  const inProgress = data.inProgressTasks;
  const total      = data.totalTasks || 1;
  const toDo       = Math.max(0, total - done - inProgress);

  const chartData = [
    { label: "Done",        value: done,       color: "#10b981" },
    { label: "In Progress", value: inProgress, color: "#6366f1" },
    { label: "To Do",       value: toDo,       color: "#cbd5e1" },
  ];

  const r = 48, cx = 60, cy = 60, sw = 16;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const segments = chartData.map((d) => {
    const realDash = (d.value / total) * circ;
    const dash = animated ? realDash : 0;
    const el = (
      <circle key={d.label} cx={cx} cy={cy} r={r} fill="none"
        stroke={d.color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeDashoffset={-offset}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: `${cx}px ${cy}px`,
          transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)",
        }} />
    );
    offset += realDash;
    return el;
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative w-30 h-30 shrink-0">
        <svg width={120} height={120}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
          {segments}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-gray-900">{total}</span>
          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Tasks</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {chartData.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: d.color }} />
            <span className="text-[11px] text-gray-500 flex-1">{d.label}</span>
            <span className="text-sm font-semibold text-gray-800">{d.value}</span>
            <span className="text-[10px] text-gray-400 w-8 text-right">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OverallProgress({ data, animated }: { data: OverviewData; animated: boolean }) {
  const p = data.overallProgress;
  const barCls = p === 100 ? "bg-green-600" : p >= 80 ? "bg-green-500" : p >= 60 ? "bg-yellow-500" : p >= 30 ? "bg-orange-500" : "bg-red-500";
  const textCls = p === 100 ? "text-green-600" : p >= 80 ? "text-green-500" : p >= 60 ? "text-yellow-500" : p >= 30 ? "text-orange-500" : "text-red-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800 mb-3">Overall Progress</h2>
      <div className="mb-1">
        <div className="flex justify-between text-[11px] font-semibold text-gray-700 mb-1.5">
          <span>Completion</span>
          <span className={`font-semibold ${textCls}`}>{p}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${barCls}`}
            style={{ width: animated ? `${p}%` : "0%" }} />
        </div>
      </div>
      <div className="border-t border-gray-100 mt-4 pt-4">
        <DonutChart data={data} animated={animated} />
      </div>
    </div>
  );
}