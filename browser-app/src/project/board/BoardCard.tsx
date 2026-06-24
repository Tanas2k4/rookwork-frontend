import { FaBook, FaTasks } from "react-icons/fa";
import { TbSubtask } from "react-icons/tb";
import { useRef, useEffect } from "react";
import { useDrag } from "react-dnd";
import type { Task } from "../../types/project";
import {
  typeIconMap,
  typeColorMap,
  priorities,
  priorityColorMap,
  childTypeMap,
} from "../../types/project";
import { isOverdue } from "../../utils/date";

interface Props {
  task: Task;
  allTasks: Task[];
  onClick: (task: Task) => void;
  index: number;
}

export function BoardCard({ task, allTasks, onClick, index }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const TypeIcon = typeIconMap[task.type];
  const overdue = task.deadline ? isOverdue(task.deadline, task.status) : false;
  const doneCount = task.subtasks.filter((s) => s.done).length;
  const parent = task.parentId
    ? allTasks.find((t) => t.id === task.parentId)
    : null;

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "task",
      item: { task, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [task, index],
  );

  useEffect(() => {
    drag(cardRef);
  }, [drag]);

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(task)}
      className={`bg-white p-3.5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition cursor-move group ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      {/* Parent breadcrumb */}
      {parent && (
        <div className="flex items-center gap-1 text-[10px] text-gray-400 mb-1.5">
          {(() => {
            const PI = typeIconMap[parent.type];
            return <PI className={typeColorMap[parent.type]} size={9} />;
          })()}
          <span className="truncate max-w-30">{parent.title}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-start gap-2.5 mb-3">
        <TypeIcon className={`${typeColorMap[task.type]} mt-0.5 shrink-0`} />
        <span className="text-[14px] font-medium text-gray-800 flex-1 leading-snug">
          {task.title}
        </span>
      </div>

      {/* Meta */}
      <div className="space-y-2 ml-5">
        {task.assigned_to.length > 0 ? (
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2">
              {task.assigned_to.slice(0, 2).map((u, i) => (
                <img key={i} src={u.avt} title={u.display_name} className="w-5 h-5 rounded-full border-2 border-white" />
              ))}
              {task.assigned_to.length > 2 && (
                <span className="w-5 h-5 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[9px] font-bold text-purple-700">
                  +{task.assigned_to.length - 2}
                </span>
              )}
            </div>
            <span className="text-[12px] text-gray-500">
              {task.assigned_to.length === 1
                ? task.assigned_to[0].display_name
                : `${task.assigned_to.length} people`}
            </span>
          </div>
        ) : (
          <span className="text-[12px] text-gray-300 italic">Unassigned</span>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Subtask counter */}
            <div className="flex items-center gap-1 text-gray-400">
              <TbSubtask size={13} />
              <span className="text-[12px] bg-gray-100 px-1.5 rounded-full">
                {doneCount}/{task.subtasks.length}
              </span>
            </div>
            {/* Children badge (epic→story, story→task) */}
            {childTypeMap[task.type] && (task.childIds?.length ?? 0) > 0 && (
              <span className="flex items-center gap-0.5 text-[11px] text-gray-400 bg-gray-100 px-1.5 rounded-full">
                {task.type === "epic" ? (
                  <FaBook size={9} />
                ) : (
                  <FaTasks size={9} />
                )}
                {task.childIds!.length}
              </span>
            )}
          </div>
          <span
            className={`text-[12px] font-medium ${overdue ? "text-red-600" : "text-gray-400"}`}
          >
            {overdue && "⚠ "}
            {task.deadline ?? "No deadline"}
          </span>
        </div>
      </div>

      {/* Priority bar */}
      <div className="flex gap-0.5 h-1 mt-3 ml-5">
        {priorities.map((p, i) => (
          <div
            key={p}
            className={`flex-1 rounded-sm ${i <= priorities.indexOf(task.priority) ? priorityColorMap[p] : "bg-gray-200"}`}
          />
        ))}
      </div>
    </div>
  );
}
