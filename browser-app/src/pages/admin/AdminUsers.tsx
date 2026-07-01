import { useState, useEffect } from "react";
import { adminApi } from "../../api/services/adminApi";
import type { AdminUserResponse } from "../../api/contracts/admin";
import { useToast } from "../../hooks/useToast";
import { TbSearch, TbLock, TbLockOpen, TbChevronLeft, TbChevronRight } from "react-icons/tb";
import { avatarUrl as helperAvatarUrl } from "../../utils/avatar";

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "unverified" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { addToast } = useToast();

  useEffect(() => {
    let active = true;
    adminApi.getUsers()
      .then(res => {
        if (active) setUsers(res);
      })
      .catch(console.error)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  const handleToggleLock = async (user: AdminUserResponse) => {
    try {
      if (user.isActive) {
        await adminApi.lockUser(user.id);
        addToast(`Locked user account ${user.profileName} successfully`, "success");
      } else {
        await adminApi.unlockUser(user.id);
        addToast(`Unlocked user account ${user.profileName} successfully`, "success");
      }
      setLoading(true);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error(err);
      addToast("Failed to change user account status", "error");
    }
  };

  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : "US";
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.profileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.id.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filter === "active") return u.isActive && u.isVerified;
    if (filter === "unverified") return u.isActive && !u.isVerified;
    if (filter === "locked") return !u.isActive;
    return true;
  });

  return (
    <div className="opacity-0 translate-y-2 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div className="flex items-center justify-between mb-5.5 gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-neutral-900">User Accounts</h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">Manage, restrict, and verify all registered system profiles.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 w-72 text-neutral-400 focus-within:border-indigo-600 transition-colors">
          <TbSearch />
          <input 
            type="text" 
            placeholder="Search by name, email, ID..." 
            className="bg-transparent border-none outline-none text-neutral-800 text-[13px] w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">Total Accounts</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{users.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">Active Accounts</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{users.filter(u => u.isActive && u.isVerified).length}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-semibold">Unverified Accounts</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{users.filter(u => u.isActive && !u.isVerified).length}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">Locked Profiles</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{users.filter(u => !u.isActive).length}</div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4.5">
          <div>
            <div className="font-semibold text-[14.5px] text-neutral-800">System Users</div>
            <div className="text-xs text-neutral-400 mt-0.5">{filteredUsers.length} profiles listed</div>
          </div>
          <div className="flex gap-1.5">
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${filter === "all" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`} onClick={() => setFilter("all")}>All</div>
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${filter === "active" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`} onClick={() => setFilter("active")}>Active</div>
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${filter === "unverified" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`} onClick={() => setFilter("unverified")}>Unverified</div>
            <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${filter === "locked" ? "bg-neutral-900 text-white border-neutral-900" : "border-neutral-200 text-neutral-500 hover:bg-neutral-50"}`} onClick={() => setFilter("locked")}>Locked</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-neutral-400">Loading user profiles data...</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">User</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Plan</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Primary Workspace</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Role</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Status</th>
                  <th className="text-right text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const planColors: Record<string, string> = {
                    Team: "bg-blue-50 text-blue-700 font-semibold",
                    Pro: "bg-indigo-50 text-indigo-700 font-semibold",
                    Free: "bg-neutral-100 text-neutral-600 font-semibold",
                  };
                  return (
                    <tr key={u.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/50">
                      <td className="py-3 px-2.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          {u.picture ? (
                            <img 
                              src={helperAvatarUrl(u.profileName, u.picture)} 
                              alt={u.profileName} 
                              className="w-7.5 h-7.5 rounded-full object-cover shrink-0" 
                            />
                          ) : (
                            <div className="w-7.5 h-7.5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">{getInitials(u.profileName)}</div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-[13.5px] text-neutral-800">{u.profileName}</div>
                            <div className="text-[11.5px] text-neutral-400 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2.5 align-middle">
                        <span className={`text-[11.5px] px-2 py-0.5 rounded ${planColors[u.plan] || "bg-neutral-100 text-neutral-600"}`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 align-middle text-neutral-600 text-[13.5px]">{u.workspace}</td>
                      <td className="py-3 px-2.5 align-middle font-semibold text-neutral-700 text-[13.5px] uppercase">{u.systemRole}</td>
                      <td className="py-3 px-2.5 align-middle">
                        <span className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-0.5 rounded-full ${
                          !u.isActive 
                            ? "bg-rose-50 text-rose-700" 
                            : (u.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-currentColor" />
                          {!u.isActive ? "Locked" : (u.isVerified ? "Active" : "Unverified")}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            className="flex items-center gap-1 border border-neutral-200 bg-white hover:bg-neutral-50 rounded px-2 py-1 text-[11.5px] font-medium transition-colors cursor-pointer"
                            onClick={() => handleToggleLock(u)}
                            title={u.isActive ? "Lock Profile" : "Unlock Profile"}
                          >
                            {u.isActive ? <TbLock className="text-rose-600" /> : <TbLockOpen className="text-emerald-600" />}
                            {u.isActive ? "Lock" : "Unlock"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-neutral-450 py-6 text-sm">
                      No accounts matched search parameters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="flex items-center justify-between mt-3.5 text-[12.5px] text-neutral-450">
              <span>Showing {filteredUsers.length} of {users.length} accounts</span>
              <div className="flex gap-1.5">
                <button disabled className="w-7 h-7 rounded border border-neutral-200 bg-white text-neutral-400 cursor-not-allowed flex items-center justify-center text-xs"><TbChevronLeft /></button>
                <button className="w-7 h-7 rounded bg-neutral-900 text-white border border-neutral-900 flex items-center justify-center text-xs">1</button>
                <button disabled className="w-7 h-7 rounded border border-neutral-200 bg-white text-neutral-400 cursor-not-allowed flex items-center justify-center text-xs"><TbChevronRight /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
