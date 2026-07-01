/**
 * @file BoardColumn.tsx
 * @description Cột Kanban — hỗ trợ kéo thả, thêm task, đổi tên inline (click vào tiêu đề).
 * @author Warmdrobe
 */

import { useState, useRef, useEffect } from "react";
import { MdAdd, MdCheck, MdClose, MdDeleteOutline } from "react-icons/md";
import { useDrop, useDrag } from "react-dnd";
import type { Task, Status, TaskType, Priority } from "../../types/project";
import { statusMap } from "../../types/project";
import { BoardCard } from "./BoardCard";
import { AddTaskForm, AddTaskButton } from "./AddTaskForm";

interface Props {
  status: Status;
  statusId?: string;
  /** Custom display name from the server (overrides statusMap label). */
  statusLabel?: string;
  /** Hex color from the server (overrides statusMap dot color). */
  statusColor?: string;
  index: number;
  tasks: Task[];
  allTasks: Task[];
  hasFilter: boolean;
  onOpenTask: (task: Task) => void;
  onCreateTask: (
    title: string,
    type: TaskType,
    priority: Priority,
    status: Status,
  ) => Promise<unknown> | void;
  onMoveTask: (taskId: number, statusId: string) => void;
  onReorderTasks: (taskId: number, fromIndex: number, toIndex: number) => void;
  /** Called when user renames the column inline. Null statusId = non-editable column. */
  onRename?: (statusId: string, newName: string) => Promise<void>;
  /** Check if a status transition is allowed. */
  isTransitionAllowed: (fromStatusId: string | null | undefined, toStatusId: string | null | undefined) => boolean;
  onReorderColumns?: (fromIndex: number, toIndex: number) => void;
  onPersistColumnOrder?: () => void;
  onDeleteColumn?: (statusId: string) => void;
}

export function BoardColumn({
  status,
  statusId,
  statusLabel,
  statusColor,
  index,
  tasks,
  allTasks,
  hasFilter,
  onOpenTask,
  onCreateTask,
  onMoveTask,
  onReorderTasks,
  onRename,
  isTransitionAllowed,
  onReorderColumns,
  onPersistColumnOrder,
  onDeleteColumn,
}: Props) {
  const columnRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dropIndex, setDropIndex] = useState(-1);

  // Inline rename state
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const meta = statusMap[status];
  const displayLabel = statusLabel ?? meta.label;
  const dotStyle = statusColor ? { backgroundColor: statusColor } : undefined;
  const dotClass = `w-2.5 h-2.5 rounded-full shrink-0 ${statusColor ? "" : meta.dotColor}`;

  // Focus rename input when opened
  useEffect(() => {
    if (renaming) {
      setRenameValue(displayLabel);
      setTimeout(() => renameInputRef.current?.focus(), 40);
    }
  }, [renaming, displayLabel]);

  /* ── Rename handlers ── */
  async function commitRename() {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === displayLabel || !statusId || !onRename) {
      setRenaming(false);
      return;
    }
    setRenameSaving(true);
    try {
      await onRename(statusId, trimmed);
    } finally {
      setRenameSaving(false);
      setRenaming(false);
    }
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") setRenaming(false);
  }

  /* ── Drag-and-drop ── */
  const [{ isOver, canDrop, isDragging }, drop] = useDrop(
    () => ({
      accept: "task",
      canDrop: (item: any) => {
        if (!item || !item.task || !statusId) {
          console.warn("canDrop: missing item, task, or statusId", { item, statusId });
          return false;
        }
        const allowed = isTransitionAllowed(item.task._statusId, statusId);
        console.log("canDrop:", {
          task: item.task.title,
          from: item.task._statusId,
          to: statusId,
          allowed
        });
        return allowed;
      },
      drop: (item: any) => {
        if (!item || !item.task) return;
        const task = item.task as Task & { _statusId?: string };
        if (task._statusId !== statusId && statusId) {
          onMoveTask(task.id, statusId);
        } else {
          const currentIndex = tasks.findIndex((t) => t.id === task.id);
          if (dropIndex !== -1 && dropIndex !== currentIndex) {
            onReorderTasks(task.id, currentIndex, dropIndex);
          }
        }
        setDropIndex(-1);
      },
      hover: (item: any, monitor) => {
        if (!item || !item.task) return;
        const task = item.task as Task & { _statusId?: string };
        if (task._statusId === statusId && columnRef.current) {
          const clientOffset = monitor.getClientOffset();
          const containerRect = columnRef.current.getBoundingClientRect();
          if (clientOffset) {
            const hoverClientY = clientOffset.y - containerRect.top;
            const cardsContainer = columnRef.current.querySelector(".space-y-3");
            if (cardsContainer) {
              const children = Array.from(cardsContainer.children);
              let targetIndex = children.length - 1;
              for (let i = 0; i < children.length; i++) {
                const childRect = (children[i] as HTMLElement).getBoundingClientRect();
                const childY = childRect.top - containerRect.top;
                if (hoverClientY < childY + childRect.height / 2) {
                  targetIndex = i;
                  break;
                }
              }
              setDropIndex(targetIndex);
            }
          }
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
        isDragging: monitor.getItemType() === "task",
      }),
    }),
    [status, statusId, onMoveTask, onReorderTasks, dropIndex, tasks, isTransitionAllowed],
  );

  // ── Column Drag-and-Drop (Jira-style reordering) ──
  const [{ isDraggingCol }, dragCol, previewCol] = useDrag(
    () => ({
      type: "column",
      item: { id: statusId, index },
      end: () => {
        if (onPersistColumnOrder) {
          onPersistColumnOrder();
        }
      },
      collect: (monitor) => ({
        isDraggingCol: monitor.isDragging(),
      }),
    }),
    [statusId, index, onPersistColumnOrder],
  );

  const [, dropCol] = useDrop(
    () => ({
      accept: "column",
      hover: (draggedItem: { id: string; index: number }, monitor) => {
        if (!columnRef.current) return;
        const dragIndex = draggedItem.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;

        const hoverBoundingRect = columnRef.current.getBoundingClientRect();
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        const hoverClientX = clientOffset.x - hoverBoundingRect.left;

        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }

        if (onReorderColumns) {
          onReorderColumns(dragIndex, hoverIndex);
          draggedItem.index = hoverIndex;
        }
      },
    }),
    [index, onReorderColumns],
  );



  async function handleSubmit(title: string, type: TaskType, priority: Priority) {
    setSubmitting(true);
    try {
      await onCreateTask(title, type, priority, status);
      setAdding(false);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Jira-style colored top bar ── */
  const accentColor = statusColor ?? (status === "done" ? "#10B981" : status === "in_progress" ? "#3B82F6" : "#9CA3AF");

  // Determine styles based on drag and drop state
  let borderClass = "border-none";
  let bgClass = "bg-gray-100";

  if (isDragging) {
    if (canDrop) {
      if (isOver) {
        borderClass = "border-green-500 ring-2 ring-green-300";
        bgClass = "bg-green-50/70";
      } else {
        borderClass = "border-dashed border-indigo-400";
        bgClass = "bg-indigo-50/30";
      }
    } else {
      if (isOver) {
        borderClass = "border-red-500 ring-2 ring-red-300 cursor-not-allowed";
        bgClass = "bg-red-50/70";
      } else {
        borderClass = "border-gray-200 opacity-40";
        bgClass = "bg-gray-100/40";
      }
    }
  } else {
    if (isOver) {
      borderClass = "ring-2 ring-indigo-400 border-indigo-200";
      bgClass = "bg-indigo-50/50";
    }
  }

  return (
    <div
      ref={(node) => {
        columnRef.current = node;
        drop(node);
        previewCol(node);
      }}
      className={`flex flex-col h-full rounded-xl border transition-all duration-150 ${borderClass} ${bgClass} ${isDraggingCol ? "opacity-25 border-dashed border-indigo-300" : ""}`}
    >
      {/* Column header */}
      <div
        ref={(node) => {
          dragCol(node);
          dropCol(node);
        }}
        className="flex items-center justify-between px-4 pt-3 pb-2 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className={dotClass} style={dotStyle} />

          {/* Inline rename input OR clickable label */}
          {renaming ? (
            <div className="flex items-center gap-1 flex-1 min-w-0">
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                disabled={renameSaving}
                className="flex-1 min-w-0 text-sm font-semibold bg-white border border-indigo-400 rounded px-2 py-0.5
                  focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-800"
                maxLength={50}
              />
              <button
                onClick={commitRename}
                disabled={renameSaving}
                className="text-indigo-600 hover:text-indigo-800 p-0.5 disabled:opacity-40"
              >
                <MdCheck size={16} />
              </button>
              <button
                onClick={() => setRenaming(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
              >
                <MdClose size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onRename && statusId ? setRenaming(true) : undefined}
              className={`text-sm font-semibold text-gray-700 tracking-wide truncate text-left
                ${onRename && statusId ? "hover:text-indigo-600 cursor-text" : "cursor-default"}`}
              title={onRename && statusId ? "Click to rename" : undefined}
            >
              {displayLabel}
            </button>
          )}

          {/* Task count badge */}
          {!renaming && (
            <span className="text-xs bg-gray-200 text-gray-500 rounded-full px-2 py-0.5 font-medium shrink-0">
              {tasks.length}
            </span>
          )}
        </div>

        {/* Actions container */}
        {!renaming && (
          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            <button
              onClick={() => setAdding(true)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
              title="Add task"
            >
              <MdAdd size={18} />
            </button>
            {statusId && onDeleteColumn && (
              <button
                onClick={() => onDeleteColumn(statusId)}
                className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-gray-200 transition"
                title="Delete column"
              >
                <MdDeleteOutline size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Colored accent line directly below the status name/header */}
      <div className="h-0.5 mx-4 rounded-full" style={{ backgroundColor: accentColor }} />

      {/* Cards area */}
      <div className="flex-1 p-3 space-y-2">
        {tasks.map((task, columnIndex) => (
          <BoardCard
            key={task.id}
            task={task}
            allTasks={allTasks}
            onClick={onOpenTask}
            index={columnIndex}
          />
        ))}

        {tasks.length === 0 && !adding && (
          <div className="text-center py-8 text-gray-300 text-xs select-none">
            {hasFilter ? "No matching tasks" : "No tasks yet"}
          </div>
        )}

        {adding ? (
          <AddTaskForm
            onSubmit={handleSubmit}
            onCancel={() => setAdding(false)}
            submitting={submitting}
          />
        ) : (
          <AddTaskButton onClick={() => setAdding(true)} />
        )}
      </div>
    </div>
  );
}