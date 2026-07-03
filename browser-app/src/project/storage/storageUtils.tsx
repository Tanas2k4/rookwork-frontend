import {
  DocumentIcon,
  TableCellsIcon,
  PhotoIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function isImageFile(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "");
}

export function getFileIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return <DocumentIcon className="w-4 h-4 text-red-500 shrink-0" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext || "")) {
    return <TableCellsIcon className="w-4 h-4 text-green-600 shrink-0" />;
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
    return <PhotoIcon className="w-4 h-4 text-blue-500 shrink-0" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return <ArchiveBoxIcon className="w-4 h-4 text-amber-600 shrink-0" />;
  }
  if (["doc", "docx"].includes(ext || "")) {
    return <DocumentTextIcon className="w-4 h-4 text-blue-600 shrink-0" />;
  }
  return <DocumentTextIcon className="w-4 h-4 text-gray-500 shrink-0" />;
}

export function getFileLargeIcon(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    return <DocumentIcon className="w-9 h-9 text-red-400" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext || "")) {
    return <TableCellsIcon className="w-9 h-9 text-green-500" />;
  }
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
    return <PhotoIcon className="w-9 h-9 text-blue-400" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext || "")) {
    return <ArchiveBoxIcon className="w-9 h-9 text-amber-500" />;
  }
  if (["doc", "docx"].includes(ext || "")) {
    return <DocumentTextIcon className="w-9 h-9 text-blue-500" />;
  }
  return <DocumentTextIcon className="w-9 h-9 text-gray-400" />;
}
