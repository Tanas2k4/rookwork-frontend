/**
 * @file ActivitySection.tsx
 * @description Component hiển thị lịch sử hoạt động và quản lý phần bình luận của sự vụ (Issue). Tích hợp thời gian thực qua WebSocket.
 * @author Warmdrobe
 */

import { useState, useEffect, useCallback } from "react";
import type { CommentResponse } from "../../../api/contracts/comment";
import { commentApi } from "../../../api/services/commentApi";
import { apiClient } from "../../../api/apiClient";
import { useProject } from "../../../hooks/useProject";
import {
  useWebSocket,
  type WsCommentPayload,
  type WsActivityPayload,
} from "../../../hooks/useWebSocket";
import { tokenStorage } from "../../../api/tokenStorage";
import { avatarUrl } from "../../../utils/avatar";
import { formatDateTime } from "../../../utils/date";
import { FiSmile, FiHeart, FiX } from "react-icons/fi";
import { IoSend } from "react-icons/io5";

//  Types

interface ActivityResponse {
  id: string;
  actorName: string;
  actorPicture: string | null;
  actionType: string;
  entityType: string;
  entityId: string;
  entityName: string;
  metadata: string | null;
  createdAt: string;
}

//  Helpers



function actionLabel(a: ActivityResponse): string {
  const meta = a.metadata
    ? (() => {
        try {
          return JSON.parse(a.metadata);
        } catch {
          return {};
        }
      })()
    : {};

  if (a.entityType === "COMMENT") {
    switch (a.actionType) {
      case "COMMENTED":
        return `commented on issue "${a.entityName}"`;
      case "DELETED":
        return `deleted a comment on issue "${a.entityName}"`;
      default:
        return `${a.actionType.toLowerCase()} a comment on issue "${a.entityName}"`;
    }
  }

  if (a.entityType === "SUBTASK") {
    switch (a.actionType) {
      case "CREATED":
        return `created subtask "${a.entityName}"`;
      case "COMPLETED":
        return `completed subtask "${a.entityName}"`;
      case "UPDATED":
        return `updated subtask "${a.entityName}" (${meta.field ?? "details"})`;
      case "DELETED":
        return `deleted subtask "${a.entityName}"`;
      default:
        return `${a.actionType.toLowerCase()} subtask "${a.entityName}"`;
    }
  }

  const typeLabel =
    a.entityType === "ISSUE" ? "issue" : a.entityType.toLowerCase();
  switch (a.actionType) {
    case "CREATED":
      return `created ${typeLabel} "${a.entityName}"`;
    case "COMPLETED":
      return `completed ${typeLabel} "${a.entityName}"`;
    case "MOVED":
      return `moved ${typeLabel} "${a.entityName}" from ${meta.from ?? "?"} to ${meta.to ?? "?"}`;
    case "ASSIGNED":
      return `assigned ${typeLabel} "${a.entityName}" to ${meta.assigned_to_name ?? "someone"}`;
    case "UPDATED":
      return `updated ${meta.field ?? "field"} of ${typeLabel} "${a.entityName}"`;
    case "DELETED":
      return `deleted ${typeLabel} "${a.entityName}"`;
    default:
      return `${a.actionType.toLowerCase()} ${typeLabel} "${a.entityName}"`;
  }
}

//  Comment Editor Component

interface CommentEditorProps {
  placeholder?: string;
  initialValue?: string;
  onSubmit: (content: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

function CommentEditor({
  placeholder = "Add a comment...",
  initialValue = "",
  onSubmit,
  onCancel,
  autoFocus = false,
}: CommentEditorProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
      setValue("");
    }
  };

  return (
    <div className="w-full border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-700 transition-all duration-150">
      <textarea
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
          if (e.key === "Escape" && onCancel) {
            onCancel();
          }
        }}
        className="w-full text-sm text-gray-700 p-2.5 pb-1 resize-none outline-none bg-transparent h-16"
      />
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50 h-10 select-none">
        {/* Left Toolbar Icons */}
        <div className="flex items-center gap-3 text-gray-400">
          <button
            type="button"
            className="hover:text-purple-800 p-1 rounded-md transition"
            title="Emojis"
          >
            <FiSmile size={16} />
          </button>
          <button
            type="button"
            className="hover:text-purple-800 p-1 rounded-md transition"
            title="Stickers"
          >
            <FiHeart size={15} />
          </button>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
              title="Cancel"
            >
              <FiX size={15} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={`p-1.5 rounded-full transition ${value.trim() ? "text-purple-800" : "text-gray-300 cursor-not-allowed"}`}
            title="Send"
          >
            <IoSend size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

//  Comment Item

/**
 * Component hiển thị một bình luận đơn lẻ trong phần thảo luận.
 * Hỗ trợ hiển thị phân cấp (reply lồng nhau), sửa bình luận, xóa bình luận,
 * và hiển thị hộp thoại trả lời nhanh cho bình luận cấp 0.
 */
function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
}: {
  comment: CommentResponse;
  depth?: number;
  currentUserId: string | null;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showReplyBox, setShowReplyBox] = useState(false);

  const isOwn = comment.user?.id === currentUserId;
  const isReply = depth > 0;

  return (
    <div>
      <div className="flex gap-2.5">
        <img
          src={avatarUrl(
            comment.user?.profileName ?? "?",
            comment.user?.picture,
          )}
          className={`rounded-full object-cover shrink-0 mt-0.5 ${isReply ? "w-5 h-5" : "w-6 h-6"}`}
          alt=""
        />
        <div className="flex-1 min-w-0 ">
          <div className="flex items-baseline gap-1.5 mb-1 ">
            <span
              className={`font-medium text-gray-800 ${isReply ? "text-[11px]" : "text-xs"}`}
            >
              {comment.user?.profileName ?? "Unknown"}
            </span>
            <span
              className={`text-gray-400 ${isReply ? "text-[10px]" : "text-[10px]"}`}
            >
              {formatDateTime(comment.createdAt)}
            </span>
          </div>

          {editingId === comment.id ? (
            <div className="mt-1.5">
              <CommentEditor
                initialValue={comment.content}
                onSubmit={(val) => {
                  onEdit(comment.id, val);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                autoFocus
              />
            </div>
          ) : (
            <>
              <div
                className={`inline-block bg-gray-200 rounded-xl rounded-tl px-3 py-1 ${isReply ? "text-xs" : "text-sm"} text-gray-700 wrap-break-word leading-relaxed`}
              >
                {comment.content}
              </div>
              <div className="flex gap-3 mt-1 items-center">
                {depth === 0 && (
                  <button
                    onClick={() => setShowReplyBox((v) => !v)}
                    className="text-[11px] text-gray-400 hover:text-purple-800 transition"
                  >
                    {showReplyBox ? "Cancel" : "Reply"}
                  </button>
                )}
                {isOwn && (
                  <>
                    <button
                      onClick={() => setEditingId(comment.id)}
                      className="text-[11px] text-gray-400 hover:text-gray-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(comment.id)}
                      className="text-[11px] text-gray-400 hover:text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {showReplyBox && (
                <div className="flex gap-1.5 mt-2">
                  <div className="flex-1">
                    <CommentEditor
                      placeholder={`Reply to ${comment.user?.profileName}...`}
                      onSubmit={(val) => {
                        onReply(comment.id, val);
                        setShowReplyBox(false);
                      }}
                      onCancel={() => setShowReplyBox(false)}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {(comment.replies ?? []).length > 0 && (
            <div className="mt-2 space-y-2.5 pl-2">
              {(comment.replies ?? []).map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  depth={depth + 1}
                  currentUserId={currentUserId}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

//  Activity Log Item

/**
 * Component hiển thị một dòng hoạt động ghi log lịch sử thay đổi của công việc.
 */
function ActivityLogItem({ log }: { log: ActivityResponse }) {
  return (
    <div className="flex gap-2.5 items-start">
      <img
        src={avatarUrl(log.actorName, log.actorPicture)}
        className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
        alt=""
      />
      <div className="flex-1 min-w-0 ">
        <p className="text-xs text-gray-600 leading-relaxed">
          <span className="font-medium text-gray-800">{log.actorName}</span>{" "}
          {actionLabel(log)}
        </p>
        <span className="text-[10px] text-gray-400">
          {formatDateTime(log.createdAt)}
        </span>
      </div>
    </div>
  );
}

//  Main Section

type Tab = "all" | "comments" | "history";

/**
 * Component chính hiển thị toàn bộ phần hoạt động của một sự vụ (Issue).
 * Bao gồm form gửi bình luận mới, chuyển đổi các tab (Tất cả / Bình luận / Lịch sử hoạt động),
 * tích hợp lắng nghe sự kiện WebSocket để cập nhật danh sách bình luận thời gian thực.
 */
export function ActivitySection({
  issueUuid,
  projectId: projectIdProp,
}: {
  issueUuid: string;
  projectId?: string | null;
}) {
  const { projectId: contextProjectId } = useProject();
  const projectId = projectIdProp ?? contextProjectId;
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [tab, setTab] = useState<Tab>("all");

  const currentUserId = tokenStorage.getUserId();

  const loadComments = useCallback(async () => {
    if (!projectId || !issueUuid) return;
    try {
      const data = await commentApi.getByIssue(projectId, issueUuid);
      setComments(data ?? []);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  }, [projectId, issueUuid]);

  useEffect(() => {
    if (!projectId || !issueUuid) return;
    let cancelled = false;

    commentApi
      .getByIssue(projectId, issueUuid)
      .then((data) => {
        if (!cancelled) setComments(data ?? []);
      })
      .catch(console.error);

    apiClient
      .get<ActivityResponse[]>(
        `/api/projects/${projectId}/issues/${issueUuid}/activities?limit=30`,
      )
      .then((data) => {
        if (!cancelled) setActivities(data ?? []);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [projectId, issueUuid]);

  // WebSocket — source of truth cho comments, KHÔNG optimistic add
  const handleWsComment = useCallback((payload: WsCommentPayload) => {
    if (payload.type === "NEW_COMMENT" && payload.comment) {
      const c = payload.comment as CommentResponse;
      setComments((prev) => {
        if (prev.some((p) => p.id === c.id)) return prev;
        if (c.parentCommentId) {
          return prev.map((p) =>
            p.id === c.parentCommentId
              ? { ...p, replies: [...(p.replies ?? []), c] }
              : p,
          );
        }
        return [...prev, { ...c, replies: [] }];
      });
    } else if (payload.type === "UPDATED_COMMENT" && payload.comment) {
      const c = payload.comment as CommentResponse;
      setComments((prev) =>
        prev.map((p) => {
          if (p.id === c.id) return { ...c, replies: p.replies };
          return {
            ...p,
            replies: (p.replies ?? []).map((r) => (r.id === c.id ? c : r)),
          };
        }),
      );
    } else if (payload.type === "DELETED_COMMENT" && payload.commentId) {
      const id = payload.commentId;
      setComments((prev) =>
        prev
          .filter((p) => p.id !== id)
          .map((p) => ({
            ...p,
            replies: (p.replies ?? []).filter((r) => r.id !== id),
          })),
      );
    }
  }, []);

  const handleWsActivity = useCallback((payload: WsActivityPayload) => {
    const activity = payload.activity;
    if (payload.type === "NEW_ACTIVITY" && activity) {
      setActivities((prev) => {
        if (prev.some((a) => a.id === activity.id)) return prev;
        return [activity, ...prev];
      });
    }
  }, []);

  useWebSocket({
    projectId,
    issueId: issueUuid,
    onComment: handleWsComment,
    onActivity: handleWsActivity,
  });

  // Handlers — KHÔNG add optimistic, để WS xử lý hoặc fallback local
  async function handleSubmit(content: string, parentId?: string) {
    if (!projectId || !content.trim()) return;
    try {
      await commentApi.create(projectId, issueUuid, {
        content: content.trim(),
        parentCommentId: parentId,
      });
      // Nếu WS không đến trong 2s thì reload
      setTimeout(() => {
        setComments((prev) => {
          if (prev.length === 0) loadComments();
          return prev;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to post comment", err);
    }
  }

  async function handleEdit(id: string, content: string) {
    if (!projectId || !content.trim()) return;
    try {
      await commentApi.update(projectId, issueUuid, id, { content });
      setComments((prev) =>
        prev.map((p) => {
          if (p.id === id) return { ...p, content };
          return {
            ...p,
            replies: (p.replies ?? []).map((r) =>
              r.id === id ? { ...r, content } : r,
            ),
          };
        }),
      );
    } catch (err) {
      console.error("Failed to edit comment", err);
    }
  }

  async function handleDelete(id: string) {
    if (!projectId) return;
    try {
      await commentApi.delete(projectId, issueUuid, id);
      setComments((prev) =>
        prev
          .filter((p) => p.id !== id)
          .map((p) => ({
            ...p,
            replies: (p.replies ?? []).filter((r) => r.id !== id),
          })),
      );
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  }

  const nestedComments = comments.filter((c) => !c.parentCommentId);
  const totalCommentCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0,
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    {
      key: "comments",
      label: `Comments${totalCommentCount ? ` (${totalCommentCount})` : ""}`,
    },
    { key: "history", label: "History" },
  ];

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Activity
      </p>

      <div className="flex gap-0 border-b border-gray-200 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 -mb-px transition ${tab === t.key ? "border-purple-800 text-purple-800" : "border-transparent text-gray-400 hover:text-gray-600"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "history" && (
        <div className="flex gap-2.5 mb-4">
          <div className="flex-1">
            <CommentEditor onSubmit={(val) => handleSubmit(val)} />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tab === "all" && (
          <>
            {activities.length === 0 && nestedComments.length === 0 && (
              <p className="text-xs text-gray-300 italic">No activity yet.</p>
            )}
            {activities.map((log) => (
              <ActivityLogItem key={log.id} log={log} />
            ))}
            {activities.length > 0 && nestedComments.length > 0 && (
              <div className="border-t border-gray-100" />
            )}
            {nestedComments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                depth={0}
                currentUserId={currentUserId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReply={(parentId, content) => handleSubmit(content, parentId)}
              />
            ))}
          </>
        )}

        {tab === "comments" &&
          (nestedComments.length === 0 ? (
            <p className="text-xs text-gray-300 italic">No comments yet.</p>
          ) : (
            nestedComments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                depth={0}
                currentUserId={currentUserId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onReply={(parentId, content) => handleSubmit(content, parentId)}
              />
            ))
          ))}

        {tab === "history" &&
          (activities.length === 0 ? (
            <p className="text-xs text-gray-300 italic">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((log) => (
                <ActivityLogItem key={log.id} log={log} />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}
