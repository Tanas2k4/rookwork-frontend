import { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { ProjectContext } from "../../context/ProjectContext";
import { issueApi } from "../../api/services/issueApi";
import { issueToTask } from "../../utils/issueMapper";
import type { Task } from "../../types/project";
import type { AttachmentResponse } from "../../api/contracts/attachment";
import { RiDownload2Line, RiFolder2Fill } from "react-icons/ri";
import { IoSearchOutline } from "react-icons/io5";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../../components/common/ToastContainer";
import { DriveFileCard } from "./DriveFileCard";
import type { FlatFile } from "./DriveFileCard";
import { FileDetailSidebar } from "./FileDetailSidebar";
import { formatBytes, getFileIcon } from "./storageUtils";

export default function ProjectFilesView() {
  const {
    projectId,
    project,
    issueUpdateTick,
    openIssueModal,
    notifyIssueUpdated,
  } = useContext(ProjectContext);
  const location = useLocation();
  const [tasks, setTasks] = useState<(Task & { _uuid: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderUuid, setSelectedFolderUuid] = useState<string | null>(
    null,
  );
  const [selectedFileDetail, setSelectedFileDetail] = useState<FlatFile | null>(
    null,
  );
  const [draggedOverFolderUuid, setDraggedOverFolderUuid] = useState<
    string | null
  >(null);
  const [draggedOverContent, setDraggedOverContent] = useState<boolean>(false);
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] =
    useState<boolean>(false);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    const state = location.state as { folderUuid?: string } | null;
    if (state?.folderUuid) {
      setSelectedFolderUuid(state.folderUuid);
    }
  }, [location.state]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    issueApi
      .getAll(projectId)
      .then((issues) => {
        if (cancelled) return;
        const mapped = issues.map((i) => issueToTask(i, issues));
        setTasks(mapped);
      })
      .catch((err) =>
        addToast(
          err instanceof Error ? err.message : "Failed to load files",
          "error",
        ),
      );

    return () => {
      cancelled = true;
    };
  }, [projectId, issueUpdateTick, addToast]);

  // Map users to avatars
  const userAvatarMap: Record<string, string> = {};
  tasks.forEach((t) => {
    (t.assigned_to || []).forEach((u) => {
      if (u.display_name) {
        userAvatarMap[u.display_name.toLowerCase()] = u.avt;
      }
    });
  });

  function getUserAvatar(username: string) {
    if (!username) return null;
    const name = username.trim();
    const initials = name.charAt(0).toUpperCase();

    const colors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-amber-500",
      "bg-green-500",
      "bg-teal-500",
      "bg-blue-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-rose-500",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const color = colors[colorIndex];

    const avatarUrl = userAvatarMap[name.toLowerCase()];

    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={name}
          className="w-5 h-5 rounded-full object-cover border border-white shrink-0 shadow-xs"
          title={name}
        />
      );
    }

    return (
      <div
        className={`w-5 h-5 rounded-full border border-white flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-xs ${color}`}
        title={name}
      >
        {initials}
      </div>
    );
  }

  const handleDropOnFolder = async (
    e: React.DragEvent,
    targetIssueUuid: string,
  ) => {
    e.preventDefault();
    setDraggedOverFolderUuid(null);

    if (!projectId) return;

    // 1. Check if dragging files from the computer (local files)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      addToast(`Uploading ${filesArray.length} file(s) to folder...`, "info");

      try {
        await issueApi.uploadAttachments(
          projectId,
          targetIssueUuid,
          filesArray,
        );
        addToast("Files uploaded successfully!", "success");
        notifyIssueUpdated();
      } catch (err) {
        addToast(
          err instanceof Error ? err.message : "Failed to upload files",
          "error",
        );
      }
      return;
    }

    // 2. Dragging a file within the app
    const fileId = e.dataTransfer.getData("text/plain");
    const sourceTaskUuid = e.dataTransfer.getData(
      "application/source-task-uuid",
    );

    if (!fileId || !sourceTaskUuid) return;

    // If source and target are the same, do nothing
    if (sourceTaskUuid === targetIssueUuid) return;

    addToast("Moving file to target folder...", "info");
    try {
      await issueApi.moveAttachment(
        projectId,
        sourceTaskUuid,
        fileId,
        targetIssueUuid,
      );
      addToast("File moved successfully!", "success");
      notifyIssueUpdated();
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Failed to move file",
        "error",
      );
    }
  };

  // Group and sort logic
  const query = searchQuery.trim().toLowerCase();

  const tasksWithFiles = tasks.filter(
    (t) => t.attachments && t.attachments.length > 0,
  );
  const selectedFolder = tasksWithFiles.find(
    (t) => t._uuid === selectedFolderUuid,
  );

  const flatFilesList: FlatFile[] = tasksWithFiles.flatMap((task) =>
    (task.attachments || []).map((file) => ({
      ...file,
      taskUuid: task._uuid,
      taskTitle: task.title,
      taskType: task.type,
    })),
  );

  // Filter files
  const filteredFiles = flatFilesList.filter((file) => {
    const matchesSearch =
      file.originalName.toLowerCase().includes(query) ||
      file.taskTitle.toLowerCase().includes(query) ||
      file.uploadedBy.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (fileTypeFilter === "all") return true;

    const ext = file.originalName.split(".").pop()?.toLowerCase() || "";
    if (fileTypeFilter === "images") {
      return ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext);
    }
    if (fileTypeFilter === "documents") {
      return ["pdf", "doc", "docx", "txt", "md", "pptx"].includes(ext);
    }
    if (fileTypeFilter === "spreadsheets") {
      return ["xls", "xlsx", "csv"].includes(ext);
    }
    if (fileTypeFilter === "others") {
      const isKnownType = [
        "png",
        "jpg",
        "jpeg",
        "gif",
        "svg",
        "webp",
        "pdf",
        "doc",
        "docx",
        "txt",
        "md",
        "pptx",
        "xls",
        "xlsx",
        "csv",
      ].includes(ext);
      return !isKnownType;
    }
    return true;
  });

  const filterFolderAttachments = (
    attachments: AttachmentResponse[] | undefined,
  ) => {
    return (attachments || []).filter((file) => {
      const matchesSearch =
        query === "" || file.originalName.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (fileTypeFilter === "all") return true;

      const ext = file.originalName.split(".").pop()?.toLowerCase() || "";
      if (fileTypeFilter === "images") {
        return ["png", "jpg", "jpeg", "gif", "svg", "webp"].includes(ext);
      }
      if (fileTypeFilter === "documents") {
        return ["pdf", "doc", "docx", "txt", "md", "pptx"].includes(ext);
      }
      if (fileTypeFilter === "spreadsheets") {
        return ["xls", "xlsx", "csv"].includes(ext);
      }
      if (fileTypeFilter === "others") {
        const isKnownType = [
          "png",
          "jpg",
          "jpeg",
          "gif",
          "svg",
          "webp",
          "pdf",
          "doc",
          "docx",
          "txt",
          "md",
          "pptx",
          "xls",
          "xlsx",
          "csv",
        ].includes(ext);
        return !isKnownType;
      }
      return true;
    });
  };

  const recentUploads = [...flatFilesList]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const totalUsedBytes = flatFilesList.reduce((acc, f) => acc + f.sizeBytes, 0);
  const MAX_STORAGE_BYTES = 3.6 * 1024 * 1024 * 1024;
  const usedPercentage = Math.min(
    (totalUsedBytes / MAX_STORAGE_BYTES) * 100,
    100,
  );

  return (
    <div className="font-heading w-full min-h-full bg-gray-55 py-6 px-8 flex flex-col select-none">
      {/* Search top bar */}
      <div className="flex items-center gap-3 mb-2 ">
        <div className="relative w-80">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-500 rounded-lg pl-9 pr-3 py-1.5 text-sm
              focus:outline-none focus:border-none focus:ring-1 focus:ring-purple-800 focus:border-purple-800 transition"
          />
        </div>

        {/* Custom File Type Filter Dropdown */}
        <div className="relative shrink-0 select-none">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className="flex items-center justify-between bg-white border border-gray-500 text-gray-700 text-sm rounded-lg pl-3 pr-2.5 py-1.5 focus:outline-none hover:border-purple-800 focus:border-purple-800 transition cursor-pointer gap-2 w-36"
          >
            <span>
              {fileTypeFilter === "all" && "All File Types"}
              {fileTypeFilter === "images" && "Images"}
              {fileTypeFilter === "documents" && "Documents"}
              {fileTypeFilter === "spreadsheets" && "Spreadsheets"}
              {fileTypeFilter === "others" && "Others"}
            </span>
            <svg
              className={`fill-current h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${
                isFilterDropdownOpen ? "rotate-180" : ""
              }`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </button>

          {isFilterDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsFilterDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1.5 w-40 bg-white border border-gray-200 rounded-lg shadow-md z-50 py-1 overflow-hidden">
                {[
                  { value: "all", label: "All File Types" },
                  { value: "images", label: "Images" },
                  { value: "documents", label: "Documents" },
                  { value: "spreadsheets", label: "Spreadsheets" },
                  { value: "others", label: "Others" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setFileTypeFilter(opt.value);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs transition cursor-pointer ${
                      fileTypeFilter === opt.value
                        ? "bg-purple-50 text-purple-800 font-bold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Storage progress bar */}
        <div className="ml-auto flex flex-col gap-1.5 w-64 select-none">
          <div className="flex justify-between text-[11px] text-gray-500">
            <span>Storage Used</span>
            <span className="font-bold text-gray-800">
              {formatBytes(totalUsedBytes)} of 3.6 GB
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200">
            <div
              className="bg-purple-800 h-full rounded-full transition-all duration-500"
              style={{ width: `${usedPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column - 75% width */}
        <div className="flex-1 min-w-0 w-full">
          {/* Breadcrumbs / Navigation */}
          <div className="flex items-center pt-2 gap-2 text-sm text-gray-500 select-none">
            <button
              onClick={() => setSelectedFolderUuid(null)}
              className="hover:text-purple-800 hover:underline font-semibold text-gray-650 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RiFolder2Fill className="text-gray-400" size={15} />
              {project?.projectName ? project.projectName : "Project"}
            </button>
            {selectedFolderUuid && selectedFolder && (
              <>
                <span className="text-gray-300">/</span>
                <span className="font-bold text-gray-900 truncate max-w-50 sm:max-w-xs md:max-w-md">
                  {selectedFolder.title}
                </span>
                <span className="text-[11px] text-gray-400 font-normal">
                  ({selectedFolder.attachments?.length || 0} files)
                </span>
              </>
            )}
          </div>

          {selectedFolderUuid && selectedFolder ? (
            /* Folder Content Grid */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDraggedOverContent(true);
              }}
              onDragLeave={() => setDraggedOverContent(false)}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnFolder(e, selectedFolderUuid);
                setDraggedOverContent(false);
              }}
              className={` ${draggedOverContent ? "border-purple-800 bg-purple-50/10 ring-purple-400" : ""} px-6 py-4 rounded-xl transition duration-200`}
            >
              {(() => {
                const folderAttachmentsFiltered = filterFolderAttachments(
                  selectedFolder.attachments,
                );
                return folderAttachmentsFiltered.length === 0 ? (
                  <div className="text-center py-16 text-xs text-gray-400 italic">
                    No matching files in this folder.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
                    {folderAttachmentsFiltered.map((file) => (
                      <DriveFileCard
                        key={file.id}
                        file={{
                          ...file,
                          taskUuid: selectedFolder._uuid,
                          taskTitle: selectedFolder.title,
                          taskType: selectedFolder.type,
                        }}
                        getUserAvatar={getUserAvatar}
                        onClickCard={setSelectedFileDetail}
                        isSelected={selectedFileDetail?.id === file.id}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Section 3: Folders Grid */
            tasksWithFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 py-4">
                {tasksWithFiles.map((group) => {
                  return (
                    <div
                      key={group._uuid}
                      onClick={() => setSelectedFolderUuid(group._uuid)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDraggedOverFolderUuid(group._uuid);
                      }}
                      onDragLeave={() => setDraggedOverFolderUuid(null)}
                      onDrop={(e) => handleDropOnFolder(e, group._uuid)}
                      className={`group bg-white border ${
                        draggedOverFolderUuid === group._uuid
                          ? "border-purple-800"
                          : "border-gray-200 hover:border-purple-800"
                      } rounded-xl overflow-hidden transition-all flex flex-col h-52 relative cursor-pointer`}
                    >
                      {/* Card Header (Folder Title) */}
                      <div className="h-11  bg-gray-50 border-b border-gray-200 px-3 flex items-center gap-2 select-none">
                        <RiFolder2Fill
                          className="text-amber-500 shrink-0"
                          size={16}
                        />
                        <span
                          className="text-[11px] font-bold text-gray-755 truncate flex-1 hover:text-purple-800 block min-w-0"
                          title={group.title}
                        >
                          {group.title}
                        </span>
                      </div>

                      {/* Card Preview Body */}
                      <div className="flex-1 bg-gray-100/50 flex items-center justify-center p-3 relative overflow-hidden">
                        {/* Yellow Folder Graphic */}
                        <div
                          className="w-16 h-12 bg-amber-400 rounded-r-md rounded-bl-md relative border border-amber-500
                          before:content-[''] before:absolute before:-top-1.5 before:left-0 before:w-6 before:h-2 before:bg-amber-500 before:rounded-t-sm"
                        >
                          <div className="absolute inset-x-1 bottom-1 top-2 bg-amber-100 rounded-xs flex items-center justify-center">
                            <RiFolder2Fill
                              className="text-amber-400"
                              size={16}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer (File Count) */}
                      <div className="h-10 px-3 bg-white border-t border-gray-200 flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                          {group.attachments?.length || 0} files
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Section 2: All files list */}
          <div className="space-y-3 pt-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              All Attachments
            </h2>
            {filteredFiles.length === 0 ? (
              <div className="bg-gray-55 p-8 text-center text-sm text-gray-400 italic">
                No attachments found.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredFiles.map((file) => {
                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileDetail(file)}
                      draggable={true}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", file.id);
                        e.dataTransfer.setData(
                          "application/source-task-uuid",
                          file.taskUuid,
                        );
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className={`group bg-white border ${selectedFileDetail?.id === file.id ? "border-purple-800" : "border-gray-200 hover:border-purple-800"} rounded-xl p-3.5 flex items-center justify-between transition relative overflow-visible cursor-pointer`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {getFileIcon(file.originalName)}
                        <a
                          href={file.presignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[12px] font-bold text-gray-700 hover:text-purple-800 hover:underline truncate min-w-0 flex-1"
                          title={file.originalName}
                        >
                          {file.originalName}
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 px-4">
                        {getUserAvatar(file.uploadedBy)}
                        <span
                          className="text-[11px] text-gray-650  hidden sm:inline"
                          title={file.uploadedBy}
                        >
                          {file.uploadedBy}
                        </span>
                      </div>

                      <div className="hidden lg:block shrink-0 px-4">
                        <button
                          onClick={() => openIssueModal(file.taskUuid)}
                          className="text-[10px] text-purple-800  hover:text-purple-700 hover:underline transition truncate max-w-22.5 cursor-pointer"
                          title={`View task details: ${file.taskTitle}`}
                        >
                          ../{file.taskTitle}/
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-4">
                        <a
                          href={file.presignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-800 p-1"
                          title="Download file"
                        >
                          <RiDownload2Line size={15} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - 25% width */}
        <div className="w-full lg:w-80 shrink-0 space-y-8  lg:bg-transparent p-4  rounded-2xl ">
          {/* File Details Sidebar Component */}
          <FileDetailSidebar
            selectedFileDetail={selectedFileDetail}
            openIssueModal={openIssueModal}
            getUserAvatar={getUserAvatar}
          />

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Recent Uploads
            </h2>
            <div className="space-y-3">
              {recentUploads.length === 0 ? (
                <div className="text-xs text-gray-400 italic">
                  No files uploaded yet.
                </div>
              ) : (
                recentUploads.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileDetail(file)}
                    className={`flex items-center justify-between border rounded-xl p-3 cursor-pointer transition ${selectedFileDetail?.id === file.id ? "bg-purple-50/30 border-purple-800" : "bg-white border-gray-200 hover:border-purple-800"}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="p-1.5 bg-gray-50 rounded-lg shrink-0">
                        {getFileIcon(file.originalName)}
                      </div>
                      <div className="min-w-0">
                        <a
                          href={file.presignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="block text-xs font-bold text-gray-700 hover:text-purple-800 hover:underline truncate min-w-0"
                          title={file.originalName}
                        >
                          {file.originalName}
                        </a>
                        <span className="block text-[9px] text-gray-450 mt-0.5">
                          {formatBytes(file.sizeBytes)} • {file.uploadedBy}
                        </span>
                      </div>
                    </div>
                    <a
                      href={file.presignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-gray-800 p-1 shrink-0 ml-2"
                      title="Download file"
                    >
                      <RiDownload2Line size={14} />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
}
