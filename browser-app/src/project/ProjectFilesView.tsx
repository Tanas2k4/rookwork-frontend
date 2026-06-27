import { useState, useEffect, useContext } from "react";
import { ProjectContext } from "../context/ProjectContext";
import { issueApi } from "../api/services/issueApi";
import { issueToTask } from "../utils/issueMapper";
import type { Task } from "../types/project";
import {
  RiAttachment2,
  RiFilePdfLine,
  RiFileExcelLine,
  RiFileTextLine,
  RiImageLine,
  RiFileZipLine,
  RiFileWordLine,
  RiDownload2Line,
  RiFolder2Fill,
  RiStarLine,
  RiStarFill,
} from "react-icons/ri";
import { IoSearchOutline } from "react-icons/io5";
import { FaTasks, FaBook, FaRocket } from "react-icons/fa";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "../components/common/ToastContainer";

interface FlatFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
  presignedUrl: string;
  taskUuid: string;
  taskTitle: string;
  taskType: string;
}

// Reusable Google Drive-style File Card
interface DriveFileCardProps {
  file: FlatFile;
  isStarred: boolean;
  onToggleStar: (id: string) => void;
  getFileIcon: (name: string) => React.ReactNode;
  getFileLargeIcon: (name: string) => React.ReactNode;
  isImageFile: (name: string) => boolean;
  formatBytes: (bytes: number) => string;
  getUserAvatar: (name: string) => React.ReactNode;
  openIssueModal?: (uuid: string) => void;
  showFolderBadge?: boolean;
  onClickCard?: (file: FlatFile) => void;
  isSelected?: boolean;
}

function DriveFileCard({
  file,
  isStarred,
  onToggleStar,
  getFileIcon,
  getFileLargeIcon,
  isImageFile,
  formatBytes,
  getUserAvatar,
  openIssueModal,
  showFolderBadge = false,
  onClickCard,
  isSelected = false,
}: DriveFileCardProps) {
  const isImg = isImageFile(file.originalName);
  const ext = file.originalName.split(".").pop()?.toLowerCase() || "";

  // Render simulated page lines/grids
  const renderSimulatedLines = () => {
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return (
        <div className="w-full space-y-1.5 mt-2.5">
          <div className="h-1.5 w-full flex gap-1">
            <div className="h-full bg-gray-200/70 rounded-xs w-1/4"></div>
            <div className="h-full bg-gray-150 rounded-xs w-2/4"></div>
            <div className="h-full bg-gray-150 rounded-xs w-1/4"></div>
          </div>
          <div className="h-1.5 w-full flex gap-1">
            <div className="h-full bg-gray-150 rounded-xs w-1/3"></div>
            <div className="h-full bg-gray-200/70 rounded-xs w-1/3"></div>
            <div className="h-full bg-gray-150 rounded-xs w-1/3"></div>
          </div>
          <div className="h-1.5 w-full flex gap-1">
            <div className="h-full bg-gray-150 rounded-xs w-1/4"></div>
            <div className="h-full bg-gray-150 rounded-xs w-1/4"></div>
            <div className="h-full bg-gray-200/40 rounded-xs w-2/4"></div>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full space-y-1.5 mt-2.5">
        <div className="h-1.5 bg-gray-150 rounded-xs w-[90%]"></div>
        <div className="h-1.5 bg-gray-100 rounded-xs w-[70%]"></div>
        <div className="h-1.5 bg-gray-100 rounded-xs w-[45%]"></div>
      </div>
    );
  };

  return (
    <div
      onClick={() => onClickCard?.(file)}
      className={`group bg-white border ${isSelected ? "border-purple-600 ring-2 ring-purple-600/30" : "border-gray-200 hover:border-purple-300"} rounded-xl overflow-hidden shadow-3xs hover:shadow-md transition-all flex flex-col h-52 relative cursor-pointer`}
    >
      {/* Card Header (File Name & Star) */}
      <div className="h-11 bg-gray-50 border-b border-gray-150 px-3 flex items-center gap-2 select-none">
        {getFileIcon(file.originalName)}
        <a
          href={file.presignedUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-bold text-gray-700 truncate flex-1 hover:text-purple-700 hover:underline"
          title={file.originalName}
        >
          {file.originalName}
        </a>

        {/* Toggle Star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(file.id);
          }}
          className="text-gray-300 hover:text-amber-400 transition"
        >
          {isStarred ? (
            <RiStarFill size={14} className="text-amber-400" />
          ) : (
            <RiStarLine size={14} />
          )}
        </button>
      </div>

      {/* Card Preview Body */}
      <div className="flex-1 bg-gray-100/50 flex items-center justify-center p-3 relative overflow-hidden">
        {isImg && file.presignedUrl ? (
          <img
            src={file.presignedUrl}
            alt={file.originalName}
            className="w-full h-full object-cover rounded border border-gray-200/50 shadow-3xs"
          />
        ) : (
          /* Simulated doc page preview */
          <div className="w-[85%] h-full bg-white rounded border border-gray-200 shadow-3xs p-2.5 flex flex-col items-center justify-center relative overflow-hidden">
            {getFileLargeIcon(file.originalName)}
            <span className="text-[8px] text-gray-400 font-bold bg-gray-50 border border-gray-200/80 px-1.5 py-0.2 rounded-xs uppercase tracking-wide mt-1.5">
              {ext}
            </span>
            {renderSimulatedLines()}
          </div>
        )}

        {/* Download Hover Overlay */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <a
            href={file.presignedUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-white text-gray-700 hover:text-purple-700 hover:scale-105 shadow-md flex items-center justify-center transition-all"
            title="Tải xuống tệp tin"
          >
            <RiDownload2Line size={15} />
          </a>
        </div>
      </div>

      {/* Card Footer (Uploader avatar & name) */}
      <div className="h-10 px-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {getUserAvatar(file.uploadedBy)}
          <span className="text-[10px] text-gray-500 font-semibold truncate" title={file.uploadedBy}>
            {file.uploadedBy}
          </span>
        </div>
        {showFolderBadge && openIssueModal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openIssueModal(file.taskUuid);
            }}
            className="text-[9px] text-purple-750 border border-purple-200 bg-purple-50/40 px-1.5 py-0.5 rounded hover:bg-purple-50 transition truncate max-w-[90px]"
            title={`Xem thư mục: ${file.taskTitle}`}
          >
            ../{file.taskTitle.substring(0, 8)}/
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProjectFilesView() {
  const { projectId, project, issueUpdateTick, openIssueModal } = useContext(ProjectContext);
  const [tasks, setTasks] = useState<(Task & { _uuid: string })[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "largest" | "smallest">("newest");
  const { toasts, addToast, removeToast } = useToast();

  const [starredFiles, setStarredFiles] = useState<Record<string, boolean>>({});
  const [starredFolders, setStarredFolders] = useState<Record<string, boolean>>({});
  const [selectedFolderUuid, setSelectedFolderUuid] = useState<string | null>(null);
  const [selectedFileDetail, setSelectedFileDetail] = useState<FlatFile | null>(null);

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
        addToast(err instanceof Error ? err.message : "Failed to load files", "error")
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

  // Helpers
  function formatBytes(bytes: number, decimals = 1) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function getFileIcon(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const size = 16;
    if (ext === "pdf") {
      return <RiFilePdfLine size={size} className="text-red-500 shrink-0" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext || "")) {
      return <RiFileExcelLine size={size} className="text-green-600 shrink-0" />;
    }
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
      return <RiImageLine size={size} className="text-blue-500 shrink-0" />;
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
      return <RiFileZipLine size={size} className="text-amber-600 shrink-0" />;
    }
    if (["doc", "docx"].includes(ext || "")) {
      return <RiFileWordLine size={size} className="text-blue-600 shrink-0" />;
    }
    return <RiFileTextLine size={size} className="text-gray-500 shrink-0" />;
  }

  function getFileLargeIcon(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const size = 36;
    if (ext === "pdf") {
      return <RiFilePdfLine size={size} className="text-red-400" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext || "")) {
      return <RiFileExcelLine size={size} className="text-green-500" />;
    }
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
      return <RiImageLine size={size} className="text-blue-400" />;
    }
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
      return <RiFileZipLine size={size} className="text-amber-500" />;
    }
    if (["doc", "docx"].includes(ext || "")) {
      return <RiFileWordLine size={size} className="text-blue-500" />;
    }
    return <RiFileTextLine size={size} className="text-gray-400" />;
  }

  function isImageFile(fileName: string) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "");
  }

  function getUserAvatar(username: string) {
    if (!username) return null;
    const name = username.trim();
    const initials = name.charAt(0).toUpperCase();

    const colors = [
      "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-green-500",
      "bg-teal-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500",
      "bg-pink-500", "bg-rose-500"
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

  const typeIcons: Record<string, React.ReactNode> = {
    task: <FaTasks size={12} className="text-blue-500 shrink-0" />,
    story: <FaBook size={12} className="text-green-500 shrink-0" />,
    epic: <FaRocket size={12} className="text-purple-500 shrink-0" />,
  };

  const toggleStarFile = (id: string) => {
    setStarredFiles((p) => ({ ...p, [id]: !p[id] }));
  };

  const toggleStarFolder = (uuid: string) => {
    setStarredFolders((p) => ({ ...p, [uuid]: !p[uuid] }));
  };

  // Group and sort logic
  const query = searchQuery.trim().toLowerCase();

  const tasksWithFiles = tasks.filter((t) => t.attachments && t.attachments.length > 0);
  const selectedFolder = tasksWithFiles.find((t) => t._uuid === selectedFolderUuid);

  const flatFilesList: FlatFile[] = tasksWithFiles.flatMap((task) =>
    (task.attachments || []).map((file) => ({
      ...file,
      taskUuid: task._uuid,
      taskTitle: task.title,
      taskType: task.type,
    }))
  );

  // Filter files
  const filteredFiles = flatFilesList.filter((file) => {
    return (
      file.originalName.toLowerCase().includes(query) ||
      file.taskTitle.toLowerCase().includes(query) ||
      file.uploadedBy.toLowerCase().includes(query)
    );
  });

  const recentUploads = [...flatFilesList]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const totalUsedBytes = flatFilesList.reduce((acc, f) => acc + f.sizeBytes, 0);
  const MAX_STORAGE_BYTES = 3.6 * 1024 * 1024 * 1024;
  const usedPercentage = Math.min((totalUsedBytes / MAX_STORAGE_BYTES) * 100, 100);

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-6 px-8 flex flex-col select-none">
      {/* Search top bar */}
      <div className="flex items-center gap-4 mb-6 bg-white p-3.5  rounded-xl shadow-2xs">
        <div className="relative w-80">
          <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-xs
              focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white transition"
          />
        </div>

        {/* Storage progress bar */}
        <div className="ml-auto flex flex-col gap-1.5 w-64 select-none">
          <div className="flex justify-between text-[11px] text-gray-500 font-medium">
            <span>Storage Used</span>
            <span className="font-bold text-gray-800">
              {formatBytes(totalUsedBytes)} of 3.6 GB
            </span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-250/20">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${usedPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column - 75% width */}
        <div className="flex-1 min-w-0 space-y-8 w-full">

          {/* Breadcrumbs / Navigation */}
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white p-3.5 rounded-xl shadow-3xs select-none">
            <button
              onClick={() => setSelectedFolderUuid(null)}
              className="hover:text-purple-750 hover:underline font-bold text-gray-700 flex items-center gap-1.5 transition"
            >
              <RiFolder2Fill className="text-gray-400" size={16} />
              {project?.projectName ? project.projectName : "Project"}
            </button>
            {selectedFolderUuid && selectedFolder && (
              <>
                <span className="text-gray-400 font-medium">/</span>
                <span className="font-extrabold text-purple-800 truncate max-w-[200px] sm:max-w-xs md:max-w-md lg:max-w-xl">
                  {selectedFolder.title}
                </span>
                <span className="text-xs text-gray-400 font-normal">
                  ({selectedFolder.attachments?.length || 0} files)
                </span>
              </>
            )}
          </div>

          {selectedFolderUuid && selectedFolder ? (
            /* Folder Content Grid */
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-3xs min-h-[360px] space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">File List</span>
              </div>

              {(selectedFolder.attachments || []).length === 0 ? (
                <div className="text-center py-16 text-xs text-gray-400 italic">
                  This folder is empty.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {(selectedFolder.attachments || []).map((file) => (
                    <DriveFileCard
                      key={file.id}
                      file={{
                        ...file,
                        taskUuid: selectedFolder._uuid,
                        taskTitle: selectedFolder.title,
                        taskType: selectedFolder.type,
                      }}
                      isStarred={!!starredFiles[file.id]}
                      onToggleStar={toggleStarFile}
                      getFileIcon={getFileIcon}
                      getFileLargeIcon={getFileLargeIcon}
                      isImageFile={isImageFile}
                      formatBytes={formatBytes}
                      getUserAvatar={getUserAvatar}
                      onClickCard={setSelectedFileDetail}
                      isSelected={selectedFileDetail?.id === file.id}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Section 3: Folders Grid */
            tasksWithFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tasksWithFiles.map((group) => {
                  const isStarred = starredFolders[group._uuid];
                  return (
                    <div
                      key={group._uuid}
                      onClick={() => setSelectedFolderUuid(group._uuid)}
                      className="bg-white border border-gray-200 hover:border-amber-400 rounded-xl p-4 flex flex-col relative hover:shadow-xs transition cursor-pointer shadow-3xs group"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStarFolder(group._uuid);
                        }}
                        className="text-gray-300 hover:text-amber-400 transition absolute top-3.5 left-3.5 z-10"
                      >
                        {isStarred ? (
                          <RiStarFill size={15} className="text-amber-400" />
                        ) : (
                          <RiStarLine size={15} />
                        )}
                      </button>

                      {/* Yellow Folder Graphic */}
                      <div className="flex justify-center mt-4 mb-2">
                        <div className="w-16 h-12 bg-amber-400 rounded-r-md rounded-bl-md relative shadow-sm border border-amber-500
                          before:content-[''] before:absolute before:-top-1.5 before:left-0 before:w-6 before:h-2 before:bg-amber-500 before:rounded-t-sm">
                          <div className="absolute inset-x-1 bottom-1 top-2 bg-amber-100 rounded-xs flex items-center justify-center">
                            <RiFolder2Fill className="text-amber-400" size={16} />
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-amber-600 text-center uppercase tracking-wider block">
                        {group.attachments?.length || 0} files
                      </span>
                      <span
                        className="text-[11px] font-bold text-gray-700 text-center truncate mt-1 hover:text-purple-700 block w-full"
                        title={group.title}
                      >
                        {group.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Section 2: All files list */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">All Attachments</h2>
            {filteredFiles.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400 italic shadow-3xs">
                No attachments found.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredFiles.map((file) => {
                  const isStarred = starredFiles[file.id];
                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileDetail(file)}
                      className={`group bg-white border ${selectedFileDetail?.id === file.id ? "border-purple-600 ring-2 ring-purple-600/30" : "border-gray-200 hover:border-purple-300"} rounded-xl p-3.5 flex items-center justify-between shadow-3xs transition relative overflow-visible cursor-pointer`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {getFileIcon(file.originalName)}
                        <a
                          href={file.presignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[12px] font-bold text-gray-700 hover:text-purple-700 hover:underline truncate min-w-0 flex-1"
                          title={file.originalName}
                        >
                          {file.originalName}
                        </a>
                      </div>

                      <div className="hidden md:block shrink-0 px-4 text-center">
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                          {file.taskType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 px-4">
                        <span className="text-[11px] text-gray-600 font-semibold hidden sm:inline" title={file.uploadedBy}>
                          {file.uploadedBy}
                        </span>
                      </div>

                      <div className="hidden lg:block shrink-0 px-4">
                        <button
                          onClick={() => openIssueModal(file.taskUuid)}
                          className="text-[10px] text-purple-750 border border-purple-200 bg-purple-50/40 px-1.5 py-0.5 rounded hover:bg-purple-50 transition truncate max-w-[90px]"
                          title={`View task details: ${file.taskTitle}`}
                        >
                          ../{file.taskTitle}/
                        </button>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pl-4">
                        <button
                          onClick={() => toggleStarFile(file.id)}
                          className="text-gray-300 hover:text-amber-400 transition p-1"
                        >
                          {isStarred ? (
                            <RiStarFill size={15} className="text-amber-400" />
                          ) : (
                            <RiStarLine size={15} />
                          )}
                        </button>
                        <a
                          href={file.presignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-purple-700 p-1"
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
        <div className="w-full lg:w-80 shrink-0 space-y-8 bg-[#F1F5F9]/50 lg:bg-transparent p-4 lg:p-0 rounded-2xl border border-gray-200/50 lg:border-none">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recent Uploads</h2>
            <div className="space-y-3">
              {recentUploads.length === 0 ? (
                <div className="text-xs text-gray-400 italic">No files uploaded yet.</div>
              ) : (
                recentUploads.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileDetail(file)}
                    className={`flex items-center justify-between border rounded-xl p-3 shadow-3xs cursor-pointer transition ${selectedFileDetail?.id === file.id ? "bg-purple-50/30 border-purple-300" : "bg-white border-gray-200 hover:border-purple-200"}`}
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
                          className="block text-xs font-bold text-gray-700 hover:text-purple-700 hover:underline truncate min-w-0"
                          title={file.originalName}
                        >
                          {file.originalName}
                        </a>
                        <span className="block text-[9px] text-gray-400 mt-0.5">
                          {formatBytes(file.sizeBytes)} • {file.uploadedBy}
                        </span>
                      </div>
                    </div>
                    <a
                      href={file.presignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-gray-400 hover:text-purple-700 p-1 shrink-0 ml-2"
                      title="Download file"
                    >
                      <RiDownload2Line size={14} />
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* File Details */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">File Details</h2>
            {selectedFileDetail ? (
              <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-3xs space-y-4">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2.5 bg-purple-50 rounded-xl shrink-0 text-purple-600">
                    {getFileIcon(selectedFileDetail.originalName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-bold text-gray-800 break-all" title={selectedFileDetail.originalName}>
                      {selectedFileDetail.originalName}
                    </h3>
                    <span className="text-[10px] text-gray-400 block mt-0.5 uppercase font-semibold">
                      {selectedFileDetail.originalName.split(".").pop() || "unknown"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-400 shrink-0">Uploaded by:</span>
                    <span className="font-semibold text-gray-750 flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{selectedFileDetail.uploadedBy}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uploaded on:</span>
                    <span className="font-semibold text-gray-700">
                      {new Date(selectedFileDetail.createdAt).toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="font-semibold text-gray-700">
                      {formatBytes(selectedFileDetail.sizeBytes)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 pt-1.5 border-t border-gray-150">
                    <span className="text-gray-400">Task folder:</span>
                    <span className="font-bold text-purple-900 italic block truncate" title={selectedFileDetail.taskTitle}>
                      {selectedFileDetail.taskTitle}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <a
                    href={selectedFileDetail.presignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-purple-600 hover:bg-purple-750 text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <RiDownload2Line size={14} />
                    <span>Download</span>
                  </a>
                  {openIssueModal && (
                    <button
                      onClick={() => openIssueModal(selectedFileDetail.taskUuid)}
                      className="flex-1 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <span>View Task</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200/65 rounded-xl p-5 text-center shadow-3xs flex flex-col items-center justify-center py-7">
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2 border border-dashed border-gray-200">
                  <RiAttachment2 size={18} />
                </div>
                <p className="text-[11px] text-gray-400 italic">Select an attachment to view details.</p>
              </div>
            )}
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
}