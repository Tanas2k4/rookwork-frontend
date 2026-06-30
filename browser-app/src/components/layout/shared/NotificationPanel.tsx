import { useNavigate } from "react-router-dom";
import { BsBell } from "react-icons/bs";
import { IoClose } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { avatarUrl as getAvatarHelper } from "../../../utils/avatar";
import type { NotificationResponse } from "../../../api/contracts/notification";

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  notifications: NotificationResponse[];
  unreadCount: number;
  respondingId: string | null;
  respondedMap: Record<string, "accepted" | "declined">;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDelete: (e: React.MouseEvent, id: string) => Promise<void>;
  onRespond: (
    e: React.MouseEvent,
    invitationId: string,
    accept: boolean,
    projectId?: string,
  ) => Promise<void>;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - d.getTime()) / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function NotificationPanel({
  open,
  onClose,
  notifications,
  unreadCount,
  respondingId,
  respondedMap,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onRespond,
}: NotificationPanelProps) {
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-55 transition-opacity duration-300"
        />
      )}

      {/* Notification Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-90 bg-white border-l border-gray-200 z-60 flex flex-col
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-base">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs text-purple-700 hover:text-purple-900 transition"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition"
            >
              <IoClose size={18} />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
              <BsBell size={40} className="opacity-30" />
              <span>No notifications</span>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notifications.map((n) => {
                const sender = n.sender;
                const avatarPic = sender?.picture ?? null;
                const isInvitation = n.title === "Project Invitation";
                const isResponding = respondingId === n.invitationId;
                const respondedAs = n.invitationId
                  ? respondedMap[n.invitationId]
                  : undefined;
                const finalStatus =
                  respondedAs ||
                  (n.invitationStatus ? n.invitationStatus.toLowerCase() : undefined);

                return (
                  <li
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) onMarkAsRead(n.id);
                      if (!isInvitation && n.issueId) {
                        navigate(`/issues/${n.issueId}`);
                        onClose();
                      }
                    }}
                    className={`group relative hover:bg-gray-100 px-5 py-4 transition
                      ${!isInvitation ? "cursor-pointer" : "cursor-default"}
                      ${!n.isRead && (!finalStatus || finalStatus === "pending") ? "bg-gray-100" : "bg-white"}`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={getAvatarHelper(
                          sender?.profileName ?? n.title,
                          avatarPic,
                        )}
                        alt={sender?.profileName ?? n.title}
                        className="shrink-0 w-9 h-9 rounded-full object-cover border border-gray-100"
                      />
                      <div className="flex-1 min-w-0 pr-6">
                        <p className="text-sm font-bold text-gray-800 leading-snug">
                          {n.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5 leading-snug">
                          {n.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(n.createdAt)}
                        </p>

                        {/* Invitation actions */}
                        {isInvitation && n.invitationId && (
                          <div
                            className="mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                          >
                            {finalStatus === "accepted" || finalStatus === "declined" ? (
                              <p
                                className={`text-xs italic font-medium ${
                                  finalStatus === "accepted"
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {finalStatus === "accepted"
                                  ? "You joined the project"
                                  : "You declined this invitation"}
                              </p>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  disabled={isResponding}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onRespond(e, n.invitationId!, true, n.projectId);
                                  }}
                                  className="px-3 py-1 text-xs text-white
                                    bg-purple-900 hover:bg-purple-800 disabled:opacity-50 rounded-md transition"
                                >
                                  {isResponding ? "..." : "Accept"}
                                </button>
                                <button
                                  disabled={isResponding}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onRespond(e, n.invitationId!, false, n.projectId);
                                  }}
                                  className="px-3 py-1 text-xs text-gray-600
                                    border border-gray-500 hover:bg-gray-100 disabled:opacity-50 rounded-md transition"
                                >
                                  {isResponding ? "…" : "Decline"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => onDelete(e, n.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50
                        opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete notification"
                    >
                      <RiDeleteBin6Line size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
