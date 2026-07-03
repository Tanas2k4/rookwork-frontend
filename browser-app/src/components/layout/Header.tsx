import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { avatarUrl as getAvatarHelper } from "../../utils/avatar";
import type { Dispatch, SetStateAction } from "react";
import {
  ChevronDownIcon,
  BellIcon,
  Bars3Icon,
  PlusIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  StarIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { ArrowLeftStartOnRectangleIcon } from "@heroicons/react/24/solid";
import rookworkLogo from "../../assets/logo-no-background.png";
import { CreateProjectPanel } from "./shared/CreateProjectPanel";
import { NotificationPanel } from "./shared/NotificationPanel";
import { HeaderSearch } from "./shared/HeaderSearch";
import { useNotifications } from "../../hooks/useNotifications";
import type { ProjectResponse } from "../../api/contracts";

interface HeaderProps {
  setSidebar: Dispatch<SetStateAction<boolean>>;
  avatarUrl?: string;
  displayName?: string;
  email?: string;
  onLogout?: () => void;
  onProjectCreated?: (p: ProjectResponse) => void;
  onProjectsChanged?: () => void;
}

function Header({
  setSidebar,
  avatarUrl,
  displayName,
  email,
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

  // Theme switcher
  const [theme, setTheme] = useState<"light" | "dark">("light");

  return (
    <>
      <header className="font-heading text-sm h-12.5 px-4 bg-white border-b border-gray-300 flex items-center relative z-40">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={() => setSidebar((prev) => !prev)}
            className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded"
          >
            <Bars3Icon className="w-5 h-5" />
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
            <HeaderSearch />
            <button
              onClick={() => setOpenCreatePanel(true)}
              className="flex items-center justify-center bg-purple-900 gap-1 px-3 py-1 rounded-md text-gray-200 hover:bg-purple-800 transition"
            >
              Create
              <PlusIcon className="w-4 h-4" />
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
                <BellIcon className="w-5 h-5" />
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
                <ChevronDownIcon
                  className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-sm border border-gray-200 text-sm z-50 overflow-hidden">
                  {/* User info header */}
                  <div className="flex items-center gap-3 px-4 py-4">
                    <div className="relative shrink-0">
                      <img
                        key={avatarUrl}
                        src={getAvatarHelper(displayName || "User", avatarUrl)}
                        alt={displayName ?? "avatar"}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow"
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-gray-900 leading-tight truncate">
                        {displayName || "User"}
                      </span>
                      <span className="text-gray-500 text-xs truncate mt-0.5">
                        {email || ""}
                      </span>
                    </div>
                  </div>

                  {/* Section 1: View Profile + Account Settings */}
                  <div className="border-t border-gray-100">
                    <Link
                      to="/settings"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      <UserCircleIcon className="w-5 h-5 text-gray-500 shrink-0" />
                      <span>View Profile</span>
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      <Cog6ToothIcon className="w-5 h-5 text-gray-500 shrink-0" />
                      <span>Account Settings</span>
                    </Link>
                  </div>

                  {/* Section 2: Support + Upgrade Account */}
                  <div className="border-t border-gray-100">
                    <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-gray-700 transition-colors w-full text-left">
                      <UserGroupIcon className="w-5 h-5 text-gray-500 shrink-0" />
                      <span>Support</span>
                    </button>
                    <button className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 text-gray-700 transition-colors w-full text-left">
                      <StarIcon className="w-5 h-5 text-gray-500 shrink-0" />
                      <span>Upgrade Account</span>
                    </button>
                  </div>

                  {/* Section 2.5: Theme Switch */}
                  <div className="border-t border-gray-100">
                    <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-gray-700">
                      <div className="flex items-center gap-3">
                        {theme === "dark" ? (
                          <MoonIcon className="w-5 h-5 text-gray-500 shrink-0" />
                        ) : (
                          <SunIcon className="w-5 h-5 text-gray-500 shrink-0" />
                        )}
                        <span>
                          {theme === "dark" ? "Dark Mode" : "Light Mode"}
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={theme === "dark"}
                        onClick={() =>
                          setTheme((prev) =>
                            prev === "dark" ? "light" : "dark",
                          )
                        }
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                          theme === "dark" ? "bg-gray-900" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            theme === "dark"
                              ? "translate-x-4"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  {/* Section 3: Log Out */}
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-500 transition-colors w-full text-left"
                    >
                      <ArrowLeftStartOnRectangleIcon className="w-5 h-5 shrink-0" />
                      <span className="font-medium">Log Out</span>
                    </button>
                  </div>
                </div>
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
