import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { avatarUrl as getAvatarHelper } from "../../utils/avatar";
import type { Dispatch, SetStateAction } from "react";
import { FaChevronDown } from "react-icons/fa6";
import { BsBell } from "react-icons/bs";
import { GoSidebarCollapse } from "react-icons/go";
import { IoSearchSharp } from "react-icons/io5";
import { BiPlus } from "react-icons/bi";
import rookworkLogo from "../../assets/logo-no-background.png";
import { CreateProjectPanel } from "./shared/CreateProjectPanel";
import { NotificationPanel } from "./shared/NotificationPanel";
import { useNotifications } from "../../hooks/useNotifications";
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
  const userMenuRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    respondingId,
    respondedMap,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleRespond,
  } = useNotifications(
    onProjectsChanged,
    useCallback(
      (projectId?: string) => {
        if (projectId) {
          navigate(`/projects/${projectId}/overview`);
        }
        setOpenNotification(false);
      },
      [navigate],
    ),
  );

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

  const handleLogout = () => {
    if (isElectron) window.electron?.logout();
    onLogout?.();
  };

  return (
    <>
      <header className="font-heading text-sm h-12.5 px-4 bg-white border-b border-gray-300 flex items-center relative z-40">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setSidebar((prev) => !prev)}
            className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded"
          >
            <GoSidebarCollapse size={22} />
          </button>

          <Link
            to="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
              window.location.reload();
            }}
          >
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

      <NotificationPanel
        open={openNotification}
        onClose={() => setOpenNotification(false)}
        notifications={notifications}
        unreadCount={unreadCount}
        respondingId={respondingId}
        respondedMap={respondedMap}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onRespond={handleRespond}
      />

      <CreateProjectPanel
        open={openCreatePanel}
        onClose={() => setOpenCreatePanel(false)}
        onProjectCreated={(project) => {
          onProjectCreated?.(project);
          setOpenCreatePanel(false);
          navigate(`/projects/${project.id}/overview`);
        }}
        displayName={displayName}
        avatarUrl={avatarUrl}
      />
    </>
  );
}

export default Header;
