/**
 * @file SubtasksSection.tsx
 * @description Component hiển thị và quản lý các công việc con (Subtasks) của một sự vụ (Issue).
 * @author Warmdrobe
 */

import { useState } from "react";
import { MdClose } from "react-icons/md";
import type { Subtask } from "../../../types/project";
import { Button } from "../../../components/common/Button";
import { Input } from "../../../components/common/Input";
import { IoMdAdd } from "react-icons/io";

interface Props {
  subtasks: Subtask[];
  onToggle: (id: number) => void;
  onAdd: (title: string) => void;
  onDelete: (id: number) => void;
}

/**
 * Component hiển thị danh sách các công việc con (Subtasks).
 * Hỗ trợ các hành động check hoàn thành (toggle), thêm mới qua ô nhập liệu nhanh, và xóa bỏ công việc con.
 */
export function SubtasksSection({
  subtasks,
  onToggle,
  onAdd,
  onDelete,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [value, setValue] = useState("");
  const doneCount = subtasks.filter((s) => s.done).length;

  function submit() {
    if (!value.trim()) return;
    onAdd(value.trim());
    setValue("");
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Subtasks ({doneCount}/{subtasks.length})
        </p>
        <button
          onClick={() => {
            setShowForm((p) => !p);
            setValue("");
          }}
          className="flex items-center gap-0.5 text-xs text-purple-700 hover:text-purple-900 transition"
        >
          <IoMdAdd size={14} />
          {showForm ? "Cancel" : "Add"}
        </button>
      </div>

      {subtasks.length > 0 && (
        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-3">
          <div
            className="h-1.5 bg-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
          />
        </div>
      )}

      <div className="space-y-1.5">
        {subtasks.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center gap-2 group/sub py-0.5"
          >
            <input
              type="checkbox"
              checked={sub.done}
              onChange={() => onToggle(sub.id)}
              className="accent-purple-800 w-3.5 h-3.5 cursor-pointer shrink-0"
            />
            <span
              className={`text-sm flex-1 ${sub.done ? "line-through text-gray-400" : "text-gray-700"}`}
            >
              {sub.title}
            </span>
            <button
              onClick={() => onDelete(sub.id)}
              className="opacity-0 group-hover/sub:opacity-100 text-gray-300 hover:text-red-400 transition"
            >
              <MdClose size={13} />
            </button>
          </div>
        ))}
        {subtasks.length === 0 && !showForm && (
          <p className="text-xs text-gray-300 italic">No subtasks yet</p>
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${showForm ? "opacity-100 max-h-40 mt-2" : "opacity-0 max-h-0 mt-0"}`}
      >
        <div className="flex flex-col gap-2  rounded-md px-1 py-2">
          <Input
            autoFocus={showForm}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") setShowForm(false);
            }}
            placeholder="Subtask title..."
            className="flex text-sm text-gray-800 bg-transparent border border-gray-500 rounded-sm focus:border-purple-800"
          />
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setShowForm(false)}
              variant="secondary"
              size="xs"
              className="text-[10px] p-1"
            >
              Cancel
            </Button>
            <Button onClick={submit} variant="primary" size="sm">
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
