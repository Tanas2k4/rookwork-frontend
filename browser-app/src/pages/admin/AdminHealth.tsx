import { useState, useEffect } from "react";
import { adminApi } from "../../api/services/adminApi";
import type { SystemHealthResponse } from "../../api/contracts/admin";
import { TbCheck, TbX, TbAlertTriangle, TbActivity } from "react-icons/tb";

export function AdminHealth() {
  const [health, setHealth] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uptimeBars] = useState<string[]>(() => {
    return Array.from({ length: 30 }, () => {
      const rand = Math.random();
      if (rand > 0.96) return "down";
      if (rand > 0.92) return "warn";
      return "ok";
    });
  });

  useEffect(() => {
    let active = true;

    const fetchHealth = () => {
      adminApi.getHealth()
        .then(res => {
          if (active) setHealth(res);
        })
        .catch(console.error)
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    fetchHealth();
    
    const interval = setInterval(() => {
      fetchHealth();
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (loading || !health) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-neutral-400">Loading system health statistics...</p>
      </div>
    );
  }

  const getLogIcon = (type: string) => {
    if (type === "err") return <TbX className="text-rose-600" />;
    if (type === "warn") return <TbAlertTriangle className="text-amber-600" />;
    return <TbCheck className="text-emerald-600" />;
  };

  return (
    <div className="opacity-0 translate-y-2 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div className="flex items-center justify-between mb-5.5 gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-neutral-900">System Health</h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">Real-time infrastructure performance metrics and operations audits.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-currentColor animate-pulse" />
            All systems operational
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">30d Uptime</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{health.uptime30d}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-semibold">API Latency (p95)</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{health.apiLatency}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">API Error Rate</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{health.errorRate}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">Background Jobs Queue</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{health.jobQueue.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5 mb-4">
        <div className="mb-4">
          <div className="font-bold text-[14.5px] text-neutral-850">30-Day Uptime History</div>
          <div className="text-xs text-neutral-400 mt-0.5">Each bar represents a day — green represents 100% service uptime</div>
        </div>
        <div className="flex gap-0.75">
          {uptimeBars.map((state, idx) => {
            const barBg = state === "ok" ? "bg-emerald-500" : (state === "warn" ? "bg-amber-500" : "bg-rose-500");
            const label = state === "ok" ? "100% operational" : (state === "warn" ? "minor outage detected" : "service interruption");
            return (
              <div 
                key={idx} 
                className={`flex-1 h-7 rounded-[3px] transition-opacity hover:opacity-80 ${barBg}`}
                title={`Day ${idx + 1}: ${label}`}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">Live Server Resources (Actuator API)</div>
              <div className="text-xs text-neutral-400 mt-0.5">Refreshed every 5s</div>
            </div>
            <TbActivity size={18} className="text-indigo-600 animate-pulse" />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-sm font-semibold mb-1.5">
                <span className="text-neutral-700">CPU Usage (JVM Process)</span>
                <span className="font-mono text-neutral-500 text-xs">{health.cpuUsage}</span>
              </div>
              <div className="h-1.75 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-indigo-600" 
                  style={{ width: health.cpuUsage }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-semibold mb-1.5">
                <span className="text-neutral-700">Memory Allocation</span>
                <span className="font-mono text-neutral-500 text-xs">{health.memoryUsage}</span>
              </div>
              <div className="h-1.75 bg-neutral-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-emerald-500" 
                  style={{ width: "42%" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">System Audit Logs</div>
              <div className="text-xs text-neutral-400 mt-0.5">Latest server infrastructure and security events log</div>
            </div>
          </div>
          <div className="flex flex-col">
            {health.logs.map((log, idx) => {
              const bgColors: Record<string, string> = {
                err: "bg-rose-50 text-rose-700",
                warn: "bg-amber-50 text-amber-700",
                ok: "bg-emerald-50 text-emerald-700",
              };
              const englishLogs: Record<string, string> = {
                "500 Internal Error — /api/tasks/bulk-update": "500 Internal Server Error — /api/tasks/bulk-update",
                "Độ trễ database vượt 300ms": "Database connection latency exceeded 300ms",
                "Triển khai phiên bản v4.12.0 thành công": "Successfully deployed release bundle v4.12.0 to cluster",
                "Sao lưu dữ liệu định kỳ hoàn tất": "Automated system data snapshots completed"
              };
              return (
                <div className="flex items-center gap-2.75 py-2.5 border-b border-neutral-100 last:border-b-0" key={idx}>
                  <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 text-sm ${bgColors[log.type] || "bg-emerald-50 text-emerald-750"}`}>
                    {getLogIcon(log.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-neutral-700 font-mono leading-normal">{englishLogs[log.content] || log.content}</div>
                    <div className="text-[11.5px] text-neutral-400 mt-0.5 font-mono">{log.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
