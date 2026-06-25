import { useState, useEffect } from "react";
import { ImPencil } from "react-icons/im";
import { FaLink } from "react-icons/fa6";
import { IoAdd, IoClose } from "react-icons/io5";
import { FaCheck } from "react-icons/fa6";
import { RiUserAddLine } from "react-icons/ri";
import { FaTasks, FaBook, FaRocket } from "react-icons/fa";
import { useProject } from "../hooks/useProject";
import { issueApi } from "../api/services/issueApi";
import { projectApi } from "../api/services/projectApi";
import { invitationApi } from "../api/services/invitationApi";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "../components/common/ToastContainer";
import type {
  IssueType,
  PriorityType,
  Status as ApiStatus,
} from "../api/contracts/issue";

type TaskType = "task" | "story" | "epic";

const TYPE_OPTIONS = [
  {
    value: "task" as const,
    label: "Task",
    icon: <FaTasks size={16} />,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    activeColor: "bg-blue-100 border-blue-500",
    description: "A single piece of work",
  },
  {
    value: "story" as const,
    label: "Story",
    icon: <FaBook size={16} />,
    color: "bg-green-50 text-green-700 border-green-200",
    activeColor: "bg-green-100 border-green-500",
    description: "A user-facing feature",
  },
  {
    value: "epic" as const,
    label: "Epic",
    icon: <FaRocket size={16} />,
    color: "bg-purple-50 text-purple-700 border-purple-200",
    activeColor: "bg-purple-100 border-purple-500",
    description: "A large body of work",
  },
] as const;

interface ProjectHeaderProps {
  onProjectsChanged?: () => void;
}

function ProjectHeader({ onProjectsChanged }: ProjectHeaderProps) {
  const { project, members, projectId, reloadIssues, refresh } = useProject();
  const { toasts, addToast, removeToast } = useToast();

  const [showAddUser, setShowAddUser] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Invite states
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  // Create task states
  const [selectedType, setSelectedType] = useState<TaskType>("task");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<PriorityType>("MEDIUM");
  const [status, setStatus] = useState<ApiStatus>("TO_DO");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    document.body.style.overflow = showCreateTask ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [showCreateTask]);

  //  Send invite 
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !projectId) return;

    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      await invitationApi.send(projectId, email.trim());
      addToast(`Sent invitation to ${email.trim()}`, "success");
      setInviteSuccess(`Sent to ${email.trim()}`);
      setEmail("");
      setTimeout(() => {
        setShowAddUser(false);
        setInviteSuccess("");
      }, 1500);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to send invitation";
      addToast(errMsg, "error");
      setInviteError(errMsg);
    } finally {
      setInviting(false);
    }
  };

  const closeInvitePanel = () => {
    setShowAddUser(false);
    setEmail("");
    setInviteError("");
    setInviteSuccess("");
  };

  //  Create task 
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !projectId) return;
    setCreating(true);
    setCreateError("");
    try {
      const deadlineISO = dueDate ? new Date(dueDate).toISOString() : undefined;
      const created = await issueApi.create(projectId, {
        issueName: taskTitle.trim(),
        issueType: selectedType.toUpperCase() as IssueType,
        priority,
        description: taskDescription.trim() || undefined,
        deadline: deadlineISO,
        status,
      });
      if (assigneeId && created.id) {
        await issueApi.update(projectId, created.id, { assigneeIds: [assigneeId] });
      }
      addToast(`Created task "${taskTitle.trim()}" successfully!`, "success");
      resetTaskForm();
      reloadIssues();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to create task";
      addToast(errMsg, "error");
      setCreateError(errMsg);
    } finally {
      setCreating(false);
    }
  };

  const resetTaskForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setSelectedType("task");
    setDueDate("");
    setPriority("MEDIUM");
    setStatus("TO_DO");
    setAssigneeId("");
    setCreateError("");
    setShowCreateTask(false);
  };

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
      const errMsg = err instanceof Error ? err.message : "Failed to update project title";
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
      <div className="py-3 px-8 bg-white">
        <div className="flex flex-row items-center gap-3 mb-3">
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
                  <FaCheck size={14} />
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
                  <IoClose size={18} />
                </button>
              </div>
              {saveTitleError && (
                <span className="text-xs text-red-500 font-medium px-1">{saveTitleError}</span>
              )}
            </div>
          ) : (
            <>
              <h1 className="text-5xl font-bold text-gray-800">
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
                <ImPencil size={14} />
              </button>
            </>
          )}
          <button className="text-purple-700 p-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg transition">
            <FaLink size={14} />
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex flex-row items-center gap-1.5 px-3 py-1.5 text-sm
             text-gray-700 border border-gray-500 rounded-md transition font-medium"
          >
            Create task
            <IoAdd size={18} />
          </button>

          <div className="flex items-center gap-2">
            {/* Toggle invite panel */}
            <button
              onClick={() => setShowAddUser((p) => !p)}
              className={`flex items-center justify-center w-8 h-8 text-gray-700
              border border-gray-500 hover:bg-gray-200 rounded-full transition
              ${showAddUser ? "bg-gray-100" : ""}`}
            >
              <RiUserAddLine size={18} />
            </button>

            {/* Member avatars */}
            <div className="flex -space-x-2">
              {members.length > 0 ? (
                members.map((member) => (
                  <img
                    key={member.id}
                    src={
                      member.picture ??
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.profileName)}&background=7c3aed&color=fff`
                    }
                    alt={member.profileName}
                    className="w-8 h-8 rounded-full border-2 border-white"
                    title={member.profileName}
                  />
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">No members</span>
              )}
            </div>

            {/* Invite input panel */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out
              ${showAddUser ? "w-80 opacity-100" : "w-0 opacity-0"}`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddUser(e)}
                  placeholder="example@email.com"
                  className="w-full px-3 py-1.5 text-sm border border-gray-500 rounded-md
                    focus:outline-none focus:ring-1 focus:ring-purple-500 transition"
                  autoFocus={showAddUser}
                />
                <button
                  onClick={handleAddUser}
                  disabled={inviting}
                  className="px-3 py-1.5 text-sm font-medium text-gray-200
                    bg-purple-900 hover:bg-purple-700 disabled:opacity-50
                    rounded-md transition whitespace-nowrap"
                >
                  {inviting ? "Sending…" : "Send"}
                </button>
                <button
                  onClick={closeInvitePanel}
                  className="p-1.5 text-gray-500 hover:text-gray-600 bg-gray-200 rounded-full transition"
                >
                  <IoClose size={18} />
                </button>
              </div>
              {inviteError && <p className="text-xs text-red-500 mt-1 px-1">{inviteError}</p>}
              {inviteSuccess && <p className="text-xs text-green-600 mt-1 px-1">{inviteSuccess}</p>}
            </div>
          </div>
        </div>
      </div>

      {/*  Create Task Modal  */}
      {showCreateTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={resetTaskForm}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Create new Item</h2>
              <button
                onClick={resetTaskForm}
                className="p-1.5 text-gray-400 bg-gray-200 hover:text-gray-600 rounded-full transition"
              >
                <IoClose size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">
                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedType(option.value)}
                        className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition ${selectedType === option.value
                          ? option.activeColor
                          : `${option.color} border-transparent hover:border-gray-300`
                          }`}
                      >
                        <div className="text-2xl">{option.icon}</div>
                        <div className="text-sm font-semibold">{option.label}</div>
                        <div className="text-xs text-gray-600 text-center">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder={`Enter ${selectedType} title...`}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg
                      focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={4}
                    className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg
                      focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Assignee + Priority */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                    <select
                      value={assigneeId}
                      onChange={(e) => setAssigneeId(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>{m.profileName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as PriorityType)}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Due date + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due date</label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as ApiStatus)}
                      className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="TO_DO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </div>
                </div>

                {createError && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={resetTaskForm}
                  className="px-4 py-2 text-sm font-medium border border-gray-500 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-900 hover:bg-purple-800 disabled:opacity-60 rounded-lg transition"
                >
                  {creating ? "Creating..." : `Create ${selectedType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

export default ProjectHeader;