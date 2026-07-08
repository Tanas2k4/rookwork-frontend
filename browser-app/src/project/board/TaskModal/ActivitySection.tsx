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

// ──────────── Facebook Style Like & Reactions Popover Component ────────────

const REACTION_STYLE_MAP: Record<string, { label: string; textColor: string }> = {
  "👍": { label: "Like", textColor: "text-blue-600 font-bold" },
  "❤️": { label: "Love", textColor: "text-red-600 font-bold" },
  "🤗": { label: "Care", textColor: "text-yellow-600 font-bold" },
  "😂": { label: "Haha", textColor: "text-yellow-600 font-bold" },
  "😮": { label: "Wow", textColor: "text-yellow-600 font-bold" },
  "😢": { label: "Sad", textColor: "text-blue-500 font-bold" },
  "😡": { label: "Angry", textColor: "text-orange-600 font-bold" },
};

function LikeButtonWithReactions({
  reactions,
  currentUserId,
  onReact,
}: {
  reactions: CommentReactionResponse[];
  currentUserId: string | null;
  onReact: (reactionType: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const hoverTimeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ownReaction = reactions.find((r) => r.users.some((u) => u.id === currentUserId));
  const activeReaction = ownReaction ? ownReaction.reactionType : null;
  const activeStyle = activeReaction
    ? (REACTION_STYLE_MAP[activeReaction] ?? { label: "Like", textColor: "text-purple-800 font-bold" })
    : null;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setHovered(false);
        setShowFullPicker(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (!showFullPicker) {
        setHovered(false);
      }
    }, 300);
  };

  const handleLikeClick = () => {
    if (activeReaction) {
      onReact(activeReaction);
    } else {
      onReact("👍");
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Popover reactions bar */}
      {hovered && (
        <div 
          className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] px-2 py-1 flex gap-2.5 z-50 animate-[fadeIn_0.15s_ease-out] items-center"
          style={{ transform: "translateX(-20%)" }}
        >
          {QUICK_REACTIONS.map((qr) => (
            <button
              key={qr.emoji}
              onClick={() => {
                onReact(qr.emoji);
                setHovered(false);
              }}
              className="text-lg hover:scale-130 transition-transform duration-100 ease-out p-0.5 cursor-pointer"
              title={qr.label}
            >
              <EmojiChar emoji={qr.emoji} size={20} />
            </button>
          ))}
          {/* Plus Button to open full categorised list */}
          <button
            type="button"
            onClick={() => setShowFullPicker((v) => !v)}
            className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-150 hover:bg-gray-200 text-gray-500 font-bold text-sm transition-all duration-100 active:scale-90 cursor-pointer shrink-0 border border-gray-200"
            title="More emojis"
          >
            +
          </button>
        </div>
      )}

      {/* Full Expanded Emoji Picker */}
      {showFullPicker && (
        <div
          className="absolute bottom-full left-0 mb-2.5 z-[60] bg-white border border-gray-100 rounded-2xl flex flex-col overflow-hidden shadow-[0_16px_56px_rgba(0,0,0,0.18)]"
          style={{ width: 312 }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-semibold text-gray-500">Pick a reaction</span>
            <button
              onClick={() => setShowFullPicker(false)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              onReact(emojiData.emoji);
              setShowFullPicker(false);
              setHovered(false);
            }}
            autoFocusSearch={false}
            emojiStyle={EmojiStyle.NATIVE}
            width="100%"
            height={300}
            previewConfig={{ showPreview: false }}
            skinTonesDisabled={true}
          />
        </div>
      )}

      {/* Like button */}
      <button
        onClick={handleLikeClick}
        className={`text-[11px] transition cursor-pointer select-none ${
          activeStyle ? activeStyle.textColor : "text-gray-400 hover:text-purple-800"
        }`}
      >
        {activeReaction ? activeReaction : "Like"}
      </button>
    </div>
  );
}

// ──────────── Who Reacted Modal Component ────────────

function WhoReactedModal({
  comment,
  onClose,
}: {
  comment: CommentResponse;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [onClose]);

  const reactions = comment.reactions ?? [];
  const validReactions = reactions.filter((r) => r.count > 0);
  const totalCount = validReactions.reduce((sum, r) => sum + r.count, 0);

  const allUsers = validReactions.flatMap((r) =>
    r.users.map((u) => ({ ...u, reactionType: r.reactionType }))
  );

  const displayedUsers =
    activeTab === "all"
      ? allUsers
      : allUsers.filter((u) => u.reactionType === activeTab);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-md w-full max-w-sm flex flex-col shadow-2xl overflow-hidden border border-gray-100 max-h-[450px]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-800">Reactions</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full cursor-pointer"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-3 border-b border-gray-100 overflow-x-auto scrollbar-none py-1.5 bg-gray-50/50">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-full transition whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-purple-900 text-white"
                : "text-gray-500 hover:bg-gray-200/60"
            }`}
          >
            All {totalCount}
          </button>
          {validReactions.map((r) => (
            <button
              key={r.reactionType}
              onClick={() => setActiveTab(r.reactionType)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full transition whitespace-nowrap cursor-pointer ${
                activeTab === r.reactionType
                  ? "bg-purple-900 text-white"
                  : "text-gray-500 hover:bg-gray-200/60"
              }`}
            >
              <EmojiChar emoji={r.reactionType} size={13} />
              <span>{r.count}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayedUsers.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No reactions found</p>
          ) : (
            displayedUsers.map((u, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <img
                      src={avatarUrl(u.profileName, u.picture)}
                      alt={u.profileName}
                      className="w-8 h-8 rounded-full object-cover border border-gray-100"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-gray-200 rounded-full p-0.5  flex items-center justify-center">
                      <EmojiChar emoji={u.reactionType} size={11} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-700">{u.profileName}</span>
                </div>
              </div>
            ))
          )}
        </div>
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
  onOpenWhoReacted,
}: {
  comment: CommentResponse;
  depth?: number;
  currentUserId: string | null;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onReply: (parentId: string, content: string) => void;
  onReact: (commentId: string, reactionType: string) => void;
  onOpenWhoReacted: (comment: CommentResponse) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(false);

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

              {/* Top 3 Reactions Summary Bubble */}
              {(() => {
                const validReactions = (comment.reactions ?? []).filter((r) => r.count > 0);
                if (validReactions.length === 0) return null;

                const top3 = [...validReactions]
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3);
                const totalCount = validReactions.reduce((sum, r) => sum + r.count, 0);

                return (
                  <div className="mt-1 flex">
                    <button
                      onClick={() => onOpenWhoReacted(comment)}
                      className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200/70 border border-gray-200/60 rounded-full px-2 py-0.5 transition select-none shadow-sm cursor-pointer"
                    >
                      <div className="flex -space-x-1 items-center">
                        {top3.map((r) => (
                          <EmojiChar key={r.reactionType} emoji={r.reactionType} size={13} />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 pl-0.5 leading-none">
                        {totalCount}
                      </span>
                    </button>
                  </div>
                );
              })()}

              <div className="flex gap-3 mt-1.5 items-center">
                {/* Like Button with Hover Reactions */}
                <LikeButtonWithReactions
                  reactions={comment.reactions ?? []}
                  currentUserId={currentUserId}
                  onReact={(reactionType) => onReact(comment.id, reactionType)}
                />

                <button
                  onClick={() => setShowReplyBox((v) => !v)}
                  className="text-[11px] text-gray-400 hover:text-purple-800 transition"
                >
                  {showReplyBox ? "Cancel" : "Reply"}
                </button>
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
                        const targetParentId = comment.parentCommentId || comment.id;
                        onReply(targetParentId, val);
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

          {(() => {
            const replies = comment.replies ?? [];
            if (replies.length === 0) return null;

            const hasManyReplies = replies.length > 2;
            const displayedReplies = (hasManyReplies && !expandedReplies)
              ? replies.slice(replies.length - 2)
              : replies;

            return (
              <div className="mt-2 space-y-2.5 pl-2 border-l border-gray-100">
                {displayedReplies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    currentUserId={currentUserId}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReply={onReply}
                    onReact={onReact}
                    onOpenWhoReacted={onOpenWhoReacted}
                  />
                ))}

                {hasManyReplies && !expandedReplies && (
                  <button
                    onClick={() => setExpandedReplies(true)}
                    className="text-[11px] font-semibold text-gray-400 hover:text-purple-800 hover:underline transition cursor-pointer select-none block mt-1"
                  >
                    View {replies.length - 2} previous replies...
                  </button>
                )}

                {hasManyReplies && expandedReplies && (
                  <button
                    onClick={() => setExpandedReplies(false)}
                    className="text-[11px] font-semibold text-gray-400 hover:text-purple-800 hover:underline transition cursor-pointer select-none block mt-1"
                  >
                    Hide replies
                  </button>
                )}
              </div>
            );
          })()}
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
  const [modalComment, setModalComment] = useState<CommentResponse | null>(null);

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
                onOpenWhoReacted={(comment) => setModalComment(comment)}
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

      {modalComment && (
        <WhoReactedModal
          comment={modalComment}
          onClose={() => setModalComment(null)}
        />
      )}
    </div>
  );
}
