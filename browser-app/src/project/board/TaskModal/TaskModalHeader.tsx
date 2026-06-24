import { useState } from "react";
import { MdClose } from "react-icons/md";
import type { Task } from "../../../types/project";
import {
  typeIconMap,
  typeColorMap,
  typeLabelMap,
} from "../../../types/project";

interface Props {
  task: Task;
  allTasks: Task[];
  onClose: () => void;
  onSaveTitle: (title: string) => void;
  onOpenTask: (task: Task) => void;
}

export function TaskModalHeader({
  task,
  allTasks,
  onClose,
  onSaveTitle,
  onOpenTask,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const Icon = typeIconMap[task.type];

  const parent = task.parentId
    ? allTasks.find((t) => t.id === task.parentId)
    : null;

  function save() {
    if (value.trim()) onSaveTitle(value.trim());
    setEditing(false);
  }

  return (
    <div className="shrink-0 border-b border-gray-200 px-6 py-4 flex items-start gap-3 bg-white rounded-t-2xl">
      <Icon className={`${typeColorMap[task.type]} text-lg mt-1.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        {/* Parent breadcrumb */}
        {parent && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            {(() => {
              const PI = typeIconMap[parent.type];
              return <PI className={typeColorMap[parent.type]} size={11} />;
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
      <button
        onClick={onClose}
        className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
      >
        <MdClose size={20} />
      </button>
    </div>
  );
}
