import { useState, useEffect } from "react";
import { FiUser, FiSettings, FiBell, FiShield } from "react-icons/fi";
import { userApi } from "../api/services/userApi";
import type { UserSummary } from "../api/contracts/issue";
import ProfileSettings from "../components/settings/ProfileSettings";
import PreferencesSettings from "../components/settings/PreferencesSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import SecuritySettings from "../components/settings/SecuritySettings";

const TABS = [
  { id: "profile", label: "Profile", icon: FiUser },
  { id: "preferences", label: "Preferences", icon: FiSettings },
  { id: "notifications", label: "Notifications", icon: FiBell },
  { id: "security", label: "Account & Security", icon: FiShield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userApi.getMe()
      .then(setUser)
      .catch(() => {
        localStorage.clear();
        window.location.href = "/login";
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row h-full">
        <aside className="w-full md:w-64 bg-white border-r border-gray-200 shrink-0 animate-pulse">
          <div className="p-6 h-16 bg-gray-100 mb-4 rounded mx-4"></div>
          <div className="px-4 space-y-2">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </aside>
        <div className="flex-1 p-6 md:p-8 bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Settings Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-800">Settings</h1>
        </div>
        <nav className="px-4 pb-6 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  
                  setActiveTab(tab.id);
                }}
                className={`w-full flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors ${isActive
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-purple-700" : "text-gray-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {activeTab === "profile" && <ProfileSettings user={user} />}
          {activeTab === "preferences" && <PreferencesSettings user={user} />}
          {activeTab === "notifications" && <NotificationSettings user={user} />}
          {activeTab === "security" && <SecuritySettings />}
        </div>
      </div>
    </div>
  );
}
