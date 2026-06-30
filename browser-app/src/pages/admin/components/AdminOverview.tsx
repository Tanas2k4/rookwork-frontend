import { useState, useEffect } from "react";
import { adminApi, type AdminStats, type ActivityPoint } from "../../../api/services/adminApi";
import { FiUsers, FiBriefcase, FiCheckSquare, FiTarget, FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";
import Chart from "react-apexcharts";
import Loading from "../../../components/common/Loading";
import { useToast } from "../../../hooks/useToast";

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activityData, setActivityData] = useState<ActivityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getActivityChart()])
      .then(([statsRes, activityRes]) => {
        setStats(statsRes);
        setActivityData(activityRes);
      })
      .catch((err) => {
        addToast(err.message || "Failed to load admin stats", "error");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (!stats) return null;

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
          <Icon size={24} />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full ${trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            {trend === "up" ? <FiArrowUpRight size={16} /> : <FiArrowDownRight size={16} />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        <p className="text-gray-500 font-medium mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Users" 
          value={stats.activeUsers} 
          icon={FiUsers} 
          trend="up" 
          trendValue={`+${stats.newUsersLast7Days} this week`} 
        />
        <StatCard 
          title="Total Workspaces" 
          value={stats.totalProjects} 
          icon={FiBriefcase} 
        />
        <StatCard 
          title="Open Tasks" 
          value={stats.openIssues} 
          icon={FiCheckSquare} 
        />
        <StatCard 
          title="Avg Completion" 
          value={`${stats.completionRate}%`} 
          icon={FiTarget} 
          trend={stats.completionRate > 50 ? "up" : "down"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Activity Overview (Last 7 Days)</h3>
          <div className="h-[300px]">
            <Chart
              options={{
                chart: { type: 'area', toolbar: { show: false }, fontFamily: 'inherit' },
                colors: ['#7c3aed'],
                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 2 },
                xaxis: { categories: activityData.map(d => d.date), tooltip: { enabled: false } },
                yaxis: { title: { text: 'Issues Created' } },
                grid: { borderColor: '#f3f4f6', strokeDashArray: 4 },
              }}
              series={[{ name: "Issues Created", data: activityData.map(d => d.issuesCreated) }]}
              type="area"
              height="100%"
            />
          </div>
        </div>

        {/* Issues by Status */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Tasks by Status</h3>
          <div className="h-[300px] flex justify-center items-center">
            <Chart
              options={{
                chart: { type: 'donut', fontFamily: 'inherit' },
                labels: Object.keys(stats.issuesByStatus),
                colors: ['#3b82f6', '#10b981', '#f59e0b', '#6b7280'], // Customize colors based on your status values
                plotOptions: { pie: { donut: { size: '70%' } } },
                dataLabels: { enabled: false },
                legend: { position: 'bottom' }
              }}
              series={Object.values(stats.issuesByStatus) as number[]}
              type="donut"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
