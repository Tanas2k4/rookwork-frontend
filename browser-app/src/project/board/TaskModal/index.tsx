/**
 * @file index.tsx (TaskPanel)
 * @description Component chính quản lý panel hiển thị chi tiết thông tin công việc (Task Details Panel).
 * Tích hợp nhật ký chấm công (Work Log), danh sách công việc con (Subtasks), bình luận/lịch sử (Activity), và liên kết giữa các task.
 * @author Warmdrobe
 */

import { useState, useEffect } from "react";
import type { Task, Status, Priority, User } from "../../../types/project";
import { childTypeMap } from "../../../types/project";
import { TaskModalHeader } from "./TaskModalHeader";
import { TaskModalDetails } from "./TaskModalDetails";
import { ChildrenSection } from "./ChildrenSection";
import { SubtasksSection } from "./SubtasksSection";
import { ActivitySection } from "./ActivitySection";
import { AttachmentsSection } from "./AttachmentsSection";
import { workLogApi } from "../../../api/services/workLogApi";
import { tokenStorage } from "../../../api/tokenStorage";
import type { WorkLogResponse } from "../../../api/contracts/worklog";
import type { AttachmentResponse } from "../../../api/contracts/attachment";
import { RiTimeLine } from "react-icons/ri";
import { avatarUrl } from "../../../utils/avatar";
import { formatDateTime, toDatetimeLocal } from "../../../utils/date";
import DOMPurify from "dompurify";
import { RichTextEditor } from "../../../components/common/RichTextEditor";
import type { ProjectStatusResponse } from "../../../api/contracts/projectStatus";

interface Props {
  task: Task | null;
  open: boolean;
  allTasks: Task[];
  onClose: () => void;
  onOpenTask: (task: Task) => void;
  onSaveTitle: (title: string) => void;
  onSaveDescription: (desc: string) => void;
  onChangeStatus: (statusId: string) => void;
  onChangePriority: (p: Priority) => void;
  onChangeAssignee: (users: User[]) => void;
  onSaveDeadline: (val: string) => void;
  onDeleteTask: (task: Task) => void;
  onLink: (parentId: number, childId: number) => void;
  onUnlink: (parentId: number, childId: number) => void;
  onToggleSubtask: (id: number) => void;
  onAddSubtask: (title: string) => void;
  onDeleteSubtask: (id: number) => void;
  onUpdateAttachments?: (attachments: AttachmentResponse[]) => void;
  projectStatuses: ProjectStatusResponse[];
}

//  Log Work Section

/**
 * Component LogWorkSection cho phép người dùng chấm công thời gian làm việc (log work) cho một task,
 * hiển thị tổng thời gian đã làm và lịch sử chấm công của các thành viên.
 */
function LogWorkSection({ task }: { task: Task }) {
  const taskUuid = (task as Task & { _uuid?: string })._uuid ?? String(task.id);
  const currentUserId = tokenStorage.getUserId();

  // Check if the current user is one of the assignees of this task
  const isAssignee = (task.assigned_to ?? []).some(
    (u: User & { uuid?: string; _uuid?: string }) =>
      (u.uuid || u._uuid || String(u.id)) === currentUserId,
  );

  const nowStr = toDatetimeLocal(new Date());
  const todayStartStr = toDatetimeLocal(
    new Date(new Date().setHours(0, 0, 0, 0)),
  );
  const [startAt, setStartAt] = useState(nowStr);
  const [endAt, setEndAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showLogForm, setShowLogForm] = useState(false);
  const [logs, setLogs] = useState<WorkLogResponse[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Load existing logs immediately when taskUuid changes
  useEffect(() => {
    if (!taskUuid) return;
    workLogApi
      .getByIssue(taskUuid)
      .then((data) => setLogs(data ?? []))
      .catch(console.error);
  }, [taskUuid]);

  // Tính số giờ từ start → end
  const computedHours = (() => {
    if (!endAt) return null;
    const start = new Date(startAt || nowStr);
    const end = new Date(endAt);
    const diff = (end.getTime() - start.getTime()) / 3600000;
    return diff > 0 ? parseFloat(diff.toFixed(2)) : null;
  })();

  // Recalculate totalHours from the earliest start time to the latest end time of all worklogs
  const totalHours = (() => {
    if (logs.length === 0) return 0;
    const startTimes = logs
      .map((l) => new Date(l.startAt || l.loggedAt).getTime())
      .filter((t) => !isNaN(t));
    const endTimes = logs
      .map((l) => {
        if (l.endAt) return new Date(l.endAt).getTime();
        const st = new Date(l.loggedAt).getTime();
        return st + Number(l.hours) * 3600000;
      })
      .filter((t) => !isNaN(t));
    if (startTimes.length === 0 || endTimes.length === 0) return 0;
    const minStart = Math.min(...startTimes);
    const maxEnd = Math.max(...endTimes);
    const diff = (maxEnd - minStart) / 3600000;
    return diff > 0 ? parseFloat(diff.toFixed(2)) : 0;
  })();

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
      // Convert local times to UTC ISO strings
      const created = await workLogApi.logWork({
        issueId: taskUuid,
        startAt: new Date(startAt || nowStr).toISOString(),
        endAt: new Date(endAt).toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        note: note.trim() || undefined,
      });
      // logWork trả về array (có thể split nhiều ngày)
      setLogs((prev) => [...created, ...prev]);
      setStartAt(toDatetimeLocal(new Date()));
      setEndAt("");
      setNote("");
      setSuccess(true);
      setShowLogForm(false);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (!taskUuid || taskUuid.startsWith("-")) return null;

  const visibleLogs = showAll ? logs : logs.slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Title & Log Work Toggle */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center font-semibold gap-1.5 text-xs text-gray-400 uppercase tracking-wider">
            <span>Work Log</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowLogForm((p) => {
                if (!p) setStartAt(toDatetimeLocal(new Date()));
                return !p;
              });
              setError("");
            }}
            className="text-xs text-purple-700 hover:text-purple-900 transition flex items-center gap-1"
          >
            {showLogForm ? "Cancel" : "+ Log Work"}
          </button>
        </div>

        {showLogForm && (
          <div className="mt-2.5 bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
            {isAssignee ? (
              <>
                {/* Start */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Start <span className="text-gray-300">defaults to now</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    min={todayStartStr}
                    onChange={(e) => {
                      setStartAt(e.target.value);
                      setError("");
                    }}
                    className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none transition bg-white focus:border-purple-500"
                  />
                </div>

                {/* End */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    End <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    min={startAt || todayStartStr}
                    onChange={(e) => {
                      setEndAt(e.target.value);
                      setError("");
                    }}
                    className={`w-full text-xs border rounded-lg px-2.5 py-1.5 outline-none transition bg-white ${
                      error
                        ? "border-red-400"
                        : "border-gray-300 focus:border-purple-500"
                    }`}
                  />
                  {error && (
                    <p className="text-[10px] text-red-500 mt-1">{error}</p>
                  )}
                </div>

                {/* Computed hours preview */}
                {computedHours !== null && computedHours > 0 && (
                  <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-2.5 py-1.5 border border-purple-100">
                    <RiTimeLine
                      size={13}
                      className="text-purple-500 shrink-0"
                    />
                    <span className="text-xs text-purple-700 font-medium">
                      {computedHours.toFixed(2)} hours
                    </span>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Note <span className="text-gray-300">optional</span>
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmit();
                    }}
                    placeholder="What did you work on?"
                    className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 outline-none transition bg-white focus:border-purple-500"
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
              </>
            ) : (
              <p className="text-xs text-gray-400 italic text-center">
                Only assignees can log work on this task.
              </p>
            )}
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-2">
        {totalHours > 0 && (
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <span>History</span>
            <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full font-bold normal-case">
              {totalHours.toFixed(1)}h total
            </span>
          </div>
        )}

        {logs.length === 0 ? (
          <p className="text-xs text-gray-400 italic bg-gray-50 border border-gray-100 rounded-lg p-3 text-center">
            No work logged yet.
          </p>
        ) : (
          <div className="space-y-2">
            {visibleLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 bg-white rounded-lg px-3 py-2.5 border border-gray-100 shadow-sm"
              >
                <img
                  src={avatarUrl(log.userProfileName, log.userPicture)}
                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-700">
                      {log.userProfileName}
                    </span>
                    <span className="text-xs font-bold text-purple-800 shrink-0">
                      {Number(log.hours).toFixed(1)}h
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {formatDateTime(log.startAt)} - {formatDateTime(log.endAt)}
                  </p>
                  {log.note && (
                    <p className="text-xs text-gray-500 mt-1 italic leading-relaxed">
                      "{log.note}"
                    </p>
                  )}
                </div>
              </div>
            ))}

            {logs.length > 2 && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-center text-xs font-semibold text-white bg-purple-900 hover:bg-purple-800 transition py-1.5 rounded-md"
              >
                {showAll ? "Show Less" : `See All (${logs.length})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

//  Main Modal

/**
 * Component TaskModal hiển thị bảng thông tin chi tiết dạng Modal ở giữa màn hình khi click vào một Task.
 * Thiết kế 2 cột rộng rãi để hỗ trợ tốt nội dung mô tả dài, checklist và lịch sử bình luận/chấm công.
 */
export function TaskModal({
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
  onUpdateAttachments,
  projectStatuses,
}: Props) {
  const [editingDesc, setEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState("");

  // Escape key event listener to close modal
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  // Resolve the real UUID from the numeric id stored in the task
  // The uuid is embedded in task via the mapping in useBoard
  const taskUuid: string =
    (task as (Task & { _uuid?: string }) | null)?._uuid ??
    String(task?.id ?? "");

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-60 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Modal Wrapper */}
      <div
        className={`fixed inset-0 z-70 flex items-center justify-center p-4 transition-all duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          className={`bg-white rounded-md shadow-2xl w-full max-w-5xl h-[90vh] max-h-212.5 flex flex-col overflow-hidden transition-all duration-300 transform ${
            open ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {task && (
            <>
              <TaskModalHeader
                task={task}
                allTasks={allTasks}
                onClose={onClose}
                onSaveTitle={onSaveTitle}
                onOpenTask={onOpenTask}
                onDeleteTask={onDeleteTask}
              />

              {/* 2-Column Body */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left Column (Main content, scrollable) */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 md:border-r md:border-gray-100">
                  {/* Description */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      Description
                    </p>
                    {editingDesc ? (
                      <RichTextEditor
                        initialValue={editDescValue}
                        onChange={(val) => setEditDescValue(val)}
                        onSave={(val) => {
                          onSaveDescription(val);
                          setEditingDesc(false);
                        }}
                        onCancel={() => setEditingDesc(false)}
                        placeholder="Add a description... (Ctrl + Enter to save)"
                      />
                    ) : (
                      <div
                        onDoubleClick={() => {
                          setEditingDesc(true);
                          setEditDescValue(task.description ?? "");
                        }}
                        className="text-sm border border-gray-200 hover:border-gray-300 rounded-md text-gray-700 cursor-text px-2 py-1.5 transition-colors min-h-10"
                        title="Double-click to edit"
                      >
                        {task.description ? (
                          <div
                            className="tiptap-content"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(task.description),
                            }}
                          />
                        ) : (
                          <span className="italic text-gray-300 select-none">
                            No description — double-click to add
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <AttachmentsSection
                    projectId={(task as { _projectId?: string })._projectId || ""}
                    issueId={(task as { _uuid?: string })._uuid || ""}
                    initialAttachments={task.attachments || []}
                    onUpdateAttachments={onUpdateAttachments}
                  />

                  {childTypeMap[task.type] && (
                    <ChildrenSection
                      key={`children-section-${task.id}-${(task.childIds ?? []).sort().join("-")}`}
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

                  <ActivitySection issueUuid={taskUuid} />
                </div>

                {/* Right Column (Metadata sidebar, scrollable) */}
                <div className="w-full md:w-80 shrink-0 bg-gray-50/50 overflow-y-auto px-6 py-6 space-y-6">
                  <TaskModalDetails
                    task={task}
                    onChangeStatus={onChangeStatus}
                    onChangePriority={onChangePriority}
                    onChangeAssignee={onChangeAssignee}
                    onSaveDeadline={onSaveDeadline}
                    projectStatuses={projectStatuses}
                  />

                  {/* Log Work */}
                  <LogWorkSection task={task} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
