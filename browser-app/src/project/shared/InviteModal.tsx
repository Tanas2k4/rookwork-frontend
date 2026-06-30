/**
 * @file InviteModal.tsx
 * @description Modal chia sẻ dự án, hiển thị danh sách thành viên hiện tại và cho phép mời thêm thành viên mới qua Email.
 * @author Warmdrobe & Antigravity
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { LuComponent, LuUndo2 } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { IoIosArrowDown } from "react-icons/io";
import { GiLinkedRings } from "react-icons/gi";
import { RxCopy } from "react-icons/rx";
import type { ProjectResponse } from "../../api/contracts/project";
import type { UserSummary } from "../../api/contracts/issue";
import { userApi } from "../../api/services/userApi";
import { invitationApi } from "../../api/services/invitationApi";
import type { InvitationResponse } from "../../api/contracts/invitation";
import { RiUserSearchLine } from "react-icons/ri";
import { FaCheck, FaChevronDown } from "react-icons/fa6";

const ROLES = ["Owner", "Contributor", "Viewer"] as const;
type Role = (typeof ROLES)[number];

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: Role;
  avatarColor?: string;
}

function Avatar({ user }: { user: User }) {
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.name}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
      style={{ backgroundColor: user.avatarColor || "#5b21b6" }}
    >
      {user.name[0].toUpperCase()}
    </div>
  );
}

function RoleDropdown({
  role,
  onChange,
  disabled,
}: {
  role: Role;
  onChange: (r: Role) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-[13px] font-medium text-gray-800 bg-white border border-gray-200 rounded-lg px-2.5 py-1 transition-colors ${
          disabled
            ? "opacity-60 cursor-not-allowed bg-gray-50 text-gray-500"
            : "hover:bg-gray-50 border border-gray-500 cursor-pointer"
        }`}
      >
        {role}
        <FaChevronDown size={10} />
      </button>

      {open && (
        <div className="flex flex-col absolute right-0 top-[calc(100%+4px)] min-w-32.5 bg-white border border-gray-200 rounded-lg shadow-md  p-1">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => {
                onChange(r);
                setOpen(false);
              }}
              className="flex items-center justify-between w-full text-left text-[13px] font-medium px-2.5 py-1.5 rounded-md hover:bg-gray-50 text-gray-800 transition-colors"
            >
              {r}
              {r === role && <FaCheck size={10} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
interface InviteModalProps {
  open?: boolean;
  onClose?: () => void;
  project: ProjectResponse | null;
  members: UserSummary[];
  onInvite?: (email: string) => Promise<void>;
}

export default function InviteModal({
  open = true,
  onClose,
  project,
  members,
  onInvite,
}: InviteModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [pendingInvites, setPendingInvites] = useState<InvitationResponse[]>(
    [],
  );

  const projectIdVal = project?.id;
  const fetchPendingInvites = useCallback(() => {
    if (!projectIdVal) return;
    invitationApi
      .getPendingForProject(projectIdVal)
      .then(setPendingInvites)
      .catch(console.error);
  }, [projectIdVal]);

  useEffect(() => {
    if (open) {
      userApi.getMe().then(setCurrentUser).catch(console.error);
      if (project?.id) {
        fetchPendingInvites();
      }
    }
  }, [open, project?.id, fetchPendingInvites]);

  const isCurrentUserOwner =
    project && currentUser
      ? members?.some(
          (m) => m.id === currentUser.id && m.role?.toUpperCase() === "OWNER",
        ) ||
        currentUser.profileName.toLowerCase() ===
          project.ownerName.toLowerCase()
      : false;
  const [linkAccess, setLinkAccess] = useState<
    "Anyone with the link can view" | "Private"
  >("Anyone with the link can view");
  const [copied, setCopied] = useState(false);
  const [linkDropdown, setLinkDropdown] = useState(false);

  // States cho form invite email
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Đồng bộ danh sách members thực tế của dự án
  useEffect(() => {
    if (!members) return;
    const mapped = members.map((m) => {
      // Xác định role dựa trên dữ liệu backend trả về (hoặc fallback qua ownerName)
      const rawRole = m.role ? m.role.toUpperCase() : "";
      let resolvedRole: User["role"] = "Contributor";
      if (rawRole === "OWNER") {
        resolvedRole = "Owner";
      } else if (rawRole === "CONTRIBUTOR") {
        resolvedRole = "Contributor";
      } else {
        const isOwner = project
          ? m.profileName.toLowerCase() === project.ownerName.toLowerCase()
          : false;
        resolvedRole = isOwner ? "Owner" : "Contributor";
      }

      return {
        id: m.id,
        name: m.profileName,
        email:
          m.email ||
          `${m.profileName.toLowerCase().replace(/\s+/g, "")}@powersurge.io`,
        avatar: m.picture || undefined,
        role: resolvedRole,
        avatarColor: resolvedRole === "Owner" ? "#5b21b6" : undefined,
      };
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsers(mapped);
  }, [members, project]);

  // URL truy cập động
  const projectUrl = project
    ? `${window.location.host}/projects/${project.id}`
    : "uui.com/projects/powersurge";

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredPending = pendingInvites.filter(
    (p) =>
      (p.invitedUserName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.invitedUserEmail || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.protocol}//${projectUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoleChange = (id: string, role: User["role"]) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      await invitationApi.cancel(invitationId);
      setInviteMessage({
        text: "Invitation revoked successfully.",
        type: "success",
      });
      fetchPendingInvites();
      setTimeout(() => setInviteMessage(null), 4000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to revoke invitation.";
      setInviteMessage({
        text: errorMsg,
        type: "error",
      });
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !onInvite) return;

    setInviting(true);
    setInviteMessage(null);

    try {
      await onInvite(inviteEmail.trim());
      setInviteMessage({
        text: `Sent invitation to ${inviteEmail.trim()} successfully!`,
        type: "success",
      });
      setInviteEmail("");
      fetchPendingInvites();
      // Reset thông báo sau 4 giây
      setTimeout(() => setInviteMessage(null), 4000);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to send invitation.";
      setInviteMessage({
        text: errorMsg,
        type: "error",
      });
    } finally {
      setInviting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="bg-white  rounded-md shadow-sm w-full max-w-115 mx-4 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-start gap-4">
            {/* App icon */}
            <div className="items-center justify-center w-12 h-12 rounded-xl text-white bg-sky-700 flex  shrink-0">
              <LuComponent size={26} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 leading-snug">
                Share your project
              </h2>
              <p className="text-[13px] text-gray-400 mt-0.5">
                Invite your team to review and collaborate on this project.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors ml-2 shrink-0"
          >
            <IoClose size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Link access row */}
          <div className="mx-6 mb-4">
            <div className="flex items-center justify-between  border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center shrink-0">
                  <GiLinkedRings />
                </div>
                <div className="min-w-0">
                  <div className="relative">
                    <button
                      onClick={() => setLinkDropdown((o) => !o)}
                      className="flex items-center gap-1 text-sm font-semibold text-gray-800"
                    >
                      {linkAccess}
                      <IoIosArrowDown />
                    </button>
                    {linkDropdown && (
                      <div className="absolute left-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                        {["Anyone with the link can view", "Private"].map(
                          (opt) => (
                            <button
                              key={opt}
                              onClick={() => {
                                setLinkAccess(opt as typeof linkAccess);
                                setLinkDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                                opt === linkAccess
                                  ? "font-semibold text-purple-800"
                                  : "text-gray-700"
                              }`}
                            >
                              {opt}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  <p
                    className="text-xs text-gray-400 truncate max-w-64"
                    title={projectUrl}
                  >
                    {projectUrl}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 w-22.5 text-sm text-gray-700 rounded-lg py-1.5 
                border border-gray-200 bg-gray-100 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
              >
                <RxCopy />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Form invite email */}
          <form onSubmit={handleInviteSubmit} className="mx-6 mb-4">
            <label className="block text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
              Invite by Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="team-member@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-purple-800 placeholder:text-gray-400 bg-white"
                required
              />
              <button
                type="submit"
                disabled={inviting || !inviteEmail.trim()}
                className="px-4 py-1.5 text-sm text-white bg-purple-800 hover:bg-purple-900 active:bg-purple-950 disabled:opacity-50 disabled:hover:bg-purple-800 rounded-lg transition shadow-sm shrink-0 cursor-pointer"
              >
                {inviting ? "Inviting..." : "Invite"}
              </button>
            </div>
            {inviteMessage && (
              <p
                className={`text-xs mt-1.5 font-medium ${
                  inviteMessage.type === "success"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {inviteMessage.text}
              </p>
            )}
          </form>

          {/* Divider */}
          <div className="mx-6 border-t border-dashed border-gray-200 mb-4" />

          {/* People with access */}
          <div className="px-6">
            <h3 className="text-sm font-bold text-gray-800 mb-0.5">
              People with access
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Users who have already joined or have been assigned roles in this
              project.
            </p>

            {/* Search */}
            <div className="relative mb-3">
              <RiUserSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:bg-white focus:border-purple-800 placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-1 h-40 overflow-y-auto pr-1">
              {filteredUsers.length === 0 && filteredPending.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                  No members found
                </div>
              ) : (
                <>
                  {/* Joined members */}
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2 px-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar user={user} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <RoleDropdown
                        role={user.role}
                        onChange={(r) => handleRoleChange(user.id, r)}
                        disabled={!isCurrentUserOwner || user.role === "Owner"}
                      />
                    </div>
                  ))}

                  {/* Pending invitations */}
                  {filteredPending.map((invite) => {
                    const initial = invite.invitedUserName
                      ? invite.invitedUserName[0].toUpperCase()
                      : "?";
                    return (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between py-2 px-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {invite.invitedUserPicture ? (
                            <img
                              src={invite.invitedUserPicture}
                              alt={invite.invitedUserName}
                              className="w-9 h-9 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                              style={{ backgroundColor: "#5b21b6" }}
                            >
                              {initial}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {invite.invitedUserName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {invite.invitedUserEmail}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-green-700   py-0.5 rounded-full tracking-wider shrink-0">
                            Pending
                          </span>
                          {isCurrentUserOwner && (
                            <button
                              onClick={() => handleCancelInvite(invite.id)}
                              className="text-[11px] font-bold text-red-600 hover:text-red-400  px-1 py-0.5 rounded-md  transition-colors cursor-pointer shrink-0"
                              title="Invoke"
                            >
                              <LuUndo2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 mt-3 flex items-center justify-between border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm  text-gray-700 border border-gray-250 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
            >
              <RxCopy />
              Copy link
            </button>
          </div>
          <button
            onClick={onClose}
            className="bg-purple-800 hover:bg-purple-900 active:bg-purple-950 text-white text-sm px-6 py-2 rounded-lg transition-colors shadow-sm cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
