import { useState, useRef, useEffect } from "react";
import {
  RiAttachment2,
  RiDeleteBin6Line,
  RiFilePdfLine,
  RiFileExcelLine,
  RiFileTextLine,
} from "react-icons/ri";
import { IoMdAdd } from "react-icons/io";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { issueApi } from "../../../api/services/issueApi";
import type { AttachmentResponse } from "../../../api/contracts/attachment";

interface AttachmentsSectionProps {
  projectId: string;
  issueId: string;
  initialAttachments?: AttachmentResponse[];
  onUpdateAttachments?: (attachments: AttachmentResponse[]) => void;
}

export function AttachmentsSection({
  projectId,
  issueId,
  initialAttachments = [],
  onUpdateAttachments,
}: AttachmentsSectionProps) {
  const [attachments, setAttachments] = useState<AttachmentResponse[]>(initialAttachments);
  const [error, setError] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state if initialAttachments changes
  useEffect(() => {
    setAttachments(initialAttachments);
  }, [initialAttachments]);

  // Format file size helper
  function formatBytes(bytes: number, decimals = 1) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  // Detect file type helper
  function getFileType(fileName: string): "image" | "pdf" | "excel" | "document" {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (["xls", "xlsx", "csv"].includes(ext || "")) return "excel";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || ""))
      return "image";
    return "document";
  }

  // Format date helper
  function formatDate(dateStr: string) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Just now";
    }
  }

  // Process files selected/dropped
  async function processFiles(files: FileList) {
    setError("");
    const validFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Size validation: max 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 10MB size limit.`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setIsUploading(true);
    try {
      const newAttachments = await issueApi.uploadAttachments(projectId, issueId, validFiles);
      setAttachments((prev) => {
        const updated = [...newAttachments, ...prev];
        if (onUpdateAttachments) {
          onUpdateAttachments(updated);
        }
        return updated;
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to upload files."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function triggerBrowse() {
    fileInputRef.current?.click();
  }

  async function handleDelete(id: string) {
    setError("");
    setIsDeletingId(id);
    try {
      await issueApi.deleteAttachment(projectId, issueId, id);
      setAttachments((prev) => {
        const updated = prev.filter((a) => a.id !== id);
        if (onUpdateAttachments) {
          onUpdateAttachments(updated);
        }
        return updated;
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to delete file."
      );
    } finally {
      setIsDeletingId(null);
    }
  }

  function getFileIcon(type: "image" | "pdf" | "excel" | "document") {
    switch (type) {
      case "pdf":
        return <RiFilePdfLine size={24} className="text-red-500" />;
      case "excel":
        return <RiFileExcelLine size={24} className="text-green-600" />;
      default:
        return <RiFileTextLine size={24} className="text-blue-500" />;
    }
  }

  // Slice visible items (max 4 defaults, unless showAll is active)
  const visibleAttachments = showAll ? attachments : attachments.slice(0, 4);

  return (
    <div className="space-y-3">
      {/* Hidden file input */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <span>Attachments ({attachments.length})</span>
          {isUploading && (
            <AiOutlineLoading3Quarters size={12} className="animate-spin text-purple-700" />
          )}
        </div>
        <button
          type="button"
          onClick={triggerBrowse}
          disabled={isUploading}
          className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 transition disabled:opacity-50"
        >
          <IoMdAdd size={14} />
          Add attachment
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="text-xs text-red-50 bg-red-500/90 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Drag & Drop Area (Only visible when list is empty) */}
      {attachments.length === 0 && (
        <div
          onClick={triggerBrowse}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/20 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1"
        >
          {isUploading ? (
            <AiOutlineLoading3Quarters
              size={22}
              className="text-purple-700 animate-spin mb-1"
            />
          ) : (
            <RiAttachment2
              size={22}
              className="text-gray-400 rotate-45 mb-1 animate-pulse"
            />
          )}
          <p className="text-xs text-gray-500 font-medium">
            {isUploading ? "Uploading files..." : "Drag & drop files here, or "}
            {!isUploading && <span className="text-purple-700 underline">browse</span>}
          </p>
          <p className="text-[10px] text-gray-400">
            Support PDF, Excel, Word, Zip and Images up to 10MB
          </p>
        </div>
      )}

      {/* List / Grid of Attachments */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {visibleAttachments.map((item) => {
              const fileType = getFileType(item.originalName);
              const isImg = fileType === "image";
              const isDeleting = isDeletingId === item.id;

              return (
                <div
                  key={item.id}
                  className="group relative flex items-center gap-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl p-3 border border-gray-100 transition"
                >
                  {/* Preview block */}
                  <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                    {isImg && item.presignedUrl ? (
                      <img
                        src={item.presignedUrl}
                        alt={item.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getFileIcon(fileType)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    <p
                      title={item.originalName}
                      onClick={() => window.open(item.presignedUrl, "_blank")}
                      className="text-xs font-medium text-gray-700 truncate hover:text-purple-700 transition cursor-pointer"
                    >
                      {item.originalName}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatBytes(item.sizeBytes)} • {item.uploadedBy} ({formatDate(item.createdAt)})
                    </p>
                  </div>

                  {/* Action Delete */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isDeletingId !== null}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    title="Delete file"
                  >
                    {isDeleting ? (
                      <AiOutlineLoading3Quarters size={13} className="animate-spin" />
                    ) : (
                      <RiDeleteBin6Line size={13} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* See more toggle button */}
          {attachments.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="text-xs font-semibold text-purple-700 hover:text-purple-950 transition flex items-center gap-1 mt-1"
            >
              {showAll
                ? "See Less"
                : `See More (${attachments.length - 4} files remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
