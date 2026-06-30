import { useState } from "react";
import { MdClose } from "react-icons/md";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";
import type { Task } from "../../../types/project";
import {
  typeLabelMap,
  issueTypeIcons,
} from "../../../types/project";

interface Props {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
  onSaveTitle: (title: string) => void;
  onOpenTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function TaskModalHeader({
  task,
  allTasks,
  onClose,
  onSaveTitle,
  onOpenTask,
  onDeleteTask,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const it = task.issueType;
  const Icon = issueTypeIcons[it?.iconKey || "task"] || issueTypeIcons.task;
  const typeColor = it?.color || "#64748B";

  const parent = task.parentId
    ? allTasks.find((t) => t.id === task.parentId)
    : null;

  function save() {
    if (value.trim()) onSaveTitle(value.trim());
    setEditing(false);
  }

  return (
    <div className="shrink-0 border-b border-gray-200 px-6 py-4 flex items-start gap-3 bg-white rounded-t-2xl">
      <Icon style={{ color: typeColor }} className="text-lg mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {/* Parent breadcrumb */}
        {parent && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            {(() => {
              const pit = parent.issueType;
              const PI = issueTypeIcons[pit?.iconKey || "task"] || issueTypeIcons.task;
              const parentColor = pit?.color || "#64748B";
              return <PI style={{ color: parentColor }} size={11} />;
            })()}
            <button
              onClick={() => onOpenTask(parent)}
              className="hover:text-purple-700 hover:underline transition truncate max-w-50"
            >
              {parent.title}
            </button>
            <span>›</span>
          </div>
        )}

        {editing ? (
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") setEditing(false);
            }}
            className="text-lg font-bold text-gray-800 w-full outline-none border-b border-gray-400 bg-transparent pb-0.5"
          />
        ) : (
          <h2
            onDoubleClick={() => {
              setEditing(true);
              setValue(task.title);
            }}
            className="text-xl font-bold text-gray-800 cursor-default rounded px-1 -mx-1 hover:bg-gray-50 transition leading-snug"
            title="Double-click to edit"
          >
            {task.title}
          </h2>
        )}
        <p className="text-xs text-gray-400 mt-0.5">
          ID: #{task.id} · {typeLabelMap[task.type]}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-1.5 rounded-full transition shrink-0 ${
              menuOpen ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title="Actions"
          >
            <FiMoreVertical size={15} />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setShowConfirmDelete(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition flex items-center gap-2"
                >
                  <FiTrash2 size={15} />
                  Delete issue
                </button>
              </div>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
        >
          <MdClose size={20} />
        </button>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={() => setShowConfirmDelete(false)}
          />
          {/* Modal Container */}
          <div className="relative bg-white rounded-md border border-slate-200 p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col ">
            
            
            {/* Title */}
            <h3 className="text-base font-bold text-slate-800 mb-2">
              Delete Issue
            </h3>
            
            {/* Message */}
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete this issue? This action cannot be undone and all related work log data will be removed.
            </p>
            
            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 px-4 py-2 border border-gray-500 rounded-md text-gray-700 hover:bg-gray-100 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDelete(false);
                  onDeleteTask(task);
                }}
                className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md transition text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
