import { useState } from "react";
import {
  PencilSquareIcon,
  UsersIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import InviteModal from "./shared/InviteModal";
import { useProject } from "../hooks/useProject";
import { avatarUrl } from "../utils/avatar";
import { projectApi } from "../api/services/projectApi";
import { invitationApi } from "../api/services/invitationApi";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "../components/common/ToastContainer";
import { CreateIssueModal } from "./shared/CreateIssueModal";

interface ProjectHeaderProps {
  onProjectsChanged?: () => void;
}

function ProjectHeader({ onProjectsChanged }: ProjectHeaderProps) {
  const { project, members, projectId, refresh } = useProject();
  const { toasts, addToast, removeToast } = useToast();

  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Edit project title states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [saveTitleError, setSaveTitleError] = useState("");

  const handleSaveTitle = async () => {
    if (!projectId) return;
    const trimmedTitle = editTitleValue.trim();
    if (!trimmedTitle) {
      setSaveTitleError("Project name cannot be empty");
      return;
    }
    if (trimmedTitle === project?.projectName) {
      setIsEditingTitle(false);
      setSaveTitleError("");
      return;
    }

    setIsSavingTitle(true);
    setSaveTitleError("");
    try {
      await projectApi.update(projectId, { projectName: trimmedTitle });
      refresh();
      onProjectsChanged?.();
      addToast("Project title updated successfully!", "success");
      setIsEditingTitle(false);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to update project title";
      addToast(errMsg, "error");
      setSaveTitleError(errMsg);
    } finally {
      setIsSavingTitle(false);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditingTitle(false);
      setSaveTitleError("");
    }
  };

  return (
    <>
      <div className="pt-3 px-8 bg-white">
        <div className="flex flex-row items-center gap-3 pb-1">
          {isEditingTitle ? (
            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center gap-2">
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  className="text-5xl font-bold text-gray-800 border-b-2 border-purple-500 focus:outline-none bg-transparent py-1 max-w-xl"
                  autoFocus
                  disabled={isSavingTitle}
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={isSavingTitle}
                  className="text-green-700 p-1.5 bg-green-100 hover:bg-green-200 rounded-lg transition disabled:opacity-50"
                  title="Save title"
                >
                  <CheckIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingTitle(false);
                    setSaveTitleError("");
                  }}
                  disabled={isSavingTitle}
                  className="text-red-700 p-1 bg-red-100 hover:bg-red-200 rounded-lg transition disabled:opacity-50"
                  title="Cancel"
                >
                  <XMarkIcon className="w-4.5 h-4.5" />
                </button>
              </div>
              {saveTitleError && (
                <span className="text-xs text-red-500 font-medium px-1">
                  {saveTitleError}
                </span>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold text-gray-800 whitespace-nowrap">
                  {project?.projectName ?? "Project"}
                </h1>
                <button
                  onClick={() => {
                    setEditTitleValue(project?.projectName ?? "");
                    setIsEditingTitle(true);
                    setSaveTitleError("");
                  }}
                  className="text-purple-700 p-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg transition"
                  title="Edit project name"
                >
                  <PencilSquareIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
          <button
            onClick={() => setShowInviteModal(true)}
            className="text-purple-700 p-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg transition"
            title="Invite members"
          >
            <UsersIcon className="w-3.75 h-3.75" />
          </button>
          <div className="flex gap-3 items-center w-full justify-end">
            <div className="flex items-center gap-2">
              {/* Member avatars */}
              <div className="flex -space-x-2">
                {members.length > 0 ? (
                  members.map((member) => (
                    <img
                      key={member.id}
                      src={avatarUrl(member.profileName, member.picture)}
                      alt={member.profileName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white shrink-0"
                      title={member.profileName}
                    />
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    No members
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowCreateIssue(true)}
              className="flex flex-row items-center gap-1.5 px-3 py-1.5 text-xs
             text-gray-700 border border-gray-500 active:bg-gray-100 active:border-gray-400 rounded-md transition font-medium"
            >
              Create task
              <PlusIcon className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      <CreateIssueModal
        open={showCreateIssue}
        onClose={() => setShowCreateIssue(false)}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <InviteModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        project={project}
        members={members}
        onInvite={async (email) => {
          if (!projectId) return;
          await invitationApi.send(projectId, email);
          refresh();
        }}
      />
    </>
  );
}

export default ProjectHeader;
