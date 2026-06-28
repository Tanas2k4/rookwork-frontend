import type { OverviewData } from "../../hooks/useOverview";

export default function WorkloadSection({
  data,
  animated,
}: {
  data: OverviewData;
  animated: boolean;
}) {
  const { workload, maxWorkload } = data;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm col-span-2">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">
        Assignment & Workload
      </h2>
      {workload.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">
          No assignments yet.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-gray-50 ">
          {workload.map((u) => {
            const pct = Math.round((u.count / maxWorkload) * 100);
            const barCls =
              pct > 80
                ? "bg-green-600"
                : pct > 60
                  ? "bg-orange-600"
                  : "bg-red-600";
            const pctCls =
              pct > 80
                ? "text-green-600"
                : pct > 60
                  ? "text-orange-600"
                  : "text-red-600";
            return (
              <div key={u.id} className="flex items-center gap-6 py-2.5">
                <img
                  src={u.picture}
                  alt={u.name}
                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-white"
                />
                <div className="w-48 shrink-0">
                  <p
                    className="text-[13px] font-semibold text-gray-800 truncate"
                    title={u.name}
                  >
                    {u.name}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  {" "}
                  {/* ← đổi w-80 shrink-0 thành flex-1 min-w-0 */}
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full rounded-full ${barCls} transition-all duration-700 ease-out`}
                      style={{ width: animated ? `${pct}%` : "0%" }}
                    />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-gray-500">
                      {u.count} tasks
                    </span>
                    <span className={`text-[10px] font-semibold ${pctCls}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
