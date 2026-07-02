/**
 * @file AddColumnButton.tsx
 * @description Jira-style "Add column" button — chỉ hỏi tên và màu.
 * Category được tự động gán là IN_PROGRESS (phù hợp mọi trạng thái tuỳ chỉnh).
 */

import { useState, useRef, useEffect } from "react";
import { MdAdd } from "react-icons/md";
import type { StatusCategory } from "../../api/contracts/projectStatus";

interface Props {
  onAdd: (
    name: string,
    category: StatusCategory,
    color: string,
  ) => Promise<void>;
}

const PRESET_COLORS = [
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];

export function AddColumnButton({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366F1");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  async function handleSubmit() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      // Custom columns → IN_PROGRESS category by default
      await onAdd(name.trim(), "IN_PROGRESS", color);
      setName("");
      setColor("#6366F1");
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setOpen(false);
      setName("");
    }
  }

  /* ── Collapsed state ── */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Add column"
        className="group flex items-center gap-2 h-9 px-12 rounded-md border-2 border-dashed border-gray-300
          text-gray-400 hover:border-gray-700 hover:text-gray-700
          transition-all duration-200 whitespace-nowrap shrink-0 text-sm "
      >
        <MdAdd
          size={18}
          className="transition-transform group-hover:rotate-90 duration-200"
        />
        Add column
      </button>
    );
  }

  /* ── Expanded form ── */
  return (
    <div className="shrink-0 w-64 bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3 self-start">
      {/* Header */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        New column
      </p>

      <div className="flex items-center gap-3">
        {/* Preview badge */}
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        {/* Name input */}
        <input
          ref={inputRef}
          type="text"
          placeholder="e.g. In Review, Testing..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5
          focus:outline-none focus:ring-1 focus:ring-purple-700 focus:border-transparent transition"
          maxLength={50}
        />
      </div>

      {/* Color swatches */}
      <div>
        <p className="text-xs text-gray-400 mb-2">Color</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{ backgroundColor: c }}
              className={`w-5 h-5 rounded-full transition-all duration-150
                ${color === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110 opacity-80 hover:opacity-100"}`}
            />
          ))}
          {/* Custom picker */}
          <label
            className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center
            cursor-pointer hover:border-gray-400 overflow-hidden relative"
            title="Custom color"
          >
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="text-gray-400 text-[10px] font-bold pointer-events-none">
              +
            </span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!name.trim() || submitting}
          className="flex-1 bg-purple-900 text-gray-200 text-sm py-1.5 rounded-md
            hover:bg-purple-800 active:bg-purple-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {submitting ? "Creating…" : "Create"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setName("");
          }}
          className="px-8 py-1.5 rounded-md text-sm text-gray-500 border border-gray-500 hover:bg-gray-100 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
