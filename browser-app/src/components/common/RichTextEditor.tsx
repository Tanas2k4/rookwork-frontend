/**
 * @file RichTextEditor.tsx
 * @description Trình soạn thảo văn bản giàu định dạng (Rich Text Editor) dùng chung sử dụng Tiptap.
 * Hỗ trợ các định dạng cơ bản: Bold, Italic, Underline, Strike, Heading, List, Checklist, Text Color, Highlight, Code.
 * @author Antigravity
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { useEffect, useState } from "react";
import {
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiCheckSquare,
  FiCode,
  FiRotateCcw,
  FiRotateCw,
} from "react-icons/fi";
import {
  MdFormatListNumbered,
  MdStrikethroughS,
  MdOutlineFormatColorText,
  MdFormatColorFill,
} from "react-icons/md";
import { FaCode } from "react-icons/fa6";

interface RichTextEditorProps {
  initialValue: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const TEXT_COLORS = [
  { name: "Default", value: "inherit" },
  { name: "Purple", value: "#5b21b6" }, // Màu tím thương hiệu purple-800
  { name: "Red", value: "#dc2626" }, // red-600
  { name: "Blue", value: "#2563eb" }, // blue-600
  { name: "Green", value: "#16a34a" }, // green-600
  { name: "Yellow", value: "#ca8a04" }, // yellow-600
  { name: "Gray", value: "#4b5563" }, // gray-600
];

const HIGHLIGHT_COLORS = [
  { name: "None", value: "transparent" },
  { name: "Yellow", value: "#fef08a" }, // yellow-200
  { name: "Green", value: "#bbf7d0" }, // green-200
  { name: "Blue", value: "#bfdbfe" }, // blue-200
  { name: "Red", value: "#fecaca" }, // red-200
  { name: "Purple", value: "#e9d5ff" }, // purple-200
];

export function RichTextEditor({
  initialValue,
  onChange,
  onSave,
  onCancel,
  placeholder = "Add description...",
  autoFocus = true,
}: RichTextEditorProps) {
  const [textColorOpen, setTextColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content: initialValue,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "tiptap-content tiptap focus:outline-none p-3 min-h-[140px] max-h-[400px] overflow-y-auto w-full",
      },
    },
  });

  // Focus editor khi được tạo
  useEffect(() => {
    if (editor && autoFocus) {
      editor.commands.focus("end");
    }
  }, [editor, autoFocus]);

  // Đồng bộ nội dung khi initialValue thay đổi từ ngoài
  useEffect(() => {
    if (editor && initialValue !== editor.getHTML()) {
      editor.commands.setContent(initialValue);
    }
  }, [initialValue, editor]);

  // Bắt phím tắt Ctrl+Enter để Lưu
  useEffect(() => {
    if (!editor || !onSave) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onSave(editor.getHTML());
      }
    };

    const view = editor.view.dom;
    view.addEventListener("keydown", handleKeyDown);
    return () => {
      view.removeEventListener("keydown", handleKeyDown);
    };
  }, [editor, onSave]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-200 focus-within:border-purple-800 transition-colors shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-gray-50 border-b border-gray-200 select-none">
        <div className="flex flex-wrap items-center gap-1">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("bold")
                ? "bg-purple-100 text-purple-800 font-bold"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Bold (Ctrl+B)"
          >
            <FiBold size={15} />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("italic")
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Italic (Ctrl+I)"
          >
            <FiItalic size={15} />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("underline")
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Underline (Ctrl+U)"
          >
            <FiUnderline size={15} />
          </button>

          {/* Strike */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("strike")
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Strikethrough"
          >
            <MdStrikethroughS size={17} />
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          {/* Headings */}
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`px-2 py-0.5 rounded text-xs font-bold transition ${
              editor.isActive("heading", { level: 1 })
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`px-2 py-0.5 rounded text-xs font-bold transition ${
              editor.isActive("heading", { level: 2 })
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`px-2 py-0.5 rounded text-xs font-bold transition ${
              editor.isActive("heading", { level: 3 })
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Heading 3"
          >
            H3
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("bulletList")
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Bullet List"
          >
            <FiList size={15} />
          </button>

          {/* Numbered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("orderedList")
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Numbered List"
          >
            <MdFormatListNumbered size={17} />
          </button>

          {/* Task List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("taskList")
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Task List / Checklist"
          >
            <FiCheckSquare size={15} />
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          {/* Text Color Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setTextColorOpen(!textColorOpen);
                setHighlightOpen(false);
              }}
              className={`p-1.5 rounded transition flex items-center gap-0.5 ${
                textColorOpen
                  ? "bg-purple-100 text-purple-800"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
              title="Text Color"
            >
              <MdOutlineFormatColorText size={17} />
            </button>
            {textColorOpen && (
              <div className="absolute left-0 mt-1 p-1.5 bg-white border border-gray-200 rounded-md shadow-lg z-50 flex gap-1">
                {TEXT_COLORS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => {
                      if (col.value === "inherit") {
                        editor.chain().focus().unsetColor().run();
                      } else {
                        editor.chain().focus().setColor(col.value).run();
                      }
                      setTextColorOpen(false);
                    }}
                    className="w-5 h-5 rounded-full border border-gray-300 transition hover:scale-110 active:scale-95 flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor:
                        col.value === "inherit" ? "#000" : col.value,
                    }}
                    title={col.name}
                  >
                    {col.value === "inherit" && (
                      <span className="text-[7px] text-white">✖</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Highlight Color Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setHighlightOpen(!highlightOpen);
                setTextColorOpen(false);
              }}
              className={`p-1.5 rounded transition ${
                highlightOpen
                  ? "bg-purple-100 text-purple-800"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
              title="Highlight Color"
            >
              <MdFormatColorFill size={17} />
            </button>
            {highlightOpen && (
              <div className="absolute left-0 mt-1 p-1.5 bg-white border border-gray-200 rounded-md shadow-lg z-50 flex gap-1">
                {HIGHLIGHT_COLORS.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => {
                      if (col.value === "transparent") {
                        editor.chain().focus().unsetHighlight().run();
                      } else {
                        editor
                          .chain()
                          .focus()
                          .setHighlight({ color: col.value })
                          .run();
                      }
                      setHighlightOpen(false);
                    }}
                    className="w-5 h-5 rounded border border-gray-300 transition hover:scale-110 active:scale-95 flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor:
                        col.value === "transparent" ? "#fff" : col.value,
                    }}
                    title={col.name}
                  >
                    {col.value === "transparent" && (
                      <span className="text-[8px] text-red-500">✖</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          {/* Inline Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("code")
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Inline Code"
          >
            <FaCode size={17} />
          </button>

          {/* Code Block */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded transition ${
              editor.isActive("codeBlock")
                ? "bg-purple-100 text-purple-800"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            title="Code Block"
          >
            <FiCode size={15} />
          </button>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent transition"
            title="Undo"
          >
            <FiRotateCcw size={15} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:hover:bg-transparent transition"
            title="Redo"
          >
            <FiRotateCw size={15} />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Action Buttons (Save/Cancel) */}
      {(onSave || onCancel) && (
        <div className="flex items-center justify-end gap-2 px-3 py-1.5 bg-gray-50 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center border border-gray-500 gap-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              Cancel
            </button>
          )}
          {onSave && (
            <button
              type="button"
              onClick={() => onSave(editor.getHTML())}
              className="flex items-center gap-1 px-3.5 py-1.25 text-xs font-medium text-white bg-purple-800 hover:bg-purple-900 active:bg-purple-950 rounded transition-colors shadow-sm"
              title="Ctrl + Enter to save"
            >
              Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}
