import { useState } from "react";
import { MdClose, MdAdd } from "react-icons/md";
import { FaLock, FaGlobe } from "react-icons/fa";
import { BiCheck } from "react-icons/bi";
import ProjectImage from "../../../assets/project-background.jpg";
import { projectApi } from "../../../api/services/projectApi";
import type { ProjectResponse } from "../../../api/contracts/project";
import { ToastContainer } from "../../common/ToastContainer";
import type { Toast } from "../../../types/project";

interface Props {
  open: boolean;
  onClose: () => void;
  displayName?: string;
  avatarUrl?: string;
  onProjectCreated?: (project: ProjectResponse) => void;
}

export function CreateProjectPanel({ open, onClose, onProjectCreated }: Props) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");  // ← thêm
  const [accessModifier, setAccessModifier] = useState<"public" | "private">("private");
  const [recentProjects, setRecentProjects] = useState<ProjectResponse[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(message: string, type: Toast["type"]) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleSubmit() {
    if (!projectName.trim()) {
      setError("Project name is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const created = await projectApi.create({
        projectName: projectName.trim(),
        description: description.trim() || undefined,  // ← thêm
      });
      setRecentProjects((p) => [created, ...p]);
      setProjectName("");
      setDescription("");  // ← reset
      setAccessModifier("private");
      onProjectCreated?.(created);
      addToast(`"${created.projectName}" created successfully!`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      setError(message);
      addToast(message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[80] bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-[90] h-full w-full max-w-xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white">
          <h2 className="text-base font-bold text-gray-800">Create Project</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="space-y-4">
            {/* Project name */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => { setProjectName(e.target.value); setError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                placeholder="e.g. Mobile App Dev"
                className={`w-full text-sm border-2 rounded-lg px-3 py-2 outline-none transition ${
                  error ? "border-red-400 focus:border-red-500" : "border-gray-300 focus:border-purple-500"
                }`}
              />
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            {/* Description ← thêm */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Description <span className="text-gray-300">optional</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this project about?"
                rows={3}
                className="w-full text-sm border-2 border-gray-300 rounded-lg px-3 py-2 outline-none transition focus:border-purple-500 resize-none"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["private", "public"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setAccessModifier(opt)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition text-left ${
                      accessModifier === opt
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {opt === "private"
                      ? <FaLock size={14} className={accessModifier === opt ? "text-purple-800" : "text-gray-400"} />
                      : <FaGlobe size={14} className={accessModifier === opt ? "text-purple-800" : "text-gray-400"} />
                    }
                    <div>
                      <p className={`text-sm font-medium capitalize ${accessModifier === opt ? "text-purple-700" : "text-gray-700"}`}>
                        {opt}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {opt === "private" ? "Only members can access" : "Anyone can view"}
                      </p>
                    </div>
                    {accessModifier === opt && (
                      <BiCheck className="ml-auto text-purple-800 shrink-0" size={18} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-900 hover:bg-purple-800 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              <MdAdd size={18} />
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>

          {/* Recently created */}
          {recentProjects.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Just Created
              </p>
              <div className="space-y-2">
                {recentProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">{p.projectName}</p>
                      {p.description && (
                        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{p.description}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-3 flex-shrink-0 ${
                      p.isPrivate ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"
                    }`}>
                      {p.isPrivate ? "Private" : "Public"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center pt-2 w-full">
              <img src={ProjectImage} className="size-80" alt="project" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}