import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { avatarUrl as getAvatarHelper } from "../../utils/avatar";
import type { Dispatch, SetStateAction } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { BsBell } from "react-icons/bs";
import { GoSidebarCollapse } from "react-icons/go";
import { IoSearchSharp } from "react-icons/io5";
import { BiPlus } from "react-icons/bi";
import { IoClose } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import rookworkLogo from "../../assets/logo-no-background.png";
import { CreateProjectPanel } from "./shared/CreateProjectPanel";
import { notificationApi } from "../../api/services/notificationApi";
import { invitationApi } from "../../api/services/invitationApi";
import {
  useWebSocket,
  type WsNotificationPayload,
} from "../../hooks/useWebSocket";
import type { NotificationResponse } from "../../api/contracts/notification";
import type { ProjectResponse } from "../../api/contracts";

interface HeaderProps {
  setSidebar: Dispatch<SetStateAction<boolean>>;
  avatarUrl?: string;
  displayName?: string;
  onLogout?: () => void;
  onProjectCreated?: (p: ProjectResponse) => void;
  onProjectsChanged?: () => void;
}

function Header({
  setSidebar,
  avatarUrl,
  displayName,
  onLogout,
  onProjectCreated,
  onProjectsChanged,
}: HeaderProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openNotification, setOpenNotification] = useState(false);
  const [openCreatePanel, setOpenCreatePanel] = useState(false);
  const isElectron = window.navigator.userAgent.includes("Electron");
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    [],
  );
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondedMap, setRespondedMap] = useState<
    Record<string, "accepted" | "declined">
  >({});
  const userMenuRef = useRef<HTMLDivElement>(null);

  function normalize(all: NotificationResponse[]): NotificationResponse[] {
    return all.map((n) => ({
      ...n,
      isRead: n.isRead ?? (n as unknown as { read?: boolean }).read ?? false,
    }));
  }

  const loadNotifications = useCallback(() => {
    notificationApi
      .getAll()
      .then((all) => setNotifications(normalize(all)))
      .catch((err: unknown) =>
        console.error("Failed to load notifications", err),
      );
  }, []);

  useEffect(() => {
    let cancelled = false;
    notificationApi
      .getAll()
      .then((all) => {
        if (!cancelled) setNotifications(normalize(all));
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  //  WebSocket
  useWebSocket({
    projectId: null,
    issueId: null,
    onNotification: useCallback(
      (payload: WsNotificationPayload) => {
        if (payload.notificationId) {
          loadNotifications();
        }
        if (payload.type === "INVITATION_ACCEPTED") {
          onProjectsChanged?.();
        }
      },
      [loadNotifications, onProjectsChanged],
    ),
  });

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  }, []);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  }, []);

  //  Respond to invitation
  const handleRespond = useCallback(
    async (e: React.MouseEvent, invitationId: string, accept: boolean) => {
      e.stopPropagation();
      e.preventDefault();
      if (respondingId) return;
      setRespondingId(invitationId);
      try {
        await invitationApi.respond(invitationId, accept);
        // Hiện text thay thế buttons ngay lập tức
        setRespondedMap((prev) => ({
          ...prev,
          [invitationId]: accept ? "accepted" : "declined",
        }));
        if (accept) onProjectsChanged?.();
        setTimeout(() => loadNotifications(), 800);
      } catch (err) {
        console.error("Failed to respond to invitation", err);
      } finally {
        setRespondingId(null);
      }
    },
    [loadNotifications, respondingId, onProjectsChanged],
  );

  const handleLogout = () => {
    if (isElectron) window.electron?.logout();
    onLogout?.();
  };

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

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      {openNotification && (
        <div
          onClick={() => setOpenNotification(false)}
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-55 transition-opacity duration-300"
        />
      )}

      <header className="font-heading text-sm h-12.5 px-4 bg-white border-b border-gray-300 flex items-center relative z-40">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setSidebar((prev) => !prev)}
            className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded"
          >
            <GoSidebarCollapse size={22} />
          </button>

          <Link to="/">
            <img src={rookworkLogo} alt="logo" className="h-9 w-36" />
          </Link>

          <div className="flex gap-3 relative w-max items-center">
            <div className="relative">
              <IoSearchSharp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-gray-200 pl-10 pr-3 py-1 rounded-xl focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setOpenCreatePanel(true)}
              className="flex items-center justify-center bg-purple-900 gap-1 px-3 py-1 rounded-md text-gray-200 hover:bg-purple-800 transition"
            >
              Create
              <BiPlus size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setOpenNotification((p) => !p)}
                className={`p-2 rounded-full transition ${
                  openNotification
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-600 hover:bg-gray-200"
                }`}
              >
                <BsBell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setOpen((p) => !p)}
                className="flex items-center gap-1.5 text-gray-600 border border-gray-500 rounded-full pl-1 pr-2.5 py-1 hover:bg-gray-50 transition"
              >
                <img
                  key={avatarUrl}
                  src={getAvatarHelper(displayName || "User", avatarUrl)}
                  alt={displayName ?? "avatar"}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-black/5 shrink-0"
                />
                <FaChevronDown
                  size={10}
                  className={`text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <ul className="absolute right-0 mt-2 w-40 bg-white rounded-lg border border-gray-300 text-sm z-50 overflow-hidden">
                  <li className="px-4 py-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer">
                    <Link
                      to="/settings"
                      className="block w-full h-full"
                      onClick={() => setOpen(false)}
                    >
                      Profile
                    </Link>
                  </li>
                  <li className="px-4 py-2 border-b border-gray-200 hover:bg-gray-100 cursor-pointer">
                    <Link
                      to="/settings"
                      className="block w-full h-full"
                      onClick={() => setOpen(false)}
                    >
                      Settings
                    </Link>
                  </li>
                  <li
                    className="px-4 py-2 hover:bg-red-50 cursor-pointer text-red-500"
                    onClick={handleLogout}
                  >
                    Log out
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Notification Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-90 bg-white border-l border-gray-200 z-60 flex flex-col
          transition-transform duration-300 ease-in-out
          ${openNotification ? "translate-x-0" : "translate-x-full"}`}
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
                onClick={handleMarkAllAsRead}
                className="text-xs text-purple-700 hover:text-purple-900 transition"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setOpenNotification(false)}
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

                return (
                  <li
                    key={n.id}
                    onClick={() => {
                      if (!n.isRead) handleMarkAsRead(n.id);
                      if (!isInvitation && n.issueId) {
                        navigate(`/issues/${n.issueId}`);
                        setOpenNotification(false);
                      }
                    }}
                    className={`group relative hover:bg-gray-100 px-5 py-4 transition
                      ${!isInvitation ? "cursor-pointer" : "cursor-default"}
                      ${!n.isRead && !respondedAs ? "bg-gray-100" : "bg-white"}`}
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

                        {/*  Invitation actions  */}
                        {isInvitation && !n.isRead && n.invitationId && (
                          <div
                            className="mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                            }}
                          >
                            {respondedAs ? (
                              <p
                                className={`text-xs italic font-medium ${
                                  respondedAs === "accepted"
                                    ? "text-green-600"
                                    : "text-gray-400"
                                }`}
                              >
                                {respondedAs === "accepted"
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
                                    handleRespond(e, n.invitationId!, true);
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
                                    handleRespond(e, n.invitationId!, false);
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
                      onClick={(e) => handleDelete(e, n.id)}
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

      <CreateProjectPanel
        open={openCreatePanel}
        onClose={() => setOpenCreatePanel(false)}
        onProjectCreated={onProjectCreated}
        displayName={displayName}
        avatarUrl={avatarUrl}
      />
    </>
  );
}

export default Header;
