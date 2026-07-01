import { useState, useEffect } from "react";
import { adminApi } from "../../api/services/adminApi";
import type { RecentWorkspace } from "../../api/contracts/admin";
import { TbSearch, TbChevronLeft, TbChevronRight } from "react-icons/tb";

export function AdminWorkspaces() {
  const [workspaces, setWorkspaces] = useState<RecentWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    adminApi.getWorkspaces()
      .then(setWorkspaces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getInitials = (name: string) => {
    return name ? name.slice(0, 2).toUpperCase() : "WS";
  };

  const filteredWorkspaces = workspaces.filter(w => {
    return w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           w.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
           w.id.includes(searchQuery);
  });

  return (
    <div className="opacity-0 translate-y-2 animate-[fadeIn_0.3s_ease-out_forwards]">
      <div className="flex items-center justify-between mb-5.5 gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-neutral-900">Workspaces</h1>
          <p className="mt-0.5 text-[13px] text-neutral-500">Monitor projects, members count, and workspace subscriptions.</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2 w-72 text-neutral-400 focus-within:border-indigo-600 transition-colors">
          <TbSearch />
          <input 
            type="text" 
            placeholder="Search workspaces..." 
            className="bg-transparent border-none outline-none text-neutral-800 text-[13px] w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mb-5">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">Total Workspaces</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{workspaces.length}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">New this week</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{workspaces.length > 2 ? 1 : 0}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-semibold">Pro / Team Tier</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{workspaces.filter(w => w.plan !== "Free").length}</div>
        </div>
        <div className="bg-white border border-neutral-200 rounded-2xl p-4.5">
          <div className="text-[13px] text-neutral-500 font-medium">Free Tier</div>
          <div className="text-3xl font-bold mt-1.5 tracking-tight text-neutral-900">{workspaces.filter(w => w.plan === "Free").length}</div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-semibold text-[14.5px] text-neutral-800">Workspace Directory</div>
            <div className="text-xs text-neutral-400 mt-0.5">{filteredWorkspaces.length} active spaces mapped</div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <p className="text-sm text-neutral-400">Loading workspaces records...</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Workspace</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Owner</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Members</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Subscription Plan</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Registered At</th>
                  <th className="text-left text-[11.5px] uppercase tracking-wider text-neutral-400 font-semibold pb-2.5 px-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkspaces.map((w) => {
                  const colors = ["bg-violet-50 text-violet-700", "bg-sky-50 text-sky-700", "bg-emerald-50 text-emerald-700", "bg-amber-50 text-amber-700"];
                  const avatarColor = colors[Math.abs(getHashCode(w.name)) % colors.length] || "bg-violet-50 text-violet-700";
                  
                  const planColors: Record<string, string> = {
                    Team: "bg-blue-50 text-blue-700 font-semibold",
                    Pro: "bg-indigo-50 text-indigo-700 font-semibold",
                    Free: "bg-neutral-100 text-neutral-600 font-semibold",
                  };

                  return (
                    <tr key={w.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/50">
                      <td className="py-3 px-2.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7.5 h-7.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor}`}>
                            {getInitials(w.name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[13.5px] text-neutral-800">{w.name}</div>
                            <div className="text-[11.5px] text-neutral-400 truncate">{w.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2.5 align-middle font-medium text-neutral-700">{w.owner}</td>
                      <td className="py-3 px-2.5 align-middle font-mono text-neutral-500 text-xs">{w.memberCount} members</td>
                      <td className="py-3 px-2.5 align-middle">
                        <span className={`text-[11.5px] px-2 py-0.5 rounded ${planColors[w.plan] || "bg-neutral-100 text-neutral-600"}`}>
                          {w.plan}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 align-middle text-neutral-500 text-xs">
                        {new Date(w.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-2.5 align-middle">
                        <span className="inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-currentColor" />
                          Active
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredWorkspaces.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-neutral-450 py-6 text-sm">
                      No workspaces matched search query
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-3.5 text-[12.5px] text-neutral-450">
              <span>Showing {filteredWorkspaces.length} of {workspaces.length} workspaces</span>
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

function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}
