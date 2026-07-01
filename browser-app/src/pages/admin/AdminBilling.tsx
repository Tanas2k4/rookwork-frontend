import { TbCurrencyDollar, TbTrendingUp, TbTrendingDown, TbAlertTriangle, TbCheck, TbX, TbClock, TbDownload } from "react-icons/tb";

interface BillingStats {
  mrr: number;
  arr: number;
  churnRate: string;
  failedPayments: number;
}

const mockStats: BillingStats = {
  mrr: 84250,
  arr: 1010000,
  churnRate: "2.1%",
  failedPayments: 18,
};

function SVGBarChart({ data, labels }: { data: number[]; labels: string[] }) {
  const width = 500;
  const height = 200;
  const padding = 20;
  const max = Math.max(...data);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Grid lines */}
      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#f0efe9" strokeWidth={1} strokeDasharray="3 3" />
      <line x1={padding} y1={padding + chartHeight/2} x2={width - padding} y2={padding + chartHeight/2} stroke="#f0efe9" strokeWidth={1} strokeDasharray="3 3" />
      
      {/* Bars */}
      {data.map((val, i) => {
        const barWidth = (chartWidth / data.length) * 0.6;
        const spacing = chartWidth / data.length;
        const x = padding + i * spacing + (spacing - barWidth) / 2;
        const barHeight = (val / max) * chartHeight;
        const y = padding + chartHeight - barHeight;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="#6657e6"
              rx={3}
              ry={3}
            />
            <text
              x={x + barWidth / 2}
              y={height - 2}
              textAnchor="middle"
              fill="#9a9da3"
              fontSize={9}
              fontFamily="Inter, sans-serif"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function AdminBilling() {
  const fmtCurr = (v: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
  };

  const recentTransactions = [
    { id: 1, type: "ok", name: "Northwind Studio", desc: "upgraded to Pro", amount: "$49", time: "10m ago" },
    { id: 2, type: "err", name: "Solace Inc.", desc: "payment failed", amount: "$99", time: "38m ago" },
    { id: 3, type: "ok", name: "Brightline Labs", desc: "renewed Team plan", amount: "$249", time: "1h ago" },
    { id: 4, type: "warn", name: "Helios Marketing", desc: "trial expiring soon", amount: "$0", time: "2h ago" },
  ];

  return (
    <div className="opacity-0 translate-y-2 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div className="flex items-center justify-between mb-5.5 gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-neutral-900">Billing &amp; Subscriptions</h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">Track MRR, ARR, customer churn rates, and payments status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 border border-neutral-200 bg-white rounded-lg px-3 py-2 text-[13px] font-medium text-neutral-700 cursor-pointer hover:bg-neutral-50 transition-colors">
            <TbDownload />Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="flex items-start justify-between">
            <span className="text-[13px] text-neutral-500 font-medium">MRR (Monthly Revenue)</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-indigo-50 text-indigo-700">
              <TbCurrencyDollar size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 mb-1.5 tracking-tight text-neutral-900">{fmtCurr(mockStats.mrr)}</div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
            <TbTrendingUp /> +5.2% vs. last month
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="flex items-start justify-between">
            <span className="text-[13px] text-neutral-500 font-medium">ARR (Annualized Revenue)</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-emerald-50 text-emerald-700">
              <TbTrendingUp size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 mb-1.5 tracking-tight text-neutral-900">{fmtCurr(mockStats.arr)}</div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
            <TbTrendingUp /> +4.8% vs. last year
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="flex items-start justify-between">
            <span className="text-[13px] text-neutral-500 font-medium">Churn Rate</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-rose-50 text-rose-700">
              <TbTrendingDown size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 mb-1.5 tracking-tight text-neutral-900">{mockStats.churnRate}</div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
            <TbTrendingDown /> -0.3% improvement
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="flex items-start justify-between">
            <span className="text-[13px] text-neutral-500 font-medium">Failed Payments</span>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-amber-50 text-amber-700">
              <TbAlertTriangle size={16} />
            </div>
          </div>
          <div className="text-3xl font-bold mt-2 mb-1.5 tracking-tight text-neutral-900">{mockStats.failedPayments}</div>
          <div className="text-xs font-semibold text-amber-600">
            4 transactions today
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-4 mb-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">Monthly Revenue</div>
              <div className="text-xs text-neutral-400 mt-0.5">Last 12 months (in $K)</div>
            </div>
          </div>
          <div className="relative h-57.5">
            <SVGBarChart data={[52, 55, 58, 57, 61, 64, 67, 70, 73, 76, 80, 84]} labels={["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"]} />
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">Recent Transactions</div>
              <div className="text-xs text-neutral-400 mt-0.5">Today's transactions feed</div>
            </div>
          </div>
          <div className="flex flex-col">
            {recentTransactions.map((tx) => {
              const getTxIcon = (type: string) => {
                if (type === "ok") return <TbCheck className="text-emerald-600" />;
                if (type === "err") return <TbX className="text-rose-600" />;
                return <TbClock className="text-amber-600" />;
              };
              const dotColor = tx.type === "ok" ? "bg-emerald-50 text-emerald-700" : (tx.type === "err" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700");
              return (
                <div className="flex items-center gap-2.75 py-2.5 border-b border-neutral-100 last:border-b-0" key={tx.id}>
                  <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center shrink-0 text-sm ${dotColor}`}>
                    {getTxIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-neutral-700 leading-normal">
                      <span className="font-semibold text-neutral-800">{tx.name}</span> {tx.desc} — <span className="font-semibold text-neutral-900">{tx.amount}</span>
                    </div>
                    <div className="text-[11.5px] text-neutral-400 mt-0.5 font-mono">{tx.time}</div>
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
