import { Routes, Route, Navigate, NavLink, Link } from "react-router-dom";
import { FiPieChart, FiUsers, FiBriefcase, FiActivity, FiCreditCard, FiSettings, FiArrowLeft } from "react-icons/fi";
import AdminOverview from "./components/AdminOverview";
import AdminUsers from "./components/AdminUsers";
import AdminProjects from "./components/AdminProjects";
import AdminAnalytics from "./components/AdminAnalytics";
import AdminBilling from "./components/AdminBilling";
import AdminSettings from "./components/AdminSettings";

const ADMIN_TABS = [
  { id: "overview", label: "Overview", icon: FiPieChart, path: "overview" },
  { id: "users", label: "Users", icon: FiUsers, path: "users" },
  { id: "projects", label: "Projects & Teams", icon: FiBriefcase, path: "projects" },
  { id: "analytics", label: "Analytics", icon: FiActivity, path: "analytics" },
  { id: "billing", label: "Billing", icon: FiCreditCard, path: "billing" },
  { id: "settings", label: "Settings", icon: FiSettings, path: "settings" },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-gray-800">Admin Dashboard</h1>
        <Link 
          to="/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-purple-600 transition-colors bg-gray-50 hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-purple-200"
        >
          <FiArrowLeft size={16} />
          Back to Workspace
        </Link>
      </div>

      {/* Tabs Navigation */}
      <div className="px-6 border-b border-gray-200 bg-white shrink-0 overflow-x-auto">
        <nav className="flex space-x-6 min-w-max">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={`/admin/${tab.path}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 py-3 px-1 border-b-2 transition-colors ${
                    isActive
                      ? "border-purple-600 text-purple-700 font-medium"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`
                }
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto h-full">
          <Routes>
            <Route path="/" element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
