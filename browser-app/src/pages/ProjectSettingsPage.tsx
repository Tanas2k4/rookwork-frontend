import React, { useState, useEffect, useRef } from "react";
import { useProject } from "../hooks/useProject";
import { useToast } from "../hooks/useToast";
import { issueTypeApi } from "../api/services/issueTypeApi";
import type { CreateIssueTypeRequest } from "../api/services/issueTypeApi";
import type { IssueTypeResponse, UserSummary } from "../api/contracts/issue";
import { issueTypeIcons } from "../types/project";
import { ToastContainer } from "../components/common/ToastContainer";
import {
  FaTrash,
  FaCheck,
  FaRegFolder,
  FaTasks,
  FaUsers,
} from "react-icons/fa";
import { projectApi } from "../api/services/projectApi";
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

export default function ProjectSettingsPage() {
  const { projectId, project, issueTypes, reloadIssueTypes, refresh } =
    useProject();
  const { toasts, addToast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<"general" | "issues" | "members">(
    "general",
  );

  // Project Info editing states
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [savingProject, setSavingProject] = useState(false);

  // New Issue Type form states
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("bug");
  const [selectedColor, setSelectedColor] = useState("#EF4444");
  const [creatingType, setCreatingType] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState<{ id: string; name: string } | null>(null);

  // Icon options
  const [iconOptions, setIconOptions] = useState<
    { key: string; label: string }[]
  >([]);

  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjectName(project.projectName || "");
      /// eslint-disable-next-line react-hooks/set-state-in-effect
      setProjectDesc(project.description || "");
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

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    const trimmed = projectName.trim();
    if (!trimmed) {
      addToast("Project name cannot be empty", "error");
      return;
    }
    setSavingProject(true);
    try {
      await projectApi.update(projectId, {
        projectName: trimmed,
        description: projectDesc,
      });
      refresh();
      addToast("Project settings updated successfully!", "success");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to update project settings";
      addToast(errorMsg, "error");
    } finally {
      setSavingProject(false);
    }
  };

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
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm  transition ${
              activeTab === "general"
                ? " text-purple-700 "
                : "text-gray-500 hover:text-gray-855 hover:bg-gray-50"
            }`}
          >
            <FaRegFolder size={16} />
            General Settings
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
              activeTab === "issues"
                ? " text-purple-700 "
                : "text-gray-500 hover:text-gray-855 hover:bg-gray-50"
            }`}
          >
            <FaTasks size={16} />
            Issue Types
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition ${
              activeTab === "members"
                ? " text-purple-700 "
                : "text-gray-500 hover:text-gray-855 hover:bg-gray-50"
            }`}
          >
            <FaUsers size={16} />
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

              <form
                onSubmit={handleUpdateProject}
                className="space-y-4 w-full"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3.5 py-1.5 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition"
                    placeholder="e.g. My Awesome Project"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    rows={5}
                    className="w-full px-3.5 py-2 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition resize-none"
                    placeholder="Brief summary of this project..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingProject}
                    className="py-2 px-4 bg-purple-900 hover:bg-purple-800 text-gray-200 font-medium rounded-md text-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingProject ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "issues" && (
            <div className="space-y-6">
              {/* Issue Type List */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 ">
                <div>
                  <h2 className="text-base font-semibold text-gray-800">
                    Issue Types
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    Manage issue types in the project: {issueTypes.length}/6 (
                    {customTypes.length}/3 custom types added)
                  </p>
                </div>

                <div className="divide-y divide-gray-100 mt-4">
                  {issueTypes.map((it: IssueTypeResponse) => {
                    const Icon =
                      issueTypeIcons[it.iconKey] || issueTypeIcons.task;
                    return (
                      <div
                        key={it.id}
                        className="py-4 flex items-start justify-between gap-4 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 "
                            style={{
                              color: it.color,
                            }}
                          >
                            <Icon size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
                                {it.name}
                              </h3>
                              {it.isSystem ? (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-gray-105 text-gray-500 border border-gray-200">
                                  System
                                </span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                                  Custom
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 select-all font-mono text-[10px] opacity-75">
                              ID: {it.id}
                            </p>
                            {it.description && (
                              <p className="text-xs text-gray-400 mt-1">
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
                            <FaTrash size={13} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Create Custom Issue Type Form */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 ">
                <h2 className="text-base font-semibold text-gray-800">
                  Create Custom Issue Type
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Customize and append up to 3 additional issue types.
                </p>

                {isLimitReached ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-md text-xs font-medium mt-4">
                    Maximum limit of 3 custom issue types reached. Delete a
                    custom type to add a new one.
                  </div>
                ) : (
                  <form
                    onSubmit={handleCreateIssueType}
                    className="space-y-5 mt-4"
                  >
                    <div className="flex flex-col md:flex-row items-start w-full gap-4">
                      {/* Select Icon Popover */}
                      <div className="shrink-0 relative" ref={iconPickerRef}>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                          Icon
                        </label>
                        {(() => {
                          const IconComponent = issueTypeIcons[selectedIcon] || issueTypeIcons.task;
                          return (
                            <>
                              <button
                                type="button"
                                onClick={() => setShowIconPicker((prev) => !prev)}
                                className="flex items-center justify-center border border-gray-500 rounded-md bg-white hover:bg-gray-50 transition w-9.5 h-9 text-gray-700 cursor-pointer"
                                title="Change Icon"
                              >
                                <IconComponent size={18} />
                              </button>

                              {showIconPicker && (
                                <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg p-2.5 z-40 w-60">
                                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 px-0.5">
                                    Select Icon
                                  </div>
                                  <div className="grid grid-cols-5 gap-1.5">
                                    {iconOptions.map((opt) => {
                                      const OptIcon = issueTypeIcons[opt.key] || issueTypeIcons.task;
                                      const isSelected = selectedIcon === opt.key;
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
                          className="w-full px-3.5 py-1.5 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition h-9"
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
                        className="w-full px-3.5 py-1.5 border border-gray-500 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="Brief description of when to use this type..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Pick Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PALETTE.map((c) => {
                          const isSelected = selectedColor === c;
                          return (
                            <button
                              type="button"
                              key={c}
                              onClick={() => setSelectedColor(c)}
                              className="w-7 h-7 rounded-full transition flex items-center justify-center relative hover:scale-105"
                              style={{ backgroundColor: c }}
                            >
                              {isSelected && (
                                <FaCheck
                                  size={10}
                                  className="text-white drop-shadow-sm"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={creatingType}
                        className="py-2 px-4 bg-purple-900 hover:bg-purple-800 text-gray-200 rounded-md text-sm transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {creatingType ? "Creating..." : "Create Issue Type"}
                      </button>
                    </div>
                  </form>
                )}
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
              Are you sure you want to delete "{typeToDelete.name}" issue type? This action cannot be undone and all related task data of this type will be affected.
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

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
