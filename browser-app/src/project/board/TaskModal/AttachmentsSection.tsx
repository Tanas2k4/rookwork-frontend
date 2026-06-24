import { useState, useRef } from "react";
import {
  RiAttachment2,
  RiDeleteBin6Line,
  RiFilePdfLine,
  RiFileExcelLine,
  RiFileTextLine,
} from "react-icons/ri";
import { IoMdAdd } from "react-icons/io";

interface AttachmentMock {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  type: "image" | "pdf" | "excel" | "document";
  previewUrl?: string;
}

export function AttachmentsSection() {
  const [attachments, setAttachments] = useState<AttachmentMock[]>([]);

  const [error, setError] = useState<string>("");
  const [showAll, setShowAll] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  function getFileType(fileName: string): AttachmentMock["type"] {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (["xls", "xlsx", "csv"].includes(ext || "")) return "excel";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || ""))
      return "image";
    return "document";
  }

  // Process files selected/dropped
  function processFiles(files: FileList) {
    setError("");
    const newItems: AttachmentMock[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Size validation: max 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds the 10MB size limit.`);
        continue;
      }

      const type = getFileType(file.name);
      const isImg = type === "image";

      newItems.push({
        id: String(Date.now() + i),
        name: file.name,
        size: formatBytes(file.size),
        uploadedAt: "Just now",
        type,
        previewUrl: isImg ? URL.createObjectURL(file) : undefined,
      });
    }

    if (newItems.length > 0) {
      setAttachments((prev) => [...newItems, ...prev]);
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

  function handleDelete(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function getFileIcon(type: AttachmentMock["type"]) {
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
        </div>
        <button
          type="button"
          onClick={triggerBrowse}
          className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 transition"
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
          <RiAttachment2
            size={22}
            className="text-gray-400 rotate-45 mb-1 animate-pulse"
          />
          <p className="text-xs text-gray-500 font-medium">
            Drag & drop files here, or{" "}
            <span className="text-purple-700 underline">browse</span>
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
            {visibleAttachments.map((item) => (
              <div
                key={item.id}
                className="group relative flex items-center gap-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl p-3 border border-gray-100 transition"
              >
                {/* Preview block */}
                <div className="w-12 h-12 rounded-lg bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center border border-gray-200">
                  {item.type === "image" && item.previewUrl ? (
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(item.type)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pr-6">
                  <p
                    title={item.name}
                    className="text-xs font-medium text-gray-700 truncate hover:text-purple-700 transition cursor-pointer"
                  >
                    {item.name}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {item.size} • {item.uploadedAt}
                  </p>
                </div>

                {/* Action Delete */}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                  title="Delete file"
                >
                  <RiDeleteBin6Line size={13} />
                </button>
              </div>
            ))}
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
