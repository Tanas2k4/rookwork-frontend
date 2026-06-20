/**
 * @file index.tsx (TaskPanel)
 * @description Component chính quản lý panel hiển thị chi tiết thông tin công việc (Task Details Panel).
 * Tích hợp nhật ký chấm công (Work Log), danh sách công việc con (Subtasks), bình luận/lịch sử (Activity), và liên kết giữa các task.
 * @author Warmdrobe
 */

import { useState, useEffect } from "react";
import type { Task, Status, Priority, User } from "../../../types/project";
import { childTypeMap } from "../../../types/project";
import { TaskPanelHeader } from "./TaskPanelHeader";
import { TaskPanelDetails } from "./TaskPanelDetails";
import { ChildrenSection } from "./ChildrenSection";
import { SubtasksSection } from "./SubtasksSection";
import { ActivitySection } from "./ActivitySection";
import { workLogApi } from "../../../api/services/workLogApi";
import type { WorkLogResponse } from "../../../api/contracts/worklog";
import { RiTimeLine } from "react-icons/ri";
import { avatarUrl } from "../../../utils/avatar";

interface Props {
  task: Task | null;
  open: boolean;
  allTasks: Task[];
  onClose: () => void;
  onOpenTask: (task: Task) => void;
  onSaveTitle: (title: string) => void;
  onSaveDescription: (desc: string) => void;
  onChangeStatus: (s: Status) => void;
  onChangePriority: (p: Priority) => void;
  onChangeAssignee: (u: User | null) => void;
  onSaveDeadline: (val: string) => void;
  onDeleteTask: (task: Task) => void;
  onLink: (parentId: number, childId: number) => void;
  onUnlink: (parentId: number, childId: number) => void;
  onToggleSubtask: (id: number) => void;
  onAddSubtask: (title: string) => void;
  onDeleteSubtask: (id: number) => void;
}

function formatLoggedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}



function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

//  Log Work Section 

/**
 * Component LogWorkSection cho phép người dùng chấm công thời gian làm việc (log work) cho một task,
 * hiển thị tổng thời gian đã làm và lịch sử chấm công của các thành viên.
 */
function LogWorkSection({ taskUuid }: { taskUuid: string }) {
  const nowStr = toDatetimeLocal(new Date());
  const [startAt, setStartAt] = useState(nowStr);
  const [endAt, setEndAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<WorkLogResponse[]>([]);

  // Reset startAt về now mỗi khi expand
  useEffect(() => {
    if (expanded) setStartAt(toDatetimeLocal(new Date()));
  }, [expanded]);

  // Load existing logs khi expand
  useEffect(() => {
    if (!expanded || !taskUuid) return;
    workLogApi.getByIssue(taskUuid)
      .then((data) => setLogs(data ?? []))
      .catch(console.error);
  }, [expanded, taskUuid]);

  // Tính số giờ từ start → end
  const computedHours = (() => {
    if (!endAt) return null;
    const start = new Date(startAt || nowStr);
    const end = new Date(endAt);
    const diff = (end.getTime() - start.getTime()) / 3600000;
    return diff > 0 ? parseFloat(diff.toFixed(2)) : null;
  })();

  const totalHours = logs.reduce((sum, l) => sum + Number(l.hours), 0);

  async function handleSubmit() {
    if (!endAt) {
      setError("Please select an end time");
      return;
    }
    if (!computedHours || computedHours <= 0) {
      setError("End time must be after start time");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // datetime-local "2024-05-24T12:00" → "2024-05-24T12:00:00"
      const created = await workLogApi.logWork({
        issueId: taskUuid,
        startAt: `${startAt}:00`,
        endAt: `${endAt}:00`,
        note: note.trim() || undefined,
      });
      // logWork trả về array (có thể split nhiều ngày)
      setLogs((prev) => [...created, ...prev]);
      setStartAt(toDatetimeLocal(new Date()));
      setEndAt("");
      setNote("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
      setError("Failed to log work");
    } finally {
      setLoading(false);
    }
  }

  if (!taskUuid || taskUuid.startsWith("-")) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded((p) => !p)}
        className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 hover:text-purple-600 transition"
      >
        <RiTimeLine size={14} />
        Log Work
        {totalHours > 0 && (
          <span className="ml-1 text-purple-600 font-bold">{totalHours.toFixed(1)}h total</span>
        )}
        <span className={`ml-1 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>▾</span>
      </button>

      {expanded && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            {/* Start */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Start <span className="text-gray-300">defaults to now</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => { setStartAt(e.target.value); setError(""); }}
                className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-2 outline-none transition bg-white focus:border-purple-500"
              />
            </div>

            {/* End */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                End <span className="text-red-400">*</span>
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => { setEndAt(e.target.value); setError(""); }}
                className={`w-full text-sm border-2 rounded-lg px-3 py-2 outline-none transition bg-white ${
                  error ? "border-red-400" : "border-gray-200 focus:border-purple-500"
                }`}
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            {/* Computed hours preview */}
            {computedHours !== null && computedHours > 0 && (
              <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                <RiTimeLine size={13} className="text-purple-500 shrink-0" />
                <span className="text-xs text-purple-700 font-medium">
                  {computedHours.toFixed(2)} hours
                </span>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Note <span className="text-gray-300">optional</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                placeholder="What did you work on?"
                className="w-full text-sm border-2 border-gray-200 rounded-lg px-3 py-2 outline-none transition bg-white focus:border-purple-500"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !computedHours || computedHours <= 0}
              className="w-full flex items-center justify-center gap-2 bg-purple-900 hover:bg-purple-800 disabled:opacity-60 text-white text-xs font-medium py-2 rounded-lg transition"
            >
              <RiTimeLine size={13} />
              {loading ? "Logging..." : success ? "✓ Logged!" : "Log Work"}
            </button>
          </div>

          {/* Existing logs */}
          {logs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Work Log History
                </p>
                <span className="text-xs font-bold text-purple-600">{totalHours.toFixed(1)}h total</span>
              </div>
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-100">
                    <img
                      src={avatarUrl(log.userProfileName, log.userPicture)}
                      className="w-6 h-6 rounded-full shrink-0 mt-0.5"
                      alt=""
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-gray-700">{log.userProfileName}</span>
                        <span className="text-xs font-bold text-purple-600 shrink-0">{Number(log.hours).toFixed(1)}h</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatLoggedAt(log.loggedAt)}</p>
                      {log.note && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{log.note}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

//  Main Panel 

/**
 * Component TaskPanel hiển thị bảng thông tin chi tiết trượt ra từ bên phải màn hình khi click vào một Task.
 * Cung cấp các công cụ sửa nhanh trạng thái, tiêu đề, mô tả, hạn chót, thành viên đảm nhiệm,
 * và quản lý công việc con cũng như thời gian chấm công.
 */
export function TaskPanel({
  task,
  open,
  allTasks,
  onClose,
  onOpenTask,
  onSaveTitle,
  onSaveDescription,
  onChangeStatus,
  onChangePriority,
  onChangeAssignee,
  onSaveDeadline,
  onDeleteTask,
  onLink,
  onUnlink,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState("");

  // Resolve the real UUID from the numeric id stored in the task
  // The uuid is embedded in task via the mapping in useBoard
  const taskUuid: string = (task as (Task & { _uuid?: string }) | null)?._uuid
    ?? String(task?.id ?? "");

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-60 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-70 h-full w-full max-w-lg bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {task && (
          <>
            <TaskPanelHeader
              task={task}
              allTasks={allTasks}
              onClose={onClose}
              onSaveTitle={onSaveTitle}
              onOpenTask={onOpenTask}
            />

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Description
                </p>
                {editingDesc ? (
                  <textarea
                    autoFocus
                    value={editDescValue}
                    onChange={(e) => setEditDescValue(e.target.value)}
                    rows={3}
                    onBlur={() => { onSaveDescription(editDescValue); setEditingDesc(false); }}
                    onKeyDown={(e) => { if (e.key === "Escape") setEditingDesc(false); }}
                    className="w-full text-sm text-gray-600 outline-none rounded-lg p-2.5 resize-none border border-purple-300 focus:ring-1 focus:ring-purple-600 transition"
                  />
                ) : (
                  <p
                    onDoubleClick={() => { setEditingDesc(true); setEditDescValue(task.description ?? ""); }}
                    className="text-sm text-gray-600 cursor-default rounded px-1 -mx-1 py-0.5 hover:bg-gray-50 transition min-h-6"
                    title="Double-click to edit"
                  >
                    {task.description || (
                      <span className="italic text-gray-300">No description — double-click to add</span>
                    )}
                  </p>
                )}
              </div>

              <TaskPanelDetails
                task={task}
                onChangeStatus={onChangeStatus}
                onChangePriority={onChangePriority}
                onChangeAssignee={onChangeAssignee}
                onSaveDeadline={onSaveDeadline}
              />

              {childTypeMap[task.type] && (
                <ChildrenSection
                  key={`children-section-${task.id}-${(task.childIds ?? []).sort().join('-')}`}
                  task={task}
                  allTasks={allTasks}
                  onOpenTask={onOpenTask}
                  onLink={onLink}
                  onUnlink={onUnlink}
                />
              )}

              <SubtasksSection
                subtasks={task.subtasks}
                onToggle={onToggleSubtask}
                onAdd={onAddSubtask}
                onDelete={onDeleteSubtask}
              />

              {/* Log Work — now uses real UUID */}
              <LogWorkSection taskUuid={taskUuid} />

              <ActivitySection issueUuid={taskUuid} />
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gray-100 px-6 py-4 flex justify-end gap-2 bg-white">
              {confirmDelete ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Delete this issue?</span>
                  <button
                    onClick={() => { setConfirmDelete(false); onDeleteTask(task); }}
                    className="text-sm px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-sm px-3 py-1.5 border border-gray-400 text-gray-600 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-sm px-4 py-2 border border-gray-500 text-gray-700 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition"
                >
                  Delete issue
                </button>
              )}
              <button
                onClick={onClose}
                className="text-sm px-4 py-2 border border-gray-200 bg-purple-900 hover:bg-purple-800 text-gray-200 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}