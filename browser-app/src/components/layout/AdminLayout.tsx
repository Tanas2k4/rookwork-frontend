import { useState, useEffect } from "react";
import { AdminOverview } from "../../pages/admin/AdminOverview";
import { AdminUsers } from "../../pages/admin/AdminUsers";
import { AdminWorkspaces } from "../../pages/admin/AdminWorkspaces";
import { AdminBilling } from "../../pages/admin/AdminBilling";
import { AdminHealth } from "../../pages/admin/AdminHealth";
import { AdminSettings } from "../../pages/admin/AdminSettings";
import { TbLayoutDashboard, TbUsers, TbStack2, TbCreditCard, TbActivity, TbSettings, TbLogout } from "react-icons/tb";
import { avatarUrl as helperAvatarUrl } from "../../utils/avatar";
import { adminApi } from "../../api/services/adminApi";

interface AdminLayoutProps {
  profileName: string;
  avatarUrl: string | undefined;
  systemRole: string;
  onLogout: () => void;
}

export function AdminLayout({ profileName, avatarUrl, systemRole, onLogout }: AdminLayoutProps) {
  const [activeView, setActiveView] = useState<"overview" | "users" | "workspaces" | "billing" | "health" | "settings">("overview");
  const [stats, setStats] = useState<{ totalUsers: number; activeWorkspaces: number } | null>(null);

  useEffect(() => {
    adminApi.getStats("week")
      .then((res) => {
        setStats({
          totalUsers: res.totalUsers,
          activeWorkspaces: res.activeWorkspaces,
        });
      })
      .catch(console.error);
  }, []);

  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : "AD";
  };

  const renderActiveView = () => {
    switch (activeView) {
      case "overview":
        return <AdminOverview />;
      case "users":
        return <AdminUsers />;
      case "workspaces":
        return <AdminWorkspaces />;
      case "billing":
        return <AdminBilling />;
      case "health":
        return <AdminHealth />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  const menuItems: { view: "overview" | "users" | "workspaces" | "billing" | "health"; label: string; icon: React.ReactNode; count?: string }[] = [
    { view: "overview", label: "Overview", icon: <TbLayoutDashboard /> },
    { view: "users", label: "Users", icon: <TbUsers />, count: stats ? stats.totalUsers.toLocaleString() : "..." },
    { view: "workspaces", label: "Workspaces", icon: <TbStack2 />, count: stats ? stats.activeWorkspaces.toLocaleString() : "..." },
    { view: "billing", label: "Billing & Plans", icon: <TbCreditCard /> },
    { view: "health", label: "System Health", icon: <TbActivity />, count: "OK" },
  ];

  return (
    <div className="grid grid-cols-[236px_1fr] min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      <aside className="bg-white border-r border-neutral-200 p-[22px_16px] flex flex-col gap-[22px] h-screen sticky top-0 select-none">
        <div className="flex items-center gap-2.5 px-1.5">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm">P</div>
          <div className="font-bold text-[15px] tracking-tight">Pulse Admin</div>
          <span className="text-[10px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-[6px] ml-auto font-semibold uppercase">{systemRole}</span>
        </div>
        
        <nav className="flex flex-col gap-0.5">
          <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mx-2 mt-3.5 mb-1.5">Management</div>
          {menuItems.map((item) => (
            <div
              key={item.view}
              className={`flex items-center gap-2.5 p-[9px_10px] rounded-lg text-[13.5px] font-medium transition-colors cursor-pointer ${
                activeView === item.view 
                  ? "bg-indigo-50 text-indigo-700 font-semibold" 
                  : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
              }`}
              onClick={() => setActiveView(item.view)}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
              {item.count && (
                <span className={`ml-auto text-[10.5px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeView === item.view ? "bg-white text-indigo-700" : "bg-neutral-100 text-neutral-500"
                }`}>
                  {item.count}
                </span>
              )}
            </div>
          ))}
          
          <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold mx-2 mt-3.5 mb-1.5">Configuration</div>
          <div
            className={`flex items-center gap-2.5 p-[9px_10px] rounded-lg text-[13.5px] font-medium transition-colors cursor-pointer ${
              activeView === "settings"
                ? "bg-indigo-50 text-indigo-700 font-semibold"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
            onClick={() => setActiveView("settings")}
          >
            <span className="text-lg"><TbSettings /></span>
            System Settings
          </div>
          
          <div
            className="flex items-center gap-2.5 p-[9px_10px] rounded-lg text-[13.5px] font-medium transition-colors cursor-pointer mt-4 text-rose-600 hover:bg-rose-50"
            onClick={onLogout}
          >
            <span className="text-lg"><TbLogout /></span>
            Sign Out
          </div>
        </nav>
        
        <div className="mt-auto flex items-center gap-2.5 p-2.5 rounded-lg border border-neutral-100">
          {avatarUrl ? (
            <img 
              src={helperAvatarUrl(profileName, avatarUrl)} 
              alt={profileName} 
              className="w-[30px] h-[30px] rounded-full object-cover shrink-0" 
            />
          ) : (
            <div className="w-[30px] h-[30px] rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">{getInitials(profileName)}</div>
          )}
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold truncate text-neutral-800" title={profileName}>{profileName}</div>
            <div className="text-[11px] text-neutral-400 truncate capitalize">{systemRole.toLowerCase()}</div>
          </div>
        </div>
      </aside>

      <main className="p-6 md:p-8 overflow-y-auto h-screen bg-neutral-50">
        {renderActiveView()}
      </main>
    </div>
  );
}
