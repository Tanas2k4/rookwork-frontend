import React, { useState, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { MdOutlineExpandMore, MdCheck } from "react-icons/md";
// react-icons/fa removed as unused
import { useProject } from "../../hooks/useProject";
import { useToast } from "../../hooks/useToast";
import { avatarUrl } from "../../utils/avatar";
import { issueApi } from "../../api/services/issueApi";
import { RichTextEditor } from "../../components/common/RichTextEditor";
import type {
  PriorityType,
  UserSummary,
} from "../../api/contracts/issue";
import type { StatusCategory as ApiStatus } from "../../api/contracts/projectStatus";
import { type Priority, issueTypeIcons } from "../../types/project";

// Dynamic Issue types config loaded from ProjectContext

const STATUS_OPTIONS: { value: ApiStatus; label: string; dotColor: string }[] =
  [
    { value: "TO_DO", label: "To Do", dotColor: "bg-gray-400" },
    { value: "IN_PROGRESS", label: "In Progress", dotColor: "bg-blue-500" },
    { value: "DONE", label: "Done", dotColor: "bg-green-500" },
  ];

const PRIORITY_OPTIONS: {
  value: PriorityType;
  key: Priority;
  label: string;
  color: string;
  index: number;
}[] = [
  { value: "LOW", key: "low", label: "Low", color: "bg-green-500", index: 0 },
  {
    value: "MEDIUM",
    key: "medium",
    label: "Medium",
    color: "bg-yellow-500",
    index: 1,
  },
  {
    value: "HIGH",
    key: "high",
    label: "High",
    color: "bg-orange-500",
    index: 2,
  },
  {
    value: "URGENT",
    key: "urgent",
    label: "Urgent",
    color: "bg-purple-500",
    index: 3,
  },
];

const PRIORITIES_ORDER: PriorityType[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

interface CreateIssueModalProps {
  open: boolean;
  onClose: () => void;
}

// Removed file helper functions

export function CreateIssueModal({ open, onClose }: CreateIssueModalProps) {
  const { members, projectId, reloadIssues, issueTypes, projectStatuses } = useProject();
  const { addToast } = useToast();

  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [issueTitle, setIssueTitle] = useState("");

  const selectedTypeObj = issueTypes.find((t) => t.id === selectedTypeId);
  const selectedTypeName = selectedTypeObj
    ? selectedTypeObj.name.toLowerCase()
    : "issue";

  useEffect(() => {
    if (open && issueTypes.length > 0) {
      const taskType = issueTypes.find((t) => t.name.toUpperCase() === "TASK");
      if (taskType) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedTypeId(taskType.id);
      } else {
        setSelectedTypeId(issueTypes[0].id);
      }
    }
  }, [open, issueTypes]);
  const [issueDescription, setIssueDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<PriorityType>("MEDIUM");
  const [status, setStatus] = useState<ApiStatus>("TO_DO");
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Dropdown visibility toggles
  const [showStatusDd, setShowStatusDd] = useState(false);
  const [showPriorityDd, setShowPriorityDd] = useState(false);
  const [showAssigneeDd, setShowAssigneeDd] = useState(false);
  const [showTypeDd, setShowTypeDd] = useState(false);

  // Refs for closing dropdowns on outside click
  const statusDdRef = useRef<HTMLDivElement>(null);
  const priorityDdRef = useRef<HTMLDivElement>(null);
  const assigneeDdRef = useRef<HTMLDivElement>(null);
  const typeDdRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (statusDdRef.current && !statusDdRef.current.contains(target)) {
        setShowStatusDd(false);
      }
      if (priorityDdRef.current && !priorityDdRef.current.contains(target)) {
        setShowPriorityDd(false);
      }
      if (assigneeDdRef.current && !assigneeDdRef.current.contains(target)) {
        setShowAssigneeDd(false);
      }
      if (typeDdRef.current && !typeDdRef.current.contains(target)) {
        setShowTypeDd(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetForm = () => {
    setIssueTitle("");
    setIssueDescription("");
    if (issueTypes.length > 0) {
      const taskType = issueTypes.find((t) => t.name.toUpperCase() === "TASK");
      setSelectedTypeId(taskType ? taskType.id : issueTypes[0].id);
    }
    setDueDate("");
    setPriority("MEDIUM");
    setStatus("TO_DO");
    setAssigneeIds([]);
    setShowStatusDd(false);
    setShowPriorityDd(false);
    setShowAssigneeDd(false);
    setShowTypeDd(false);
    setCreateError("");
    onClose();
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !projectId) return;
    setCreating(true);
    setCreateError("");
    try {
      const deadlineISO = dueDate ? new Date(dueDate).toISOString() : undefined;
      const statusId = projectStatuses.find((ps) => ps.statusCategory === status)?.id;
      const created = await issueApi.create(projectId, {
        issueName: issueTitle.trim(),
        issueTypeId: selectedTypeId,
        priority,
        description: issueDescription.trim() || undefined,
        deadline: deadlineISO,
        statusId,
      });

      // Assign members if any selected
      if (assigneeIds.length > 0 && created.id) {
        await issueApi.update(projectId, created.id, {
          assigneeIds: assigneeIds,
        });
      }

      // Removed file upload

      addToast(`Created issue "${issueTitle.trim()}" successfully!`, "success");
      resetForm();
      reloadIssues();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error ? err.message : "Failed to create issue";
      addToast(errMsg, "error");
      setCreateError(errMsg);
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  const selectedStatusOpt =
    STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  const selectedPriorityOpt =
    PRIORITY_OPTIONS.find((o) => o.value === priority) || PRIORITY_OPTIONS[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={resetForm}
      />
      {/* Modal Card */}
      <div className="relative bg-white rounded-md shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Create new Issue</h2>
          <button
            onClick={resetForm}
            className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded-full transition"
          >
            <IoClose size={20} />
          </button>
        </div>

        <form
          onSubmit={handleCreateIssue}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Type & Title Row */}
            <div className="flex items-start gap-3">
              {/* Type Dropdown */}
              <div className="w-44 shrink-0 relative" ref={typeDdRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                {(() => {
                  const currentType = issueTypes.find(
                    (t) => t.id === selectedTypeId,
                  );
                  const Icon = currentType
                    ? issueTypeIcons[currentType.iconKey] || issueTypeIcons.task
                    : issueTypeIcons.task;
                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTypeDd((prev) => !prev);
                          setShowStatusDd(false);
                          setShowPriorityDd(false);
                          setShowAssigneeDd(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.75 border border-gray-500 rounded-md bg-white hover:bg-gray-50 text-sm  justify-between"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {currentType && (
                            <Icon
                              size={16}
                              style={{ color: currentType.color }}
                              className="shrink-0"
                            />
                          )}
                          <span className="truncate font-semibold uppercase text-xs tracking-wider text-gray-700">
                            {currentType ? currentType.name : "Select Type"}
                          </span>
                        </div>
                        <MdOutlineExpandMore
                          size={18}
                          className="text-gray-400 shrink-0"
                        />
                      </button>

                      {showTypeDd && (
                        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 z-40 max-h-60 overflow-y-auto">
                          {issueTypes.map((option) => {
                            const OptIcon =
                              issueTypeIcons[option.iconKey] ||
                              issueTypeIcons.task;
                            const isSelected = selectedTypeId === option.id;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTypeId(option.id);
                                  setShowTypeDd(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition ${
                                  isSelected
                                    ? "bg-purple-50 font-bold"
                                    : "text-gray-700"
                                }`}
                              >
                                <OptIcon
                                  size={14}
                                  style={{ color: option.color }}
                                  className="shrink-0"
                                />
                                <span className="uppercase tracking-wider truncate flex-1">
                                  {option.name}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Title Input */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={issueTitle}
                  onChange={(e) => setIssueTitle(e.target.value)}
                  placeholder={`Enter ${selectedTypeName} title...`}
                  className="w-full border border-gray-500 px-4 py-1.5 text-sm rounded-md 
                    focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <RichTextEditor
                initialValue={issueDescription}
                onChange={(val: string) => setIssueDescription(val)}
                placeholder="Add a description..."
                autoFocus={false}
              />
            </div>

            {/* Assignees + Priority */}
            <div className="grid grid-cols-2 gap-4">
              {/* Assignees (Multi-select) */}
              <div className="relative" ref={assigneeDdRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignees
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssigneeDd((prev) => !prev);
                    setShowStatusDd(false);
                    setShowPriorityDd(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-1.5 text-sm border border-gray-500 rounded-md bg-white 
                  hover:bg-gray-50"
                >
                  {assigneeIds.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="flex -space-x-1.5">
                        {assigneeIds.slice(0, 3).map((id) => {
                          const member = members.find(
                            (m: UserSummary) => m.id === id,
                          );
                          if (!member) return null;
                          return (
                            <img
                              key={id}
                              src={avatarUrl(
                                member.profileName,
                                member.picture,
                              )}
                              alt={member.profileName}
                              title={member.profileName}
                              className="w-5 h-5 rounded-full object-cover border border-white shrink-0"
                            />
                          );
                        })}
                        {assigneeIds.length > 3 && (
                          <span className="w-5 h-5 rounded-full bg-purple-100 border border-white flex items-center justify-center text-[9px] font-bold text-purple-700 shrink-0">
                            +{assigneeIds.length - 3}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 truncate max-w-30">
                        {assigneeIds.length === 1
                          ? members.find(
                              (m: UserSummary) => m.id === assigneeIds[0],
                            )?.profileName
                          : `${assigneeIds.length} assignees`}
                      </span>
                    </div>
                  ) : (
                    <span className="italic text-gray-400">Unassigned</span>
                  )}
                  <MdOutlineExpandMore
                    size={16}
                    className="text-gray-400 shrink-0 ml-auto"
                  />
                </button>

                {showAssigneeDd && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 w-full max-h-56 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setAssigneeIds([])}
                      className="w-full text-left px-3 py-1.5 text-sm text-gray-500 italic hover:bg-gray-50 flex items-center gap-2"
                    >
                      <div className="p-1 bg-gray-200 rounded-full flex items-center justify-center">
                        <IoClose size={12} className="text-gray-500" />
                      </div>
                      Unassigned (clear all)
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    {members.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-400 italic">
                        No members found
                      </p>
                    ) : (
                      members.map((member: UserSummary) => {
                        const isSelected = assigneeIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setAssigneeIds((prev) =>
                                  prev.filter((id) => id !== member.id),
                                );
                              } else {
                                setAssigneeIds((prev) => [...prev, member.id]);
                              }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 flex items-center gap-2 ${
                              isSelected
                                ? "font-medium bg-purple-50/50 text-purple-700"
                                : "text-gray-700"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                                isSelected
                                  ? "bg-purple-900 border-purple-900"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <MdCheck size={11} className="text-white" />
                              )}
                            </span>
                            <img
                              src={avatarUrl(
                                member.profileName,
                                member.picture,
                              )}
                              className="w-5 h-5 rounded-full object-cover shrink-0"
                              alt=""
                            />
                            <span className="truncate flex-1">
                              {member.profileName}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Priority Selector */}
              <div className="relative" ref={priorityDdRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowPriorityDd((prev) => !prev);
                    setShowStatusDd(false);
                    setShowAssigneeDd(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-1.5 text-sm border border-gray-500 rounded-md bg-white hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2.5">
                    <span>{selectedPriorityOpt.label}</span>
                    <div className="flex gap-0.5 h-1.5 w-14">
                      {PRIORITIES_ORDER.map((p, idx) => {
                        const opt = PRIORITY_OPTIONS.find(
                          (o) => o.value === p,
                        )!;
                        const isActive = idx <= selectedPriorityOpt.index;
                        return (
                          <div
                            key={p}
                            className={`flex-1 rounded-sm ${
                              isActive ? opt.color : "bg-gray-200"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <MdOutlineExpandMore
                    size={16}
                    className="text-gray-400 shrink-0 ml-auto"
                  />
                </button>

                {showPriorityDd && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 w-full max-h-56 overflow-y-auto">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setPriority(opt.value);
                          setShowPriorityDd(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 flex items-center gap-2.5 ${
                          priority === opt.value
                            ? "text-purple-700 font-medium bg-purple-50/30"
                            : "text-gray-700"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${opt.color}`} />
                        <span className="flex-1 text-left">{opt.label}</span>
                        <div className="flex gap-0.5 h-1.5 w-14 shrink-0">
                          {PRIORITIES_ORDER.map((p, idx) => {
                            const pOpt = PRIORITY_OPTIONS.find(
                              (o) => o.value === p,
                            )!;
                            const isActive = idx <= opt.index;
                            return (
                              <div
                                key={p}
                                className={`flex-1 rounded-sm ${
                                  isActive ? pOpt.color : "bg-gray-200"
                                }`}
                              />
                            );
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Due date + Status */}
            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-1.5 text-sm border border-gray-500 rounded-md"
                />
              </div>

              {/* Status Selector */}
              <div className="relative" ref={statusDdRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusDd((prev) => !prev);
                    setShowPriorityDd(false);
                    setShowAssigneeDd(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-1.5 text-sm border border-gray-500 rounded-md bg-white hover:bg-gray-50 text-left cursor-pointer "
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${selectedStatusOpt.dotColor}`}
                    />
                    <span>{selectedStatusOpt.label}</span>
                  </div>
                  <MdOutlineExpandMore
                    size={16}
                    className="text-gray-400 shrink-0 ml-auto"
                  />
                </button>

                {showStatusDd && (
                  <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20 w-full max-h-56 overflow-y-auto">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setStatus(opt.value);
                          setShowStatusDd(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm hover:bg-purple-50 flex items-center gap-2 ${
                          status === opt.value
                            ? "text-purple-700 font-medium bg-purple-50/30"
                            : "text-gray-700"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${opt.dotColor}`}
                        />
                        <span className="flex-1 text-left">{opt.label}</span>
                        {status === opt.value && (
                          <MdCheck
                            size={16}
                            className="text-purple-700 shrink-0 ml-auto"
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Removed Attachments field per user request */}

            {createError && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-md">
                {createError}
              </p>
            )}
          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-1.5 text-sm font-medium border border-gray-500 text-gray-700 hover:bg-gray-200 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-1.75 text-sm text-white bg-purple-900 hover:bg-purple-800 disabled:opacity-60 rounded-md transition"
            >
              {creating ? "Creating..." : `Create ${selectedTypeName}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
