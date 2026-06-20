import { useState, useRef, useEffect } from "react";
import { MdAdd } from "react-icons/md";
import { useDrop } from "react-dnd";
import type { Task, Status, TaskType, Priority } from "../../types/project";
import { statusMap } from "../../types/project";
import { BoardCard } from "./BoardCard";
import { AddTaskForm, AddTaskButton } from "./AddTaskForm";

interface Props {
  status: Status;
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
  onMoveTask: (taskId: number, newStatus: Status) => void;
  onReorderTasks: (taskId: number, fromIndex: number, toIndex: number) => void;
}

export function BoardColumn({
  status,
  tasks,
  allTasks,
  hasFilter,
  onOpenTask,
  onCreateTask,
  onMoveTask,
  onReorderTasks,
}: Props) {
  const columnRef = useRef<HTMLDivElement>(null);
  const [adding, setAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dropIndex, setDropIndex] = useState(-1);
  const meta = statusMap[status];

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "task",
      drop: (item: { task: Task; index: number }) => {
        if (item.task.status !== status) {
          onMoveTask(item.task.id, status);
        } else {
          const currentIndex = tasks.findIndex((t) => t.id === item.task.id);
          if (dropIndex !== -1 && dropIndex !== currentIndex) {
            onReorderTasks(item.task.id, currentIndex, dropIndex);
          }
        }
        setDropIndex(-1);
      },
      hover: (item: { task: Task; index: number }, monitor) => {
        if (item.task.status === status && columnRef.current) {
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
      collect: (monitor) => ({ isOver: monitor.isOver() }),
    }),
    [status, onMoveTask, onReorderTasks, dropIndex, tasks],
  );

  useEffect(() => {
    drop(columnRef);
  }, [drop]);

  async function handleSubmit(title: string, type: TaskType, priority: Priority) {
    setSubmitting(true);
    try {
      await onCreateTask(title, type, priority, status);
      setAdding(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={columnRef}
      className={`bg-gray-100 rounded-xl p-4 min-h-50 transition ${
        isOver ? "ring-2 ring-purple-500 bg-purple-50" : ""
      }`}
    >
      {/* Column header */}
      <div className={`flex items-center justify-between mb-4 pb-3 border-b-2 ${meta.headerColor}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
          <h3 className="text-sm font-semibold text-gray-700 tracking-wide">
            {meta.label}
          </h3>
          <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
        >
          <MdAdd size={18} />
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
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
          <div className="text-center py-8 text-gray-300 text-sm">
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