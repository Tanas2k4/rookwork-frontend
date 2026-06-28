import React from "react";
import { RiDownload2Line } from "react-icons/ri";
import { isImageFile, getFileIcon, getFileLargeIcon } from "./storageUtils";

export interface FlatFile {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedByAvatar?: string;
  createdAt: string;
  presignedUrl: string;
  taskUuid: string;
  taskTitle: string;
  taskType: string;
}

export interface DriveFileCardProps {
  file: FlatFile;
  getUserAvatar: (name: string) => React.ReactNode;
  openIssueModal?: (uuid: string) => void;
  showFolderBadge?: boolean;
  onClickCard?: (file: FlatFile) => void;
  isSelected?: boolean;
}

export function DriveFileCard({
  file,
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
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", file.id);
        e.dataTransfer.setData("application/source-task-uuid", file.taskUuid);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={`group bg-white border ${isSelected ? "border-purple-800" : "border-gray-200 hover:border-purple-800"} rounded-xl overflow-hidden transition-all flex flex-col h-52 relative cursor-pointer`}
    >
      {/* Card Header (File Name) */}
      <div className="h-11 bg-gray-50 border-b border-gray-150 px-3 flex items-center gap-2 select-none">
        {getFileIcon(file.originalName)}
        <a
          href={file.presignedUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-bold text-gray-700 truncate flex-1 hover:text-purple-800 hover:underline block min-w-0"
          title={file.originalName}
        >
          {file.originalName}
        </a>
      </div>

      {/* Card Preview Body */}
      <div className="flex-1 bg-gray-100/50 flex items-center justify-center p-3 relative overflow-hidden">
        {isImg && file.presignedUrl ? (
          <img
            src={file.presignedUrl}
            alt={file.originalName}
            className="w-full h-full object-cover rounded border border-gray-200/50"
          />
        ) : (
          /* Simulated doc page preview */
          <div className="w-[85%] h-full bg-white rounded border border-gray-200 p-2.5 flex flex-col items-center justify-center relative overflow-hidden">
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
            className="w-8 h-8 rounded-full bg-white text-gray-700 hover:text-purple-800 hover:scale-105 flex items-center justify-center transition-all"
            title="Download file"
          >
            <RiDownload2Line size={15} />
          </a>
        </div>
      </div>

      {/* Card Footer (Uploader avatar & name) */}
      <div className="h-10 px-3 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {getUserAvatar(file.uploadedBy)}
          <span
            className="text-[10px] text-gray-500 font-semibold truncate"
            title={file.uploadedBy}
          >
            {file.uploadedBy}
          </span>
        </div>
        {showFolderBadge && openIssueModal && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              openIssueModal(file.taskUuid);
            }}
            className="text-[9px] text-purple-800 border border-purple-200 bg-purple-50/40 px-1.5 py-0.5 rounded hover:bg-purple-50 transition truncate max-w-22.5"
            title={`View folder: ${file.taskTitle}`}
          >
            ../{file.taskTitle.substring(0, 8)}/
          </button>
        )}
      </div>
    </div>
  );
}
