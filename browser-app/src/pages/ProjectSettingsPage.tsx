import React, { useState, useEffect, useRef, startTransition } from "react";
import { useProject } from "../hooks/useProject";
import { useToast } from "../hooks/useToast";
import { issueTypeApi } from "../api/services/issueTypeApi";
import type { CreateIssueTypeRequest } from "../api/services/issueTypeApi";
import type { IssueTypeResponse, UserSummary } from "../api/contracts/issue";
import { issueTypeIcons } from "../types/project";
import { ToastContainer } from "../components/common/ToastContainer";
import {
  TrashIcon,
  CheckIcon,
  FolderIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FlagIcon } from "@heroicons/react/24/outline";
import { FaTasks } from "react-icons/fa";
import { projectApi } from "../api/services/projectApi";
import { projectStatusApi } from "../api/services/projectStatusApi";
import { WorkflowEditor } from "../project/workflow/WorkflowEditor";
import { avatarUrl } from "../utils/avatar";

const COLOR_PALETTE = [
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#64748B", // Slate
];

/** Reusable circular color palette picker used in both the status rename form and add-column form */
const ColorPalette = ({
  selected,
  onSelect,
  size = 5.5,
}: {
  selected: string;
  onSelect: (color: string) => void;
  size?: number;
}) => (
  <div className="flex flex-wrap gap-1">
    {COLOR_PALETTE.map((c) => (
      <button
        type="button"
        key={c}
        onClick={() => onSelect(c)}
        className="rounded-full transition flex items-center justify-center relative hover:scale-105"
        style={{
          backgroundColor: c,
          width: `${size * 4}px`,
          height: `${size * 4}px`,
        }}
        title={c}
      >
        {selected === c && (
          <CheckIcon
            className="text-white drop-shadow-sm w-4 h-4"
          />
        )}
      </button>
    ))}
  </div>
);

export default function ProjectSettingsPage() {
  const {
    projectId,
    project,
    issueTypes,
    reloadIssueTypes,
    refresh,
    projectStatuses,
    reloadStatuses,
    workflow,
    updateWorkflow,
  } = useProject();
  const { toasts, addToast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<"general" | "issues" | "members">(
    "general",
  );

  // Project Info editing states
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [savingProject, setSavingProject] = useState(false);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [tempProjectName, setTempProjectName] = useState("");
  const [isEditingProjectDesc, setIsEditingProjectDesc] = useState(false);
  const [tempProjectDesc, setTempProjectDesc] = useState("");

  // New Issue Type form states
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("bug");
  const [selectedColor, setSelectedColor] = useState("#EF4444");
  const [creatingType, setCreatingType] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [iconOptions, setIconOptions] = useState<
    { key: string; label: string }[]
  >([]);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  // Status Columns editing states
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusName, setEditingStatusName] = useState("");
  const [editingStatusColor, setEditingStatusColor] = useState("#64748B");

  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState("#64748B");
  const [addingCol, setAddingCol] = useState(false);

  // Workflow Editor visibility
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !newColName.trim()) return;
    if (projectStatuses.length >= 5) {
      addToast("Maximum of 5 columns allowed", "error");
      return;
    }
    setAddingCol(true);
    try {
      await projectStatusApi.create(projectId, {
        statusName: newColName.trim(),
        statusCategory: "IN_PROGRESS", // Custom columns default to IN_PROGRESS
        color: newColColor,
      });
      await reloadStatuses();
      setNewColName("");
      setNewColColor("#64748B");
      addToast("Column created successfully!", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to create column",
        "error",
      );
    } finally {
      setAddingCol(false);
    }
  };

  const updateProjectField = async (fields: {
    projectName?: string;
    description?: string;
  }) => {
    if (!projectId) return false;
    setSavingProject(true);
    try {
      const nextName =
        fields.projectName !== undefined ? fields.projectName : projectName;
      const nextDesc =
        fields.description !== undefined ? fields.description : projectDesc;
      await projectApi.update(projectId, {
        projectName: nextName,
        description: nextDesc,
      });
      if (fields.projectName !== undefined) {
        setProjectName(nextName);
        window.dispatchEvent(new CustomEvent("projectUpdated"));
      }
      if (fields.description !== undefined) {
        setProjectDesc(nextDesc);
      }
      refresh();
      return true;
    } catch {
      return false;
    } finally {
      setSavingProject(false);
    }
  };

  const handleSaveProjectName = async (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) {
      addToast("Project name cannot be empty", "error");
      return;
    }
    const success = await updateProjectField({ projectName: trimmed });
    if (success) {
      addToast("Project name updated successfully!", "success");
      setIsEditingProjectName(false);
    } else {
      addToast("Failed to update project name", "error");
    }
  };

  const handleSaveProjectDesc = async (newDesc: string) => {
    const success = await updateProjectField({ description: newDesc });
    if (success) {
      addToast("Project description updated successfully!", "success");
      setIsEditingProjectDesc(false);
    } else {
      addToast("Failed to update project description", "error");
    }
  };

  const handleStartRename = (
    statusId: string,
    currentName: string,
    currentColor: string,
  ) => {
    setEditingStatusId(statusId);
    setEditingStatusName(currentName);
    setEditingStatusColor(currentColor || "#64748B");
  };

  const handleSaveRename = async (statusId: string) => {
    if (!projectId || !editingStatusName.trim()) return;
    try {
      await projectStatusApi.update(projectId, statusId, {
        statusName: editingStatusName.trim(),
        color: editingStatusColor,
      });
      setEditingStatusId(null);
      await reloadStatuses();
      addToast("Column updated successfully!", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to update column",
        "error",
      );
    }
  };

  const handleSetGoalColumn = async (newGoalId: string) => {
    if (!projectId) return;
    const currentDoneCol = projectStatuses.find(
      (s) => s.statusCategory === "DONE",
    );
    if (currentDoneCol?.id === newGoalId) return;

    try {
      // 1. Update newly selected column to DONE
      await projectStatusApi.update(projectId, newGoalId, {
        statusCategory: "DONE",
      });

      // 2. Demote any other DONE columns to IN_PROGRESS
      const otherDoneCols = projectStatuses.filter(
        (s) => s.statusCategory === "DONE" && s.id !== newGoalId,
      );
      for (const col of otherDoneCols) {
        await projectStatusApi.update(projectId, col.id, {
          statusCategory: "IN_PROGRESS",
        });
      }

      await reloadStatuses();
      addToast("Goal column updated successfully!", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to update goal column",
        "error",
      );
    }
  };

  const handleDeleteColumnStatus = async (statusId: string) => {
    if (!projectId) return;
    const targetStatus = projectStatuses.find((s) => s.id === statusId);
    const otherColumns = projectStatuses.filter((s) => s.id !== statusId);
    if (otherColumns.length === 0) {
      addToast("Cannot delete the only status column", "error");
      return;
    }
    const fallbackId = otherColumns[0].id;
    try {
      // If the column being deleted is the Goal column (category === DONE), transfer Goal role to fallback column first
      if (targetStatus?.statusCategory === "DONE") {
        await projectStatusApi.update(projectId, fallbackId, {
          statusCategory: "DONE",
        });
      }

      await projectStatusApi.delete(projectId, statusId, {
        fallbackStatusId: fallbackId,
      });
      await reloadStatuses();
      addToast("Column deleted and tasks migrated successfully!", "success");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to delete column",
        "error",
      );
    }
  };

  useEffect(() => {
    if (project) {
      startTransition(() => {
        setProjectName(project.projectName || "");
        setProjectDesc(project.description || "");
      });
    }
  }, [project]);

  useEffect(() => {
    // Load supported icons from API
    issueTypeApi
      .getIcons()
      .then(setIconOptions)
      .catch((err) => console.error("Failed to load icon options", err));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        iconPickerRef.current &&
        !iconPickerRef.current.contains(e.target as Node)
      ) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleCreateIssueType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    const trimmed = typeName.trim();
    if (!trimmed) {
      addToast("Issue type name cannot be empty", "error");
      return;
    }

    setCreatingType(true);
    try {
      const payload: CreateIssueTypeRequest = {
        name: trimmed,
        description: typeDesc.trim() || undefined,
        iconKey: selectedIcon,
        color: selectedColor,
      };

      await issueTypeApi.create(projectId, payload);
      await reloadIssueTypes();

      addToast(`Issue type "${trimmed}" created successfully!`, "success");
      setTypeName("");
      setTypeDesc("");
      setSelectedIcon("bug");
      setSelectedColor("#EF4444");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to create issue type";
      addToast(errorMsg, "error");
    } finally {
      setCreatingType(false);
    }
  };

  const handleDeleteIssueType = async (id: string, name: string) => {
    if (!projectId) return;

    try {
      await issueTypeApi.delete(projectId, id);
      await reloadIssueTypes();
      addToast(`Issue type "${name}" deleted successfully!`, "success");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to delete issue type";
      addToast(errorMsg, "error");
    }
  };

  const customTypes = issueTypes.filter((t: IssueTypeResponse) => !t.isSystem);
  const isLimitReached = customTypes.length >= 3;

  return (
    <div className=" mx-auto px-6 py-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Side: Tabs Navigation */}
        <div className="w-full md:w-52 shrink-0 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
              activeTab === "general"
                ? " text-gray-700 font-semibold bg-gray-200/60 rounded-lg"
                : "text-gray-500 hover:text-gray-855 hover:bg-gray-50"
            }`}
          >
            <FolderIcon className="w-4 h-4" />
            General Settings
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
              activeTab === "issues"
                ? " text-gray-700 font-semibold bg-gray-200/60 rounded-lg"
                : "text-gray-500 hover:text-gray-855 hover:bg-gray-50"
            }`}
          >
            <FaTasks size={16} />
            Issue
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
              activeTab === "members"
                ? " text-gray-700 font-semibold bg-gray-200/60 rounded-lg"
                : "text-gray-500 hover:text-gray-855 hover:bg-gray-50"
            }`}
          >
            <UsersIcon className="w-4 h-4" />
            Project Members
          </button>
        </div>

        {/* Right Side: Tab Contents Panel */}
        <div className="flex-1 min-w-0">
          {activeTab === "general" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  General Settings
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Edit project name, description and basic info.
                </p>
              </div>

              <div className="space-y-6 w-full">
                {/* Project Name */}
                <div className="space-y-2 pb-4 border-b border-gray-100 w-full">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project Name
                  </label>
                  {isEditingProjectName ? (
                    <div className="flex items-center gap-2 w-full">
                      <input
                        type="text"
                        value={tempProjectName}
                        onChange={(e) => setTempProjectName(e.target.value)}
                        className="w-full px-3.5 py-1.5 border border-gray-500 rounded-md text-sm
                         focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition h-9 bg-white text-gray-800"
                        placeholder="Project Name"
                        maxLength={50}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveProjectName(tempProjectName)}
                        disabled={savingProject}
                        className="p-2 bg-purple-900 hover:bg-purple-800 text-white rounded-md transition cursor-pointer shrink-0 disabled:opacity-50"
                        title="Save"
                      >
                        <CheckIcon className="w-4.5 h-4.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProjectName(false)}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-md transition cursor-pointer shrink-0"
                        title="Cancel"
                      >
                        <XMarkIcon className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 py-1.5 group w-full">
                      <span className="text-sm text-gray-800 tracking-wide">
                        {projectName || (
                          <span className="text-gray-400 italic">
                            No name specified
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempProjectName(projectName);
                          setIsEditingProjectName(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-700 rounded-md transition cursor-pointer shrink-0"
                        title="Edit Project Name"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2 w-full">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Description
                  </label>
                  {isEditingProjectDesc ? (
                    <div className="space-y-2 w-full">
                      <textarea
                        value={tempProjectDesc}
                        onChange={(e) => setTempProjectDesc(e.target.value)}
                        rows={5}
                        className="w-full px-3.5 py-2 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition bg-white resize-none text-gray-700"
                        placeholder="Brief summary of this project..."
                        maxLength={1000}
                        autoFocus
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingProjectDesc(false)}
                          className="px-3 py-1.5  hover:bg-gray-100 text-gray-600 border border-gray-500 rounded-md text-xs transition cursor-pointer flex items-center gap-1"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveProjectDesc(tempProjectDesc)}
                          disabled={savingProject}
                          className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded-md text-xs transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4 py-1.5 group w-full">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed flex-1 mr-4">
                        {projectDesc || (
                          <span className="text-gray-400 italic">
                            No description specified
                          </span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setTempProjectDesc(projectDesc);
                          setIsEditingProjectDesc(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-purple-700 rounded-md transition cursor-pointer shrink-0 mt-0.5"
                        title="Edit Description"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "issues" && (
            <div className="space-y-6 flex flex-col gap-6">
              {/* Issue Types Configuration Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-gray-800">
                    Issue Types Configuration
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    Manage issue types in the project: {issueTypes.length}/6 (
                    {customTypes.length}/3 custom types added)
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Issue Types List */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Existing Issue Types
                    </h3>
                    <div className="divide-y divide-gray-100 max-h-95 overflow-y-auto pr-2">
                      {issueTypes.map((it: IssueTypeResponse) => {
                        const Icon =
                          issueTypeIcons[it.iconKey] || issueTypeIcons.task;
                        return (
                          <div
                            key={it.id}
                            className="py-3 flex items-start justify-between gap-4 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                                style={{ color: it.color }}
                              >
                                <Icon size={24} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-semibold text-gray-800 tracking-wide">
                                    {it.name}
                                  </h3>
                                  {it.isSystem ? (
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] tracking-wider ">
                                      System
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] tracking-wider ">
                                      Custom
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 select-all font-mono text-[10px] opacity-75">
                                  ID: {it.id}
                                </p>
                                {it.description && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {it.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {!it.isSystem && (
                              <button
                                onClick={() =>
                                  setTypeToDelete({ id: it.id, name: it.name })
                                }
                                className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                                title="Delete custom issue type"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Create Custom Issue Type Form */}
                  <div className="border-t lg:border-t-0 lg:border-l border-gray-100 pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-start">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Create Custom Issue Type
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                      Customize and append up to 3 additional issue types.
                    </p>

                    {isLimitReached ? (
                      <div className="p-4 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-md text-xs font-medium">
                        Maximum limit of 3 custom issue types reached. Delete a
                        custom type to add a new one.
                      </div>
                    ) : (
                      <form
                        onSubmit={handleCreateIssueType}
                        className="space-y-4 flex-1"
                      >
                        <div className="flex flex-col sm:flex-row items-start w-full gap-4">
                          {/* Select Icon Popover */}
                          <div
                            className="shrink-0 relative"
                            ref={iconPickerRef}
                          >
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Icon
                            </label>
                            {(() => {
                              const IconComponent =
                                issueTypeIcons[selectedIcon] ||
                                issueTypeIcons.task;
                              return (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowIconPicker((prev) => !prev)
                                    }
                                    className="flex items-center justify-center rounded-md bg-white hover:bg-gray-200 transition w-9.5 h-9 text-gray-700 cursor-pointer"
                                    title="Change Icon"
                                  >
                                    <IconComponent size={18} />
                                  </button>

                                  {showIconPicker && (
                                    <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 z-45 w-60">
                                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
                                        Select Icon
                                      </div>
                                      <div className="grid grid-cols-5 gap-1.5">
                                        {iconOptions.map((opt) => {
                                          const OptIcon =
                                            issueTypeIcons[opt.key] ||
                                            issueTypeIcons.task;
                                          const isSelected =
                                            selectedIcon === opt.key;
                                          return (
                                            <button
                                              type="button"
                                              key={opt.key}
                                              onClick={() => {
                                                setSelectedIcon(opt.key);
                                                setShowIconPicker(false);
                                              }}
                                              className={`p-2 rounded-lg flex items-center justify-center transition border cursor-pointer ${
                                                isSelected
                                                  ? "bg-purple-50 border-purple-500 text-purple-700 shadow-xs"
                                                  : "border-transparent text-gray-400 hover:text-gray-655 hover:bg-gray-50"
                                              }`}
                                              title={opt.label}
                                            >
                                              <OptIcon size={16} />
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          {/* Type Name */}
                          <div className="flex-1 w-full">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                              Type Name
                            </label>
                            <input
                              type="text"
                              value={typeName}
                              onChange={(e) => setTypeName(e.target.value)}
                              maxLength={50}
                              className="w-full px-3.5 py-1.5 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition bg-white"
                              placeholder="e.g. Bug, Feature, Support"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                            Description
                          </label>
                          <input
                            type="text"
                            value={typeDesc}
                            onChange={(e) => setTypeDesc(e.target.value)}
                            maxLength={200}
                            className="w-full px-3.5 py-1.5 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition bg-white"
                            placeholder="Brief description of when to use this type..."
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Pick Color
                          </label>
                          <ColorPalette
                            selected={selectedColor}
                            onSelect={setSelectedColor}
                            size={6.5}
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={creatingType}
                            className="py-1.5 px-4 bg-purple-900 hover:bg-purple-800 text-gray-200 rounded-md text-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                          >
                            {creatingType ? "Creating..." : "Create Issue Type"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Columns Configuration Section */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    Status Columns (Board Columns)
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Manage project status columns. You can have at most 5
                    columns (3 default + 2 custom).
                  </p>
                </div>

                {/* Dedicated Goal Column Configuration Card */}
                <div className="bg-gray-100 rounded-md p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <FlagIcon
                      className="text-green-600 shrink-0 animate-pulse w-5 h-5"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        Goal Status Column
                      </h3>
                      <p className="text-xs text-gray-500">
                        Choose which status column acts as the final completion
                        state (Goal) for dependencies and metrics.
                      </p>
                    </div>
                    <select
                      value={
                        projectStatuses.find((s) => s.statusCategory === "DONE")
                          ?.id || ""
                      }
                      onChange={(e) => handleSetGoalColumn(e.target.value)}
                      className="px-3 py-1.5 border border-gray-500 rounded-md text-sm bg-white text-gray-800 transition"
                    >
                      {projectStatuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.statusName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Columns List */}
                <div className="space-y-3">
                  {projectStatuses.map((s) => {
                    const isEditing = editingStatusId === s.id;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3.5 border border-gray-200 rounded-md bg-gray-50/50 hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex flex-col gap-2 w-full ">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full shrink-0"
                                  style={{
                                    backgroundColor: s.color || "#cbd5e1",
                                  }}
                                />
                                <input
                                  type="text"
                                  value={editingStatusName}
                                  onChange={(e) =>
                                    setEditingStatusName(e.target.value)
                                  }
                                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent bg-white text-gray-800 font-semibold w-full"
                                  maxLength={50}
                                  autoFocus
                                />
                                <div className="flex items-center justify-end w-full gap-1.5">
                                  {/* Check / Close chung hàng với input */}
                                  <button
                                    onClick={() => handleSaveRename(s.id)}
                                    className="p-1 text-green-600 hover:text-green-800 rounded hover:bg-gray-50 transition cursor-pointer shrink-0"
                                    title="Save"
                                  >
                                    <CheckIcon className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingStatusId(null)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition cursor-pointer shrink-0"
                                    title="Cancel"
                                  >
                                    <XMarkIcon className="w-4.5 h-4.5" />
                                  </button>
                                </div>
                              </div>
                              <ColorPalette
                                selected={editingStatusColor}
                                onSelect={setEditingStatusColor}
                                size={5.5}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor: s.color || "#cbd5e1",
                                }}
                              />
                              <span className="text-sm font-semibold text-gray-800 truncate">
                                {s.statusName}
                              </span>
                              {s.statusCategory === "DONE" && (
                                <FlagIcon
                                  className="text-green-600 shrink-0 w-4 h-4"
                                  title="Goal Column"
                                />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Inline Actions - chỉ còn khi KHÔNG editing */}
                        {!isEditing && (
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <button
                              onClick={() =>
                                handleStartRename(s.id, s.statusName, s.color)
                              }
                              className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition cursor-pointer"
                              title="Rename column"
                            >
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                            {/* Can delete columns as long as we have more than 1 column left */}
                            {projectStatuses.length > 1 && (
                              <button
                                onClick={() => handleDeleteColumnStatus(s.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-55 transition cursor-pointer"
                                title="Delete column and migrate tasks"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Status Column Form */}
                {projectStatuses.length < 5 ? (
                  <form
                    onSubmit={handleAddColumn}
                    className="border-t border-gray-100 pt-5 space-y-4"
                  >
                    <h3 className="text-sm font-semibold text-gray-700">
                      Add New Status Column
                    </h3>
                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Column Name
                        </label>
                        <input
                          type="text"
                          value={newColName}
                          onChange={(e) => setNewColName(e.target.value)}
                          maxLength={50}
                          placeholder="e.g. In Testing, Rejected"
                          className="w-full px-3 py-1.5 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition h-9 bg-white max-w-md"
                          required
                        />
                      </div>

                      {/* Color Accent Selection using Circle Palette */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Color Accent
                        </label>
                        <ColorPalette
                          selected={newColColor}
                          onSelect={setNewColColor}
                          size={6.5}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addingCol}
                        className="py-1.5 px-4 bg-purple-900 hover:bg-purple-800 text-gray-200 rounded-md text-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {addingCol ? "Adding..." : "Add Column"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-gray-100 text-gray-500 rounded-md text-xs italic">
                    Maximum limit of 5 columns reached (3 default and 2 custom).
                    You cannot create more status columns.
                  </div>
                )}
              </div>

              {/* Workflow Transitions Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    Workflow Transition Rules
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Define allowed movement rules between status columns to
                    enforce your team's workflow constraints.
                  </p>
                </div>
                <div className="bg-gray-100 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700">
                        Current Mode:
                      </span>
                      {workflow?.openWorkflow ? (
                        <span className="text-[10px] bg-gray-200 text-gray-700 rounded px-1.5 py-0.5 font-bold tracking-wider">
                          Open Workflow (Free Move)
                        </span>
                      ) : (
                        <span className="text-xs border-purple-200 rounded-xl px-2 py-0.5 bg-neutral-200  ">
                          Restricted Workflow (Rule Enforced)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 max-w-xl leading-relaxed">
                      Configure custom path rules (e.g. TO DO can only move to
                      IN PROGRESS, IN PROGRESS can only move to TESTING or
                      DONE).
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWorkflowEditor(true)}
                    className="shrink-0 py-1.5 px-3 bg-purple-900 hover:bg-purple-800 text-gray-200 rounded-md text-sm transition flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
                  >
                    Configure Workflow
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "members" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-base font-semibold text-gray-800">
                  Project Members
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  List of team members contributing to this project.
                </p>
              </div>

              <div className="overflow-hidden rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Name & Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(project?.members || []).map((m: UserSummary) => {
                      const initialAvatar = avatarUrl(m.profileName, m.picture);
                      const roleName = m.role
                        ? m.role.charAt(0).toUpperCase() +
                          m.role.slice(1).toLowerCase()
                        : "Member";
                      return (
                        <tr key={m.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <img
                                src={initialAvatar}
                                alt={m.profileName}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                                onError={(e) => {
                                  e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${m.profileName}`;
                                }}
                              />
                              <div>
                                <div className="text-sm text-gray-800">
                                  {m.profileName}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {m.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-800 bg-white border border-gray-200 rounded-lg px-2.5 py-1 select-none shadow-2xs">
                              {roleName}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {typeToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Delete Issue Type
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete "{typeToDelete.name}" issue type?
              This action cannot be undone and all related task data of this
              type will be affected.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setTypeToDelete(null)}
                className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 text-sm transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const { id, name } = typeToDelete;
                  setTypeToDelete(null);
                  handleDeleteIssueType(id, name);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showWorkflowEditor && (
        <WorkflowEditor
          open={showWorkflowEditor}
          onClose={() => setShowWorkflowEditor(false)}
          statuses={projectStatuses}
          currentTransitions={workflow ? workflow.transitions : []}
          isOpenWorkflow={workflow ? workflow.openWorkflow : true}
          onSave={updateWorkflow}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
