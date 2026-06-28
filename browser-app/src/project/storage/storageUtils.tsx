import React from "react";
import {
  RiFilePdfLine,
  RiFileExcelLine,
  RiImageLine,
  RiFileZipLine,
  RiFileWordLine,
  RiFileTextLine,
} from "react-icons/ri";

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

export function getFileLargeIcon(fileName: string) {
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
