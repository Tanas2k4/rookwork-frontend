import { useState, useRef, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { RiCheckLine, RiArrowDownSLine } from "react-icons/ri";
import { workLogApi } from "../api/services/workLogApi";
import type { DailyHours } from "../api/contracts/worklog";
import { useClickOutside } from "../hooks/useClickOutside";

const OPTIONS = [
  { value: "Weekly", label: "Weekly" },
  { value: "Monthly", label: "Monthly" },
] as const;

function PeriodDropdown({ value, onChange }: {
  value: "Weekly" | "Monthly";
  onChange: (v: "Weekly" | "Monthly") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false));


  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 border border-gray-500 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition-all"
      >
        {value}
        <RiArrowDownSLine
          size={14}
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1.5 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1"
          style={{ animation: "fadeSlideDown 0.12s ease-out" }}
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-gray-100 transition-colors"
              style={{ color: value === opt.value ? "#7c3aed" : "#4b5563" }}
            >
              {opt.label}
              {value === opt.value && <RiCheckLine size={13} className="text-purple-500" />}
            </button>
          ))}
        </div>
      )}
      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

interface ChartPoint {
  label: string;
  thisWeek: number;
  lastWeek: number;
}

function CustomDot(props: {
  cx?: number;
  cy?: number;
  index?: number;
  dataKey?: string;
  data: ChartPoint[];
}) {
  const { cx, cy, index, dataKey, data } = props;
  if (dataKey !== "thisWeek" || index === undefined) return <g />;

  const maxVal = Math.max(...data.map((d) => d.thisWeek));
  if (data[index]?.thisWeek !== maxVal || maxVal === 0) return <g />;

  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#22c55e" opacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill="#22c55e" stroke="white" strokeWidth={2} />
    </g>
  );
}

interface TooltipEntry {
  dataKey?: string | number;
  color?: string;
  value?: number;
}

function ChartTooltip({ active, payload, label, period }: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  period: "Weekly" | "Monthly";
}) {
  if (!active || !payload?.length) return null;
  const unit = period === "Weekly" ? "h" : "h total";
  return (
    <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs min-w-32.5 shadow-sm">
      <p className="font-heading font-semibold text-gray-600 mb-2">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: entry.color }} />
          <span className="text-gray-400">
            {entry.dataKey === "thisWeek" ? "This Period" : "Last Period"}
          </span>
          <span className="font-bold ml-auto" style={{ color: entry.color }}>
            {entry.value}{unit}
          </span>
        </div>
      ))}
    </div>
  );
}

function buildChartData(thisWeek: DailyHours[], lastWeek: DailyHours[]): ChartPoint[] {
  return thisWeek.map((item, i) => ({
    label: item.label,
    thisWeek: Number(item.hours) || 0,
    lastWeek: Number(lastWeek[i]?.hours) || 0,
  }));
}

export default function WorkingHoursChart() {
  const [period, setPeriod] = useState<"Weekly" | "Monthly">("Weekly");
  const [chartState, setChartState] = useState<{
    data: ChartPoint[];
    loading: boolean;
  }>({ data: [], loading: true });

  useEffect(() => {
    workLogApi
      .getStats(period === "Weekly" ? "weekly" : "monthly")
      .then((res) =>
        setChartState({
          data: buildChartData(res.thisWeek, res.lastWeek),
          loading: false,
        })
      )
      .catch(() => setChartState({ data: [], loading: false }));
  }, [period]);

  const { data, loading } = chartState;

  const maxVal = data.length > 0
    ? Math.max(...data.flatMap((d) => [d.thisWeek, d.lastWeek]))
    : 10;

  const yMax = period === "Weekly"
    ? Math.max(10, Math.ceil(maxVal / 2) * 2)
    : Math.max(100, Math.ceil(maxVal / 25) * 25);

  const yTicks = period === "Weekly"
    ? Array.from({ length: 6 }, (_, i) => Math.round((yMax / 5) * i))
    : Array.from({ length: 5 }, (_, i) => Math.round((yMax / 4) * i));

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <h2 className="font-heading font-bold text-gray-800 text-base">Statistics</h2>
        <PeriodDropdown value={period} onChange={setPeriod} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-gray-500 font-medium">Working Hours</p>
        <div className="flex items-center gap-4 text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block bg-[#22c55e]" />
            This {period === "Weekly" ? "Week" : "Year"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block bg-[#f43f5e]" />
            Last {period === "Weekly" ? "Week" : "Year"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="h-50 flex items-center justify-center">
          <p className="text-xs text-gray-400">Loading...</p>
        </div>
      ) : data.length === 0 || data.every((d) => d.thisWeek === 0 && d.lastWeek === 0) ? (
        <div className="h-50 flex items-center justify-center">
          <p className="text-xs text-gray-400">No work logged yet — start tracking your hours!</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              dy={8}
            />
            <YAxis
              domain={[0, yMax]}
              ticks={yTicks}
              tick={{ fontSize: 10, fill: "#cbd5e1" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip period={period} />}
              cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="lastWeek"
              stroke="#f43f5e"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#f43f5e", stroke: "white", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="thisWeek"
              stroke="#22c55e"
              strokeWidth={2}
              dot={<CustomDot data={data} />}
              activeDot={{ r: 4, fill: "#22c55e", stroke: "white", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}