import React from "react";
import { RiDownload2Line, RiAttachment2 } from "react-icons/ri";
import type { FlatFile } from "./DriveFileCard";
import { getFileIcon, formatBytes } from "./storageUtils";

interface FileDetailSidebarProps {
  selectedFileDetail: FlatFile | null;
  openIssueModal?: (uuid: string) => void;
  getUserAvatar: (name: string) => React.ReactNode;
}

export function FileDetailSidebar({
  selectedFileDetail,
  openIssueModal,
  getUserAvatar,
}: FileDetailSidebarProps) {
  return (
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
                {getUserAvatar(selectedFileDetail.uploadedBy)}
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
  );
}
