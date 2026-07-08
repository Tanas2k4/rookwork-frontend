import { useState, useEffect } from "react";
import { adminApi } from "../../api/services/adminApi";
import { useToast } from "../../hooks/useToast";

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    adminApi.getSettings()
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (key: string) => {
    const newValue = !settings[key];
    const updatedSettings = { ...settings, [key]: newValue };
    
    setSettings(updatedSettings);

    try {
      await adminApi.updateSettings({ [key]: newValue });
      addToast("Successfully updated global system settings", "success");
    } catch (err) {
      console.error(err);
      addToast("Failed to save configuration settings", "error");
      setSettings(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-sm text-neutral-400">Loading system settings...</p>
      </div>
    );
  }

  const renderSwitch = (key: string) => {
    const isChecked = !!settings[key];
    return (
      <div 
        className={`w-9.5 h-5.5 rounded-full border relative cursor-pointer shrink-0 transition-colors duration-200 ${
          isChecked 
            ? "bg-indigo-600 border-indigo-600" 
            : "bg-neutral-100 border-neutral-200"
        }`}
        onClick={() => handleToggle(key)}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow ${
          isChecked ? "left-4.5" : "left-0.5"
        }`} />
      </div>
    );
  };

  return (
    <div className="opacity-0 translate-y-2 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div className="flex items-center justify-between mb-5.5 gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-neutral-900">System Configuration</h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">Manage security settings, global feature flags, and access control policies.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">Feature Flags</div>
              <div className="text-xs text-neutral-400 mt-0.5">Toggle dynamic application features across all workspaces</div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-b-0">
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-800">Allow Workspace Creation</div>
                <div className="text-xs text-neutral-500 mt-0.5">Permit users to register new organizational spaces without approval</div>
              </div>
              {renderSwitch("allowNewWorkspaces")}
            </div>

            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-b-0">
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-800">14-Day Free Trial Mode</div>
                <div className="text-xs text-neutral-500 mt-0.5">Automatically enroll newly registered workspaces in the Free Trial plan</div>
              </div>
              {renderSwitch("trialMode14Days")}
            </div>

            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-b-0">
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-800">AI Task Suggestions (Beta)</div>
                <div className="text-xs text-neutral-500 mt-0.5">Activate AI Copilot auto-subtask recommendations in Pro+ tiers</div>
              </div>
              {renderSwitch("aiTaskSuggestions")}
            </div>

            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-b-0">
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-800">System Maintenance Mode</div>
                <div className="text-xs text-neutral-500 mt-0.5">Temporarily restrict client access to perform planned database upgrades</div>
              </div>
              {renderSwitch("maintenanceMode")}
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-bold text-[14.5px] text-neutral-850">Security &amp; Compliance</div>
              <div className="text-xs text-neutral-400 mt-0.5">Configure authentication requirements and monitoring logs</div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-b-0">
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-800">Enforce Multi-Factor Auth (MFA)</div>
                <div className="text-xs text-neutral-500 mt-0.5">Require all administrative accounts to authenticate with secondary MFA codes</div>
              </div>
              {renderSwitch("requireMfa")}
            </div>

            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-b-0">
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-800">Restrict Admin IP Addresses</div>
                <div className="text-xs text-neutral-500 mt-0.5">Only allow connections to the admin console from trusted corporate IPs</div>
              </div>
              {renderSwitch("restrictIpAccess")}
            </div>

            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-b-0">
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-800">Auto-Lock Suspicious Profiles</div>
                <div className="text-xs text-neutral-500 mt-0.5">Temporarily lock accounts that exceed 5 failed login attempts in 1 hour</div>
              </div>
              {renderSwitch("autoLockSuspicious")}
            </div>

            <div className="flex items-center justify-between py-3.5 border-b border-neutral-100 last:border-b-0">
              <div>
                <div className="text-[13.5px] font-semibold text-neutral-800">Log Administrative Actions</div>
                <div className="text-xs text-neutral-500 mt-0.5">Audit and record all write actions executed from this console for 12 months</div>
              </div>
              {renderSwitch("logAdminActions")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
