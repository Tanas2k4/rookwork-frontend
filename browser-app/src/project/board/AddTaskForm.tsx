/**
 * @file AddTaskForm.tsx
 * @description Component form và nút nhấn để thêm nhanh một công việc (Task) mới trên bảng Kanban.
 * @author Warmdrobe
 */

import { useState } from "react";
import { MdAdd } from "react-icons/md";
import type { TaskType, Priority } from "../../types/project";
import { priorities, priorityLabelMap } from "../../types/project";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { useProject } from "../../hooks/useProject";

interface Props {
  onSubmit: (title: string, type: TaskType, priority: Priority) => void;
  onCancel: () => void;
  submitting?: boolean;
}

/**
 * Component AddTaskForm hiển thị giao diện nhập thông tin và nút điều khiển
 * để thêm một công việc mới, có hỗ trợ lựa chọn loại công việc (Type) và độ ưu tiên (Priority).
 */
export function AddTaskForm({ onSubmit, onCancel, submitting = false }: Props) {
  const { issueTypes } = useProject();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("task");
  const [priority, setPriority] = useState<Priority>("medium");

  function handleSubmit() {
    if (!title.trim() || submitting) return;
    onSubmit(title.trim(), type, priority);
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-purple-300 shadow-sm space-y-2">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Task title..."
        disabled={submitting}
        className="w-full border-none focus:ring-0 px-0 py-0"
      />
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TaskType)}
          disabled={submitting}
          className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white disabled:opacity-50"
        >
          {issueTypes.map((t) => (
            <option key={t.id} value={t.name.toLowerCase()}>
              {t.name}
            </option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Priority)}
          disabled={submitting}
          className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white disabled:opacity-50"
        >
          {priorities.map((p) => (
            <option key={p} value={p}>{priorityLabelMap[p]}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button
          onClick={onCancel}
          disabled={submitting}
          variant="secondary"
          size="sm"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          loading={submitting}
          variant="primary"
          size="sm"
        >
          Add
        </Button>
      </div>
    </div>
  );
}

interface AddButtonProps {
  onClick: () => void;
}

/**
 * Component nút bấm "Add task" tối giản để mở biểu mẫu thêm mới công việc.
 */
export function AddTaskButton({ onClick }: AddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg py-2 px-3 transition"
    >
      <MdAdd size={14} />
      Add task
    </button>
  );
}