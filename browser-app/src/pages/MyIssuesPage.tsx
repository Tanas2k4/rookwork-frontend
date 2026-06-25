import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdSearch, MdOutlineSort, MdKeyboardArrowDown } from "react-icons/md";
import { issueApi } from "../api/services/issueApi";
import { userApi } from "../api/services/userApi";
import type { IssueResponse } from "../api/contracts/issue";
import {
  type Status,
  type Priority,
  statusMap,
  statuses,
  priorityColorMap,
  priorityLabelMap,
  priorities,
  typeIconMap,
  typeColorMap,
} from "../types/project";
import { apiStatusToUI, apiPriorityToUI } from "../utils/issueMapper";
import { avatarUrl } from "../utils/avatar";

// Helpers



function PriorityBars({ priority }: { priority: Priority }) {
  const idx = priorities.indexOf(priority);
  return (
    <div className="flex gap-0.5 h-1.5 w-10 items-end">
      {priorities.map((p, i) => (
        <div key={p} className={`flex-1 rounded-sm ${i <= idx ? priorityColorMap[p] : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

type SortKey = "updated" | "priority" | "deadline";
const sortOptions: { val: SortKey; label: string }[] = [
  { val: "updated",  label: "Last updated" },
  { val: "priority", label: "Priority" },
  { val: "deadline", label: "Deadline" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyIssuesPage() {
  const navigate = useNavigate();

  const [issues, setIssues]     = useState<IssueResponse[]>([]);
  const [myName, setMyName]     = useState("");
  const [myPicture, setMyPicture] = useState<string | null>(null);

  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState<Status | "all">("all");
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all");
  const [sortBy, setSortBy]               = useState<SortKey>("updated");
  const [showSortDd, setShowSortDd]       = useState(false);

  // Fetch assigned issues + current user info
  useEffect(() => {
    let cancelled = false;

    issueApi.getAssigned()
      .then((data) => { if (!cancelled) setIssues(data); })
      .catch(console.error);

    userApi.getMe()
      .then((u) => {
        if (!cancelled) {
          setMyName(u.profileName);
          setMyPicture(u.picture ?? null);
        }
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, []);

  const myAvatar = avatarUrl(myName || "Me", myPicture);

  // Filter + sort
  const filtered = issues
    .filter((issue) => {
      const matchSearch   = issue.issueName.toLowerCase().includes(search.toLowerCase());
      const uiStatus      = apiStatusToUI(issue.status);
      const uiPriority    = apiPriorityToUI(issue.priority);
      const matchStatus   = filterStatus   === "all" || uiStatus   === filterStatus;
      const matchPriority = filterPriority === "all" || uiPriority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (sortBy === "priority")
        return priorities.indexOf(apiPriorityToUI(b.priority)) -
               priorities.indexOf(apiPriorityToUI(a.priority));
      if (sortBy === "deadline")
        return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  // Group by status
  const grouped = statuses.reduce<Record<string, IssueResponse[]>>((acc, s) => {
    const group = filtered.filter((i) => apiStatusToUI(i.status) === s);
    if (group.length > 0) acc[s] = group;
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4 border-b border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">My Issues</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {issues.length} issues assigned to you
            </p>
          </div>
          <div className="flex items-center gap-2">
            <img src={myAvatar} className="w-7 h-7 rounded-full" alt="" />
            <span className="text-sm text-gray-600">{myName}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-45 border border-gray-500 rounded-lg px-3 py-1.5 bg-white">
            <MdSearch size={15} className="text-gray-500 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search issues..."
              className="flex-1 text-xs text-gray-700 outline-none bg-transparent" />
          </div>

          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
              className="text-xs border border-gray-500 rounded-lg px-3 py-1.5 text-gray-700 bg-white outline-none appearance-none pr-5 cursor-pointer hover:bg-gray-100 transition">
              <option value="all">All Status</option>
              {statuses.map((s) => <option key={s} value={s}>{statusMap[s].label}</option>)}
            </select>
            <MdKeyboardArrowDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative">
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Priority | "all")}
              className="text-xs border border-gray-500 rounded-lg px-3 py-1.5 text-gray-700 bg-white outline-none appearance-none pr-7 cursor-pointer hover:bg-gray-100 transition">
              <option value="all">All Priority</option>
              {priorities.map((p) => <option key={p} value={p}>{priorityLabelMap[p]}</option>)}
            </select>
            <MdKeyboardArrowDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>

          <div className="relative">
            <button onClick={() => setShowSortDd((p) => !p)}
              className="flex items-center gap-1.5 text-xs border border-gray-500 rounded-lg px-3 py-1.5 text-gray-700 bg-white hover:border-purple-400 transition">
              <MdOutlineSort size={14} />
              {sortOptions.find((o) => o.val === sortBy)?.label}
            </button>
            {showSortDd && (
              <>
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 w-40">
                  {sortOptions.map((opt) => (
                    <button key={opt.val} onClick={() => { setSortBy(opt.val); setShowSortDd(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${sortBy === opt.val ? "text-purple-700 font-medium" : "text-gray-700"}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="fixed inset-0 z-29" onClick={() => setShowSortDd(false)} />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Issue list */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <p className="text-sm">No issues match your filters</p>
          </div>
        ) : (
          Object.entries(grouped).map(([status, groupIssues]) => (
            <div key={status}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${statusMap[status as Status].dotColor}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {statusMap[status as Status].label}
                </span>
                <span className="text-xs text-gray-400">({groupIssues.length})</span>
              </div>

              <div className="space-y-1.5">
                {groupIssues.map((issue) => {
                  const type     = issue.issueType.toLowerCase() as keyof typeof typeIconMap;
                  const priority = apiPriorityToUI(issue.priority);
                  const TypeIcon = typeIconMap[type];
                  const deadline = issue.deadline ? issue.deadline.split("T")[0] : null;
                  const isOverdue = deadline &&
                    new Date(deadline) < new Date() &&
                    issue.status !== "DONE" &&
                    issue.status !== "TO_DO";

                  return (
                    <button key={issue.id}
                      onClick={() => navigate(`/issues/${issue.id}`, {
                        state: { from: { path: "/my-issues", label: "My Issues" } },
                      })}
                      className="w-full text-left flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:shadow-sm hover:border-purple-200 hover:bg-purple-50/30 transition group"
                    >
                      <TypeIcon size={13} className={`${typeColorMap[type]} shrink-0`} />
                      <span className="flex-1 text-sm text-gray-700 group-hover:text-purple-800 truncate font-medium transition">
                        {issue.issueName}
                      </span>

                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <PriorityBars priority={priority} />

                        {deadline && (
                          <span className={`text-[11px] ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                            {isOverdue && "⚠ "}{deadline}
                          </span>
                        )}

                        {issue.assignees && issue.assignees.length > 0 && (
                          <div className="flex -space-x-1.5 overflow-hidden shrink-0">
                            {issue.assignees.slice(0, 2).map((a, idx) => (
                              <img
                                key={idx}
                                src={avatarUrl(a.profileName, a.picture)}
                                className="w-5 h-5 rounded-full border border-white shrink-0 object-cover"
                                title={a.profileName}
                                alt=""
                              />
                            ))}
                            {issue.assignees.length > 2 && (
                              <span className="w-5 h-5 rounded-full bg-purple-100 border border-white flex items-center justify-center text-[9px] font-bold text-purple-700 shrink-0">
                                +{issue.assignees.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}