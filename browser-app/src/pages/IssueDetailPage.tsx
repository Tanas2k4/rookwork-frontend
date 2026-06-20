import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { MdOutlineExpandMore } from "react-icons/md";
import { IoIosArrowBack } from "react-icons/io";
import { issueApi } from "../api/services/issueApi";
import type { IssueResponse, UpdateIssueRequest } from "../api/contracts/issue";
import { SubtasksSection } from "../project/board/TaskPanel/SubtasksSection";
import { ActivitySection } from "../project/board/TaskPanel/ActivitySection";
import { apiStatusToUI, apiPriorityToUI } from "../utils/issueMapper";
import { avatarUrl } from "../utils/avatar";
import {
  type Priority,
  statusMap,
  statuses,
  priorityColorMap,
  priorityLabelMap,
  priorities,
  typeIconMap,
  typeColorMap,
} from "../types/project";

// ─── Helpers ──────────────────────────────────────────────────────────────────



function PriorityBars({ priority }: { priority: Priority }) {
  const idx = priorities.indexOf(priority);
  return (
    <div className="flex gap-0.5 h-1.5 w-14">
      {priorities.map((p, i) => (
        <div key={p} className={`flex-1 rounded-sm ${i <= idx ? priorityColorMap[p] : "bg-gray-200"}`} />
      ))}
    </div>
  );
}

function InlineDropdown({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1 text-sm text-gray-700 hover:text-purple-700 transition">
        {trigger}
      </button>
      {open && (
        <>
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 min-w-40 max-w-50">
            {children}
          </div>
          <div className="fixed inset-0 z-29" onClick={() => setOpen(false)} />
        </>
      )}
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate    = useNavigate();
  const location    = useLocation();

  const [issue, setIssue]             = useState<IssueResponse | null>(null);
  const [notFound, setNotFound]       = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState("");

  useEffect(() => {
    if (!issueId) return;
    let cancelled = false;
    issueApi.getById(issueId)
      .then((data) => { if (!cancelled) setIssue(data); })
      .catch(() => { if (!cancelled) setNotFound(true); });
    return () => { cancelled = true; };
  }, [issueId]);

  async function patchIssue(updates: UpdateIssueRequest) {
    if (!issue) return;
    setIssue((prev) => prev ? { ...prev, ...updates } : prev);
    try {
      const updated = await issueApi.update(issue.projectId, issue.id, updates);
      setIssue(updated);
    } catch (err) {
      console.error("Failed to update issue", err);
      issueApi.getById(issue.id).then(setIssue).catch(console.error);
    }
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-sm">Issue not found.</p>
        <button onClick={() => navigate(-1)} className="mt-2 text-xs text-purple-700 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  if (!issue) return null;

  type LocationState = { from?: { label?: string; path?: string } };
  const routeState = location.state as LocationState | null;
  const backLabel  = routeState?.from?.label ?? "My Issues";
  const backPath   = routeState?.from?.path  ?? "/my-issues";

  const type     = issue.issueType.toLowerCase() as keyof typeof typeIconMap;
  const status   = apiStatusToUI(issue.status);
  const priority = apiPriorityToUI(issue.priority);
  const TypeIcon = typeIconMap[type];
  const deadline = issue.deadline ? issue.deadline.split("T")[0] : null;
  const isOverdue = deadline && new Date(deadline) < new Date() && issue.status !== "DONE";

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Breadcrumb */}
      <div onClick={() => navigate(backPath)}
        className="flex items-center gap-2 px-8 pt-5 text-gray-700 hover:text-purple-700 transition cursor-pointer w-fit">
        <IoIosArrowBack />
        <button className="text-sm">{backLabel}</button>
      </div>

      {/* Title area */}
      <div className="shrink-0 px-8 pt-2 pb-5 border-b border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <TypeIcon size={13} className={typeColorMap[type]} />
          <h1 className="text-xl font-semibold text-gray-700 leading-snug flex-1 pt-1 min-w-0">
            {issue.issueName}
          </h1>

          <div className="flex flex-row items-center gap-4 pt-0.5 flex-wrap justify-end">
            {/* Status */}
            <span className="text-xs text-gray-400">
              Status{" "}
              <InlineDropdown trigger={
                <span className="flex items-center gap-1.5 border border-gray-500 rounded-md px-2 py-1">
                  <span className={`w-2 h-2 rounded-full ${statusMap[status].dotColor}`} />
                  {statusMap[status].label}
                  <MdOutlineExpandMore className="text-gray-500" />
                </span>
              }>
                {statuses.map((s) => (
                  <button key={s}
                    onClick={() => patchIssue({ status: s === "to_do" ? "TO_DO" : s === "in_progress" ? "IN_PROGRESS" : "DONE" })}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${status === s ? "text-purple-700 font-medium" : "text-gray-700"}`}>
                    <span className={`w-2 h-2 rounded-full ${statusMap[s].dotColor}`} />
                    {statusMap[s].label}
                  </button>
                ))}
              </InlineDropdown>
            </span>

            {/* Priority */}
            <span className="text-xs text-gray-400">
              Priority{" "}
              <InlineDropdown trigger={
                <span className="flex items-center gap-1.5 border border-gray-500 rounded-md px-2 py-1">
                  <PriorityBars priority={priority} />
                  {priorityLabelMap[priority]}
                  <MdOutlineExpandMore className="text-gray-500" />
                </span>
              }>
                {priorities.map((p) => (
                  <button key={p}
                    onClick={() => patchIssue({ priority: p.toUpperCase() as UpdateIssueRequest["priority"] })}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2 ${priority === p ? "text-purple-700 font-medium" : "text-gray-700"}`}>
                    <span className={`w-2 h-2 rounded-full ${priorityColorMap[p]}`} />
                    {priorityLabelMap[p]}
                  </button>
                ))}
              </InlineDropdown>
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</p>
            {editingDesc ? (
              <textarea autoFocus value={editDescValue}
                onChange={(e) => setEditDescValue(e.target.value)}
                rows={4}
                onBlur={() => { patchIssue({ description: editDescValue }); setEditingDesc(false); }}
                onKeyDown={(e) => { if (e.key === "Escape") setEditingDesc(false); }}
                className="w-full text-sm text-gray-600 outline-none rounded-lg p-2.5 resize-none border border-purple-300 focus:ring-1 focus:ring-purple-600 transition" />
            ) : (
              <p onDoubleClick={() => { setEditingDesc(true); setEditDescValue(issue.description ?? ""); }}
                className="text-sm text-gray-600 cursor-default rounded px-1 -mx-1 py-1 hover:bg-gray-50 transition min-h-6 leading-relaxed"
                title="Double-click to edit">
                {issue.description || <span className="italic text-gray-300">No description — double-click to add</span>}
              </p>
            )}
          </div>

          {/* Subtasks */}
          <SubtasksSection subtasks={[]} onToggle={() => {}} onAdd={() => {}} onDelete={() => {}} />

          {/* Activity — pass projectId trực tiếp từ issue vì không có ProjectProvider ở route này */}
          <ActivitySection
            issueUuid={issue.id}
            projectId={issue.projectId}
          />
        </div>

        {/* Right — Details */}
        <div className="w-96 shrink-0 border-l border-gray-100 overflow-y-auto">
          <div className="px-5 py-6">
            <DetailRow label="Issue type">
              <span className={`inline-flex items-center gap-1.5 ${typeColorMap[type]}`}>
                <TypeIcon size={12} />
                <span className="text-gray-700 capitalize">{type}</span>
              </span>
            </DetailRow>

            <DetailRow label="Status">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${statusMap[status].dotColor}`} />
                <span className="text-gray-700">{statusMap[status].label}</span>
              </span>
            </DetailRow>

            <DetailRow label="Priority">
              <span className="flex items-center gap-2">
                <PriorityBars priority={priority} />
                <span className="text-gray-700">{priorityLabelMap[priority]}</span>
              </span>
            </DetailRow>

            <DetailRow label="Assigned to">
              {issue.assignedTo ? (
                <span className="flex items-center gap-1.5">
                  <img src={avatarUrl(issue.assignedTo.profileName, issue.assignedTo.picture)}
                    className="w-4 h-4 rounded-full shrink-0" alt="" />
                  <span className="text-gray-700">{issue.assignedTo.profileName}</span>
                </span>
              ) : (
                <span className="text-gray-400 italic">Unassigned</span>
              )}
            </DetailRow>

            <DetailRow label="Deadline">
              {deadline ? (
                <span className={isOverdue ? "text-red-500 font-medium" : "text-gray-700"}>
                  {deadline}
                </span>
              ) : (
                <span className="text-gray-400">—</span>
              )}
            </DetailRow>

            <DetailRow label="Created at">
              <span className="text-gray-700">
                {new Date(issue.createdAt).toLocaleDateString("vi-VN")}
              </span>
            </DetailRow>

            <DetailRow label="Updated at">
              <span className="text-gray-700">
                {new Date(issue.updatedAt).toLocaleDateString("vi-VN")}
              </span>
            </DetailRow>
          </div>
        </div>
      </div>
    </div>
  );
}