/**
 * @file ActivitySection.tsx
 * @description Component hiển thị lịch sử hoạt động và quản lý phần bình luận của sự vụ (Issue). Tích hợp thời gian thực qua WebSocket.
 * @author Warmdrobe
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { CommentResponse, CommentReactionResponse } from "../../../api/contracts/comment";
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
import { FaceSmileIcon, XMarkIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { EmojiChar, QUICK_REACTIONS, EMOJI_META } from "../../../utils/emoji";
import EmojiPicker, { EmojiStyle } from "emoji-picker-react";


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

// ──────────── Reaction Badges Component ────────────

/**
 * Displays existing reaction badges below a comment and opens
 * a full multi-category emoji picker panel (like Slack/Notion).
 */
function ReactionBadges({
  reactions,
  currentUserId,
  onReact,
}: {
  reactions: CommentReactionResponse[];
  currentUserId: string | null;
  onReact: (reactionType: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [quickHovered, setQuickHovered] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pickerOpen) {
      setShowFullPicker(false);
      return;
    }
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [pickerOpen]);

  function handlePick(emoji: string) {
    onReact(emoji);
    setPickerOpen(false);
    setQuickHovered(null);
    setShowFullPicker(false);
  }

  return (
    <div className="flex items-center gap-1 flex-wrap mt-1.5">

      {/* ── Existing reaction badges ── */}
      {reactions.map((r) => {
        const isOwn = r.users.some((u) => u.id === currentUserId);
        const meta = EMOJI_META[r.reactionType];
        const accentColor = meta?.color ?? "#6b7280";
        const accentBg    = meta?.bg    ?? "#f3f4f6";

        return (
          <div key={r.reactionType} className="relative">
            <button
              onClick={() => onReact(r.reactionType)}
              onMouseEnter={() => setHoveredBadge(r.reactionType)}
              onMouseLeave={() => setHoveredBadge(null)}
              className="
                flex items-center gap-1 pl-0.5 pr-2 py-0.5 rounded-full
                border transition-all duration-150 select-none
                hover:scale-105 active:scale-95
              "
              style={{
                backgroundColor: isOwn ? accentBg : "#f3f4f6",
                borderColor: isOwn ? accentColor + "66" : "#e5e7eb",
              }}
            >
              <EmojiChar emoji={r.reactionType} size={15} />
              <span
                className="text-[11px] font-semibold leading-none"
                style={{ color: isOwn ? accentColor : "#6b7280" }}
              >
                {r.count}
              </span>
            </button>

            {/* Tooltip */}
            {hoveredBadge === r.reactionType && (
              <div className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                bg-gray-900/95 backdrop-blur-sm border border-gray-800/40
                text-white rounded-xl p-2 z-50
                shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                flex flex-col gap-1.5 min-w-[130px] max-w-[200px] pointer-events-none
              ">
                {r.users.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 select-none">
                    <img
                      src={avatarUrl(u.profileName, u.picture)}
                      alt=""
                      className="w-4.5 h-4.5 rounded-full object-cover flex-shrink-0 border border-white/10"
                    />
                    <span className="text-[11px] text-gray-200 truncate font-semibold leading-none">
                      {u.profileName}
                    </span>
                  </div>
                ))}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-gray-900/95" />
              </div>
            )}
          </div>
        );
      })}

      {/* ── Emoji picker trigger ── */}
      <div className="relative" ref={pickerRef}>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className={`
            w-6 h-6 rounded-full flex items-center justify-center
            transition-all duration-150 hover:scale-110 active:scale-95
            ${
              pickerOpen
                ? "bg-purple-100 text-purple-600"
                : "text-gray-300 hover:text-purple-500 hover:bg-purple-50"
            }
          `}
          title="Add reaction"
        >
          <FaceSmileIcon className="w-3.5 h-3.5" />
        </button>

        {/* ── Emoji picker panel ── */}
        {pickerOpen && (
          !showFullPicker ? (
            /* ── Facebook Messenger Style Quick reactions row + Plus Button ── */
            <div
              className="
                absolute bottom-full left-0 mb-2.5 z-50
                bg-white/95 backdrop-blur-md
                border border-gray-100 rounded-full
                px-2 py-1.5 flex items-center gap-1
              "
              style={{
                boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {QUICK_REACTIONS.map(({ emoji }) => (
                <button
                  key={emoji}
                  type="button"
                  onMouseEnter={() => setQuickHovered(emoji)}
                  onMouseLeave={() => setQuickHovered(null)}
                  onClick={() => handlePick(emoji)}
                  className="flex items-center justify-center p-1 rounded-full select-none active:scale-90"
                  style={{
                    transform: quickHovered === emoji
                      ? "scale(1.5) translateY(-4px)"
                      : "scale(1) translateY(0)",
                    transition: "transform 140ms cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                >
                  <EmojiChar emoji={emoji} size={22} />
                </button>
              ))}

              {/* Plus Button to open full categorised list */}
              <button
                type="button"
                onClick={() => setShowFullPicker(true)}
                className="
                  w-8 h-8 rounded-full flex items-center justify-center
                  bg-gray-100 hover:bg-gray-200 text-gray-500 font-semibold text-lg
                  transition-all duration-100 active:scale-90
                "
                title="More emojis"
              >
                +
              </button>
            </div>
          ) : (
            /* ── Full Expanded Emoji Picker ── */
            <div
              className="
                absolute bottom-full left-0 mb-2 z-50
                bg-white border border-gray-100 rounded-2xl
                flex flex-col overflow-hidden
              "
              style={{
                width: 312,
                boxShadow: "0 16px 56px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {/* Quick reactions row at top */}
              <div className="flex items-end justify-center gap-1 px-3 pt-3 pb-0">
                {QUICK_REACTIONS.map(({ emoji }) => (
                  <button
                    key={emoji}
                    type="button"
                    onMouseEnter={() => setQuickHovered(emoji)}
                    onMouseLeave={() => setQuickHovered(null)}
                    onClick={() => handlePick(emoji)}
                    className="flex items-center justify-center p-1 rounded-xl select-none active:scale-90"
                    style={{
                      transform: quickHovered === emoji
                        ? "scale(1.6) translateY(-6px)"
                        : "scale(1) translateY(0)",
                      transition: "transform 140ms cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                  >
                    <EmojiChar emoji={emoji} size={24} />
                  </button>
                ))}
              </div>

              {/* Quick label */}
              <div className="h-5 flex items-center justify-center mb-1.5">
                {quickHovered ? (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      color: EMOJI_META[quickHovered]?.color ?? "#374151",
                      backgroundColor: EMOJI_META[quickHovered]?.bg ?? "#f3f4f6",
                    }}
                  >
                    {EMOJI_META[quickHovered]?.label ?? quickHovered}
                  </span>
                ) : (
                  <span className="text-[10px] text-gray-300">Quick reactions</span>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100" />

              {/* EmojiPicker library component */}
              <EmojiPicker
                onEmojiClick={(emojiData) => handlePick(emojiData.emoji)}
                autoFocusSearch={false}
                emojiStyle={EmojiStyle.NATIVE}
                width="100%"
                height={320}
                previewConfig={{ showPreview: false }}
                skinTonesDisabled={true}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ──────────── Comment Editor Component ────────────

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
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [quickHovered, setQuickHovered] = useState<string | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!emojiPickerOpen) {
      setShowFullPicker(false);
      return;
    }
    function onClickOutside(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [emojiPickerOpen]);

  const handlePick = (emoji: string) => {
    setValue((v) => v + emoji);
    setEmojiPickerOpen(false);
    setQuickHovered(null);
    setShowFullPicker(false);
  };

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit(value);
      setValue("");
    }
  };

  return (
    <div className="w-full border border-gray-300 rounded-lg bg-white focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-700 transition-all duration-150">
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
        maxLength={3000}
        className="w-full text-sm text-gray-700 p-2.5 pb-1 resize-none outline-none bg-transparent h-16 rounded-t-lg"
      />
      <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50/50 h-10 select-none rounded-b-lg">
        {/* Left Toolbar - Emojis */}
        <div className="flex items-center relative" ref={emojiRef}>
          <button
            type="button"
            onClick={() => setEmojiPickerOpen((v) => !v)}
            className={`p-1.5 rounded-full transition ${
              emojiPickerOpen ? "bg-purple-100 text-purple-600" : "text-gray-400 hover:bg-gray-100 hover:text-purple-600"
            }`}
            title="Insert Emoji"
          >
            <FaceSmileIcon className="w-4 h-4" />
          </button>

          {emojiPickerOpen && (
            !showFullPicker ? (
              /* ── Quick reactions row + Plus Button ── */
              <div
                className="
                  absolute bottom-full left-0 mb-2.5 z-50
                  bg-white/95 backdrop-blur-md
                  border border-gray-100 rounded-full
                  px-2 py-1.5 flex items-center gap-1
                "
                style={{
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                {QUICK_REACTIONS.map(({ emoji }) => (
                  <button
                    key={emoji}
                    type="button"
                    onMouseEnter={() => setQuickHovered(emoji)}
                    onMouseLeave={() => setQuickHovered(null)}
                    onClick={() => handlePick(emoji)}
                    className="flex items-center justify-center p-1 rounded-full select-none active:scale-90"
                    style={{
                      transform: quickHovered === emoji
                        ? "scale(1.5) translateY(-4px)"
                        : "scale(1) translateY(0)",
                      transition: "transform 140ms cubic-bezier(0.34,1.56,0.64,1)",
                    }}
                  >
                    <EmojiChar emoji={emoji} size={22} />
                  </button>
                ))}

                {/* Plus Button to open full categorised list */}
                <button
                  type="button"
                  onClick={() => setShowFullPicker(true)}
                  className="
                    w-8 h-8 rounded-full flex items-center justify-center
                    bg-gray-100 hover:bg-gray-200 text-gray-500 font-semibold text-lg
                    transition-all duration-100 active:scale-90
                  "
                  title="More emojis"
                >
                  +
                </button>
              </div>
            ) : (
              /* ── Full Expanded Emoji Picker ── */
              <div
                className="
                  absolute bottom-full left-0 mb-2 z-50
                  bg-white border border-gray-100 rounded-2xl
                  flex flex-col overflow-hidden
                "
                style={{
                  width: 312,
                  boxShadow: "0 16px 56px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                {/* Quick reactions row at top */}
                <div className="flex items-end justify-center gap-1 px-3 pt-3 pb-0">
                  {QUICK_REACTIONS.map(({ emoji }) => (
                    <button
                      key={emoji}
                      type="button"
                      onMouseEnter={() => setQuickHovered(emoji)}
                      onMouseLeave={() => setQuickHovered(null)}
                      onClick={() => handlePick(emoji)}
                      className="flex items-center justify-center p-1 rounded-xl select-none active:scale-90"
                      style={{
                        transform: quickHovered === emoji
                          ? "scale(1.6) translateY(-6px)"
                          : "scale(1) translateY(0)",
                        transition: "transform 140ms cubic-bezier(0.34,1.56,0.64,1)",
                      }}
                    >
                      <EmojiChar emoji={emoji} size={24} />
                    </button>
                  ))}
                </div>

                {/* Quick label */}
                <div className="h-5 flex items-center justify-center mb-1.5">
                  {quickHovered ? (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        color: EMOJI_META[quickHovered]?.color ?? "#374151",
                        backgroundColor: EMOJI_META[quickHovered]?.bg ?? "#f3f4f6",
                      }}
                    >
                      {EMOJI_META[quickHovered]?.label ?? quickHovered}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-300">Quick reactions</span>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100" />

                {/* EmojiPicker library component */}
                <EmojiPicker
                  onEmojiClick={(emojiData) => handlePick(emojiData.emoji)}
                  autoFocusSearch={false}
                  emojiStyle={EmojiStyle.NATIVE}
                  width="100%"
                  height={320}
                  previewConfig={{ showPreview: false }}
                  skinTonesDisabled={true}
                />
              </div>
            )
          )}
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
               <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!value.trim()}
            className={`p-1.5 rounded-full transition ${
              value.trim() ? "text-purple-800" : "text-gray-300 cursor-not-allowed"
            }`}
            title="Send"
          >
             <PaperAirplaneIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}


// ──────────── Comment Item ────────────

/**
 * Component hiển thị một bình luận đơn lẻ trong phần thảo luận.
 * Hỗ trợ hiển thị phân cấp (reply lồng nhau), sửa bình luận, xóa bình luận,
 * hiển thị reaction badges và emoji picker.
 */
function CommentItem({
  comment,
  depth = 0,
  currentUserId,
  onEdit,
  onDelete,
  onReply,
  onReact,
}: {
  comment: CommentResponse;
  depth?: number;
  currentUserId: string | null;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
  onReact: (commentId: string, reactionType: string) => void;
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
                className={`inline-block bg-gray-200 rounded-xl rounded-tl px-3 py-1 ${isReply ? "text-xs" : "text-sm"} text-gray-700 break-words break-all max-w-full leading-relaxed`}
              >
                {comment.content}
              </div>

              {/* Reaction Badges + Emoji Picker */}
              <ReactionBadges
                reactions={comment.reactions ?? []}
                currentUserId={currentUserId}
                onReact={(reactionType) => onReact(comment.id, reactionType)}
              />

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
                  onReact={onReact}
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
        <p className="text-xs text-gray-600 leading-relaxed break-words break-all whitespace-normal">
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

type Tab = "comments" | "history";

/**
 * Component chính hiển thị toàn bộ phần hoạt động của một sự vụ (Issue).
 * Bao gồm form gửi bình luận mới, chuyển đổi các tab (Bình luận / Lịch sử hoạt động),
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
  const [tab, setTab] = useState<Tab>("comments");

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
        return [...prev, { ...c, replies: [], reactions: [] }];
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
    } else if (payload.type === "COMMENT_REACTION_UPDATED" && payload.commentId) {
      // Cập nhật reactions cho bình luận tương ứng
      const id = payload.commentId;
      const reactions = payload.reactions as CommentReactionResponse[];
      setComments((prev) =>
        prev.map((p) => {
          if (p.id === id) return { ...p, reactions };
          return {
            ...p,
            replies: (p.replies ?? []).map((r) =>
              r.id === id ? { ...r, reactions } : r,
            ),
          };
        }),
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

  async function handleReact(commentId: string, reactionType: string) {
    if (!projectId) return;
    try {
      // Optimistic update: cập nhật reactions ngay lập tức trước khi WS trả về
      const updatedReactions = await commentApi.react(projectId, issueUuid, commentId, reactionType);
      setComments((prev) =>
        prev.map((p) => {
          if (p.id === commentId) return { ...p, reactions: updatedReactions };
          return {
            ...p,
            replies: (p.replies ?? []).map((r) =>
              r.id === commentId ? { ...r, reactions: updatedReactions } : r,
            ),
          };
        }),
      );
    } catch (err) {
      console.error("Failed to react to comment", err);
    }
  }

  const nestedComments = comments.filter((c) => !c.parentCommentId);
  const totalCommentCount = comments.reduce(
    (sum, c) => sum + 1 + (c.replies?.length ?? 0),
    0,
  );

  const tabs: { key: Tab; label: string }[] = [
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
                onReact={handleReact}
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
