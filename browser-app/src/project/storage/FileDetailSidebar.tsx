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
    <div className="space-y-4">
      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
        File Details
      </h2>
      {selectedFileDetail ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between h-75">
          <div className="space-y-3.5">
            <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
              <div className="p-2.5 bg-purple-50 rounded-xl shrink-0 text-purple-800">
                {getFileIcon(selectedFileDetail.originalName)}
              </div>
              <div className="min-w-0 flex-1">
                <h3
                  className="text-xs font-bold text-gray-800 truncate"
                  title={selectedFileDetail.originalName}
                >
                  {selectedFileDetail.originalName}
                </h3>
                <span className="text-[10px] text-gray-400 block mt-0.5 uppercase font-semibold">
                  {selectedFileDetail.originalName.split(".").pop() ||
                    "unknown"}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center gap-2">
                <span className="text-gray-400 shrink-0">Uploaded by:</span>
                <span className="flex items-center gap-1.5 min-w-0">
                  {getUserAvatar(selectedFileDetail.uploadedBy)}
                  <span className="truncate text-gray-600">
                    {selectedFileDetail.uploadedBy}
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Uploaded on:</span>
                <span className=" text-gray-600">
                  {new Date(selectedFileDetail.createdAt).toLocaleDateString(
                    "en-US",
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Size:</span>
                <span className=" text-gray-600">
                  {formatBytes(selectedFileDetail.sizeBytes)}
                </span>
              </div>
              <div className="flex flex-row gap-1 ">
                <span className="text-gray-400">Issue:</span>
                <span
                  className="flex w-full justify-end hover:underline font-bold text-purple-800 italic truncate"
                  title={selectedFileDetail.taskTitle}
                  onClick={() => openIssueModal?.(selectedFileDetail.taskUuid)}
                >
                  {selectedFileDetail.taskTitle}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="h-px w-full bg-gray-200"></div>
            <a
              href={selectedFileDetail.presignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-purple-900 hover:bg-purple-800 text-gray-200 text-sm py-2 mt-4 rounded-md flex items-center justify-center gap-1.5 transition"
            >
              <RiDownload2Line size={14} />
              <span>Download</span>
            </a>
          </div>
        </div>
      ) : (
        <div className=" p-5 text-center flex flex-col items-center justify-center h-75">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2 ">
            <RiAttachment2 size={18} />
          </div>
          <p className="text-[11px] text-gray-400 italic">
            Select an attachment to view details.
          </p>
        </div>
      )}
    </div>
  );
}
