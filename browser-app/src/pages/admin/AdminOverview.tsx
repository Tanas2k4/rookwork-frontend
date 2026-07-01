import { useState, useEffect } from "react";
import { adminApi } from "../../api/services/adminApi";
import type { AdminStatsResponse } from "../../api/contracts/admin";
import { TbUsers, TbStack2, TbChecklist, TbCurrencyDollar, TbArrowUpRight, TbArrowDownRight, TbAlertTriangle, TbX, TbCheck, TbCalendar, TbChevronDown } from "react-icons/tb";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface SparklineProps {
  data: number[];
  color: string;
}

function Sparkline({ data, color }: SparklineProps) {
  if (!data || data.length === 0) return null;
  const width = 64;
  const height = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  });
  
  const pathD = `M ${points.join(" L ")}`;
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface DonutChartProps {
  data: Record<string, number>;
  colors: string[];
}

function DonutChart({ data, colors }: DonutChartProps) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const size = 120;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  
  let currentOffset = 0;
  const segments = Object.entries(data).map(([key, val], i) => {
    const percentage = val / total;
    const strokeDash = percentage * circumference;
    const offset = currentOffset;
    currentOffset += strokeDash;
    
    return {
      key,
      val,
      color: colors[i % colors.length],
      strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
      strokeDashoffset: -offset,
    };
  });
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((s, i) => (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={s.color}
            strokeWidth={12}
            strokeDasharray={s.strokeDasharray}
            strokeDashoffset={s.strokeDashoffset}
          />
        ))}
      </g>
    </svg>
  );
}

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("week");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const rangeLabels = {
    day: "Last 24 Hours",
    week: "Last 7 Days",
    month: "Last 30 Days"
  };

  useEffect(() => {
    adminApi.getStats(timeRange)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [timeRange]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-neutral-400">Loading overview analytics...</p>
      </div>
    );
  }

  const fmtCurr = (v: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  };

  const getAlertIcon = (type: string) => {
    if (type === "warn") return <TbAlertTriangle className="text-amber-600" />;
    if (type === "err") return <TbX className="text-rose-600" />;
    return <TbCheck className="text-emerald-600" />;
  };

  const chartData = stats.userGrowth.map((val, idx) => ({
    name: stats.userGrowthLabels[idx] || "",
    registrations: val,
  }));

  const calculateGrowth = (total: number, growthArray: number[]) => {
    if (!growthArray || growthArray.length === 0) return 0;
    const added = growthArray.reduce((sum, val) => sum + val, 0);
    const previous = total - added;
    if (previous <= 0) return added > 0 ? 100 : 0;
    return parseFloat(((added / previous) * 100).toFixed(1));
  };

  const userGrowthVal = calculateGrowth(stats.totalUsers, stats.userGrowth);
  const workspaceGrowthVal = calculateGrowth(stats.activeWorkspaces, stats.workspaceGrowth);
  const issueGrowthVal = calculateGrowth(stats.issuesToday, stats.issueGrowth);

  return (
    <div className="opacity-0 translate-y-2 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div className="flex items-center justify-between mb-5.5 gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-neutral-900">System Overview</h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">Platform status analytics — workspaces, users, and issues activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 border border-neutral-200 bg-white rounded-lg px-3 py-2 text-[13px] font-medium text-neutral-700 cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              <TbCalendar />{rangeLabels[timeRange]}<TbChevronDown />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-10 w-44 animate-in fade-in slide-in-from-top-1 duration-200">
                {Object.entries(rangeLabels).map(([key, label]) => (
                  <div
                    key={key}
                    onClick={() => {
                      setTimeRange(key as "day" | "week" | "month");
                      setLoading(true);
                      setDropdownOpen(false);
                    }}
                    className={`px-3 py-2 text-[13px] cursor-pointer hover:bg-neutral-50 transition-colors ${timeRange === key ? "bg-indigo-50 text-indigo-700 font-medium" : "text-neutral-750"}`}
                  >
                    {label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-6.5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <span className="text-[13px] text-neutral-500 font-medium">Total Users</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-indigo-50 text-indigo-700">
              <TbUsers size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 mb-1.5 tracking-tight text-neutral-900">{stats.totalUsers.toLocaleString()}</div>
          <div className="flex items-center justify-between">
            {userGrowthVal >= 0 ? (
              <span className="flex items-center gap-0.5 text-[12.5px] font-semibold text-emerald-600">
                <TbArrowUpRight />{userGrowthVal}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[12.5px] font-semibold text-rose-600">
                <TbArrowDownRight />{Math.abs(userGrowthVal)}%
              </span>
            )}
            <div className="w-16 h-6">
              <Sparkline data={stats.userGrowth} color="#6657e6" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <span className="text-[13px] text-neutral-500 font-medium">Active Workspaces</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-emerald-50 text-emerald-600">
              <TbStack2 size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 mb-1.5 tracking-tight text-neutral-900">{stats.activeWorkspaces.toLocaleString()}</div>
          <div className="flex items-center justify-between">
            {workspaceGrowthVal >= 0 ? (
              <span className="flex items-center gap-0.5 text-[12.5px] font-semibold text-emerald-600">
                <TbArrowUpRight />{workspaceGrowthVal}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[12.5px] font-semibold text-rose-600">
                <TbArrowDownRight />{Math.abs(workspaceGrowthVal)}%
              </span>
            )}
            <div className="w-16 h-6">
              <Sparkline data={stats.workspaceGrowth} color="#0f9d72" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <span className="text-[13px] text-neutral-500 font-medium">Issues Created / Day</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-amber-50 text-amber-600">
              <TbChecklist size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 mb-1.5 tracking-tight text-neutral-900">{stats.issuesToday.toLocaleString()}</div>
          <div className="flex items-center justify-between">
            {issueGrowthVal >= 0 ? (
              <span className="flex items-center gap-0.5 text-[12.5px] font-semibold text-emerald-600">
                <TbArrowUpRight />{issueGrowthVal}%
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[12.5px] font-semibold text-rose-600">
                <TbArrowDownRight />{Math.abs(issueGrowthVal)}%
              </span>
            )}
            <div className="w-16 h-6">
              <Sparkline data={stats.issueGrowth} color="#d4434f" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5 transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-start justify-between">
            <span className="text-[13px] text-neutral-500 font-medium">MRR</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-indigo-50 text-indigo-700">
              <TbCurrencyDollar size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 mb-1.5 tracking-tight text-neutral-900">{fmtCurr(stats.mrr)}</div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-0.5 text-[12.5px] font-semibold text-emerald-600"><TbArrowUpRight />5.2%</span>
            <div className="w-16 h-6">
              <Sparkline data={[60, 62, 65, 63, 68, 70, 76]} color="#6657e6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">User Growth</div>
              <div className="text-xs text-neutral-400 mt-0.5">Total registered accounts history</div>
            </div>
            <div className="flex gap-1 bg-neutral-100 p-0.5 rounded-full">
              <div 
                className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all ${timeRange === "day" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-850"}`}
                onClick={() => setTimeRange("day")}
              >
                Day
              </div>
              <div 
                className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all ${timeRange === "week" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-850"}`}
                onClick={() => setTimeRange("week")}
              >
                Week
              </div>
              <div 
                className={`text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-all ${timeRange === "month" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-850"}`}
                onClick={() => setTimeRange("month")}
              >
                Month
              </div>
            </div>
          </div>
          <div className="h-57.5 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6657e6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6657e6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0efe9" />
                <XAxis dataKey="name" stroke="#9a9da3" fontSize={11} tickLine={false} />
                <YAxis stroke="#9a9da3" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid #eeede8", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="registrations" stroke="#6657e6" strokeWidth={2.5} fillOpacity={1} fill="url(#userGrowthGrad)" activeDot={{ r: 6 }} dot={{ r: 4, strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">Plan Distribution</div>
              <div className="text-xs text-neutral-400 mt-0.5">Workspace subscriptions percentage</div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {Object.entries(stats.planDistribution).map(([name, val]) => {
              const colors: Record<string, string> = {
                Free: "bg-neutral-400",
                Pro: "bg-indigo-600",
                Team: "bg-blue-500",
                Enterprise: "bg-emerald-500",
              };
              return (
                <div className="mb-4 last:mb-0" key={name}>
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span className="font-semibold text-neutral-700">{name}</span>
                    <span className="font-mono text-neutral-500 text-xs">{val}%</span>
                  </div>
                  <div className="h-1.75 bg-neutral-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${colors[name] || "bg-indigo-600"}`} style={{ width: `${val}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">Global Issues</div>
              <div className="text-xs text-neutral-400 mt-0.5">Status classification distribution</div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-30 h-30 shrink-0">
              <DonutChart data={stats.issueDistribution} colors={["#6657e6", "#10b981", "#f59e0b", "#94a3b8"]} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <div className="font-bold text-2xl text-neutral-900 leading-none mb-0.5">
                  {Object.values(stats.issueDistribution).reduce((a, b) => a + b, 0).toLocaleString()}
                </div>
                <div className="text-[9px] text-neutral-400 uppercase tracking-wider font-semibold leading-none text-center">total issues</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full pt-2">
              {Object.entries(stats.issueDistribution).map(([key, val], i) => {
                const colors = ["bg-indigo-600", "bg-emerald-500", "bg-amber-500", "bg-slate-400"];
                const labelMap: Record<string, string> = {
                  "To do": "To Do",
                  "Đang làm": "In Progress",
                  "Review": "Review",
                  "Hoàn thành": "Completed"
                };
                return (
                  <div className="flex items-center justify-between text-[12.5px] border-b border-neutral-50 pb-1" key={key}>
                    <span className="flex items-center gap-1.5 text-neutral-600 font-medium">
                      <span className={`w-2.25 h-2.25 rounded-[3px] shrink-0 ${colors[i % colors.length]}`} />
                      {labelMap[key] || key}
                    </span>
                    <span className="font-mono text-neutral-500 text-xs font-semibold">{val.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">Recent Workspaces</div>
              <div className="text-xs text-neutral-400 mt-0.5">Latest registered organization spaces</div>
            </div>
          </div>
          <div className="flex flex-col">
            {stats.recentWorkspaces.map((item, idx) => {
              const date = new Date(item.createdAt);
              const day = date.getDate() || 28;
              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              const month = months[date.getMonth()] || "Jun";
              
              const tagColors: Record<string, string> = {
                Pro: "bg-emerald-50 text-emerald-700",
                Team: "bg-amber-50 text-amber-700",
                Free: "bg-indigo-50 text-indigo-700",
              };

              return (
                <div className="flex items-center gap-2.75 py-2.5 border-b border-neutral-100 last:border-b-0" key={item.id || idx}>
                  <div className="w-10.5 h-10.5 rounded-xl bg-neutral-50 flex flex-col items-center justify-center shrink-0 border border-neutral-100">
                    <div className="font-bold text-[15px] text-neutral-800 leading-none">{day}</div>
                    <div className="text-[9.5px] text-neutral-400 uppercase tracking-wider mt-0.5 font-medium">{month}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate text-neutral-800">{item.name}</div>
                    <div className="text-xs text-neutral-500 mt-0.5">{item.memberCount} members</div>
                    <span className={`inline-flex items-center text-[10.5px] font-bold px-2 py-0.5 rounded-[5px] mt-1 ${tagColors[item.plan] || "bg-indigo-50 text-indigo-700"}`}>{item.plan}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">System Alerts</div>
              <div className="text-xs text-neutral-400 mt-0.5">Infrastructure notifications requiring attention</div>
            </div>
          </div>
          <div className="flex flex-col">
            {stats.alerts.map((alert, idx) => {
              const bgColors: Record<string, string> = {
                warn: "bg-amber-50 text-amber-700",
                err: "bg-rose-50 text-rose-700",
                ok: "bg-emerald-50 text-emerald-750",
              };
              const englishAlerts: Record<string, string> = {
                "CPU API server spiked to 82%": "API server CPU load spiked to 82%",
                "5 transaction payments failed": "5 transaction payments failed",
                "Automated system data backup completed": "Automated system data backup completed",
                "Email dispatch failure rate rose to 1.8%": "Email dispatch failure rate rose to 1.8%"
              };
              const englishTime: Record<string, string> = {
                "12 minutes ago": "12m ago",
                "40 minutes ago": "40m ago",
                "2 hours ago": "2h ago",
                "5 hours ago": "5h ago"
              };
              return (
                <div className="flex items-center gap-2.75 py-2.5 border-b border-neutral-100 last:border-b-0" key={idx}>
                  <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 text-sm ${bgColors[alert.type] || "bg-amber-50 text-amber-700"}`}>
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-neutral-700 leading-normal font-medium">{englishAlerts[alert.content] || alert.content}</div>
                    <div className="text-[11.5px] text-neutral-400 mt-0.5 font-mono">{englishTime[alert.time] || alert.time}</div>
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
