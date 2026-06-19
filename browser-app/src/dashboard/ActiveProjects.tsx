import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useDrag, useDrop, useDragLayer, DndProvider } from "react-dnd";
import { HTML5Backend, getEmptyImage } from "react-dnd-html5-backend";
import { RiArrowRightSLine, RiCloseLine, RiDraggable } from "react-icons/ri";
import type { ProjectUI } from "../api/contracts/projectUI";

function AnimatedProgressBar({
  progress,
  accentColor,
  delay = 0,
}: {
  progress: number;
  accentColor: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(progress), 150 + delay);
    return () => clearTimeout(timer);
  }, [progress, delay]);

  return (
    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: accentColor,
          transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

const ITEM_TYPE = "PROJECT";

function MemberAvatars({
  members,
  size = 7,
}: {
  members: ProjectUI["members"];
  size?: number;
}) {
  if (!members?.length) return null;
  const sizeClass = size === 6 ? "w-6 h-6" : "w-7 h-7";
  const textSize = size === 6 ? "text-[9px]" : "text-[9px]";

  return (
    <div className="flex -space-x-2">
      {members.slice(0, 3).map((m, i) =>
        m.picture ? (
          <img
            key={i}
            src={m.picture}
            alt={m.profileName}
            title={m.profileName}
            className={`${sizeClass} rounded-full border-2 border-white object-cover`}
          />
        ) : (
          <div
            key={i}
            title={m.profileName}
            className={`${sizeClass} rounded-full border-2 border-white bg-purple-200 text-purple-800 ${textSize} font-bold flex items-center justify-center`}
          >
            {m.profileName[0]?.toUpperCase()}
          </div>
        ),
      )}
      {members.length > 3 && (
        <div
          className={`${sizeClass} rounded-full border-2 border-white bg-gray-100 text-gray-500 ${textSize} font-bold flex items-center justify-center`}
        >
          +{members.length - 3}
        </div>
      )}
    </div>
  );
}

function CardDragPreview({ project }: { project: ProjectUI }) {
  const badgeBg = project.daysLeft <= 5 ? "#ecfdf5" : "#fffbeb";
  const badgeColor = project.daysLeft <= 5 ? "#16a34a" : "#d97706";
  return (
    <div
      className="bg-white rounded-2xl p-5 border border-violet-300 select-none w-64"
      style={{
        boxShadow:
          "0 20px 48px rgba(124,58,237,0.18), 0 4px 16px rgba(0,0,0,0.10)",
        transform: "rotate(2deg) scale(1.03)",
      }}
    >
      <h3 className="font-heading font-bold text-gray-800 text-[15px] leading-snug mb-1 truncate">
        {project.projectName}
      </h3>
      <p className="text-xs text-gray-400 mb-4 truncate">
        {project.description ?? project.ownerName}
      </p>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-1">
        <div
          className="h-full rounded-full"
          style={{
            width: `${project.progress}%`,
            background: project.accentColor,
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] mb-4">
        <span className="text-gray-400">Progress</span>
        <span className="font-bold text-gray-700">{project.progress}%</span>
      </div>
      <div className="flex items-center justify-between">
        <MemberAvatars members={project.members} size={7} />
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: badgeBg, color: badgeColor }}
        >
          {project.daysLeft} days left
        </span>
      </div>
    </div>
  );
}

function RowDragPreview({ project }: { project: ProjectUI }) {
  const badgeBg = project.daysLeft <= 5 ? "#ecfdf5" : "#fffbeb";
  const badgeColor = project.daysLeft <= 5 ? "#16a34a" : "#d97706";
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl border border-violet-300 bg-white w-145"
      style={{
        boxShadow:
          "0 16px 40px rgba(124,58,237,0.15), 0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <RiDraggable size={16} className="text-violet-400 shrink-0" />
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: project.accentColor }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {project.projectName}
        </p>
        <p className="text-[11px] text-gray-400 truncate">
          {project.description ?? project.ownerName}
        </p>
      </div>
      <div className="w-28 shrink-0">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-gray-400">Progress</span>
          <span className="font-bold text-gray-600">{project.progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${project.progress}%`,
              background: project.accentColor,
            }}
          />
        </div>
      </div>
      <MemberAvatars members={project.members} size={6} />
      <span
        className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
        style={{ background: badgeBg, color: badgeColor }}
      >
        {project.daysLeft}d left
      </span>
    </div>
  );
}

function CustomDragLayer({ projects }: { projects: ProjectUI[] }) {
  const { isDragging, item, currentOffset, itemType } = useDragLayer(
    (monitor) => ({
      isDragging: monitor.isDragging(),
      item: monitor.getItem() as { index: number; isModal?: boolean } | null,
      currentOffset: monitor.getClientOffset(),
      itemType: monitor.getItemType(),
    }),
  );

  if (!isDragging || !currentOffset || itemType !== ITEM_TYPE || !item)
    return null;
  const project = projects[item.index];
  if (!project) return null;

  return (
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        inset: 0,
        zIndex: 9999,
      }}
    >
      <div
        style={{
          transform: `translate(${currentOffset.x + 12}px, ${currentOffset.y - 20}px)`,
        }}
      >
        {item.isModal ? (
          <RowDragPreview project={project} />
        ) : (
          <CardDragPreview project={project} />
        )}
      </div>
    </div>
  );
}

function DraggableProjectCard({
  project,
  index,
  moveProject,
}: {
  project: ProjectUI;
  index: number;
  moveProject: (from: number, to: number) => void;
}) {
  const [wasDragging, setWasDragging] = useState(false);
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      setWasDragging(false);
      return { index, isModal: false };
    },
    end: () => {
      setWasDragging(true);
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: { index: number }) {
      if (item.index === index) return;
      moveProject(item.index, index);
      item.index = index;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const badgeBg = project.daysLeft <= 5 ? "#ecfdf5" : "#fffbeb";
  const badgeColor = project.daysLeft <= 5 ? "#16a34a" : "#d97706";

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className="bg-white rounded-2xl border select-none group"
      style={{
        opacity: isDragging ? 0.3 : 1,
        borderColor: isOver && canDrop ? "#7c3aed" : "#f3f4f6",
        boxShadow:
          isOver && canDrop
            ? "0 0 0 2px #7c3aed30, 0 8px 24px rgba(124,58,237,0.12)"
            : "none",
        transition: "border-color 0.15s, box-shadow 0.15s, opacity 0.15s",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <Link
        to={`/projects/${project.id}`}
        draggable={false}
        onClick={(e) => {
          if (wasDragging) {
            e.preventDefault();
            setWasDragging(false);
          }
        }}
        className="block p-5"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] text-gray-400">
            {new Date(project.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <RiDraggable
            size={15}
            className="text-gray-200 group-hover:text-gray-400 transition-colors"
          />
        </div>
        <h3
          className="font-heading font-bold text-gray-800 text-[15px] leading-snug mb-1 truncate"
          title={project.projectName}
        >
          {project.projectName}
        </h3>
        <p className="text-xs text-gray-400 mb-4 truncate">
          {project.description ?? project.ownerName}
        </p>
        <AnimatedProgressBar
          progress={project.progress}
          accentColor={project.accentColor}
          delay={index * 80}
        />
        <div className="flex justify-between text-[11px] mb-4">
          <span className="text-gray-400">Progress</span>
          <span className="font-bold text-gray-700">{project.progress}%</span>
        </div>
        <div className="flex items-center justify-between">
          <MemberAvatars members={project.members} size={7} />
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: badgeBg, color: badgeColor }}
          >
            {project.daysLeft} days left
          </span>
        </div>
      </Link>
    </div>
  );
}

function DraggableRow({
  project,
  index,
  moveProject,
}: {
  project: ProjectUI;
  index: number;
  moveProject: (from: number, to: number) => void;
}) {
  const [wasDragging, setWasDragging] = useState(false);
  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: ITEM_TYPE,
    item: () => {
      setWasDragging(false);
      return { index, isModal: true };
    },
    end: () => {
      setWasDragging(true);
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true });
  }, [dragPreview]);

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: { index: number }) {
      if (item.index === index) return;
      moveProject(item.index, index);
      item.index = index;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const badgeBg = project.daysLeft <= 5 ? "#ecfdf5" : "#fffbeb";
  const badgeColor = project.daysLeft <= 5 ? "#16a34a" : "#d97706";

  return (
    <div
      ref={(node) => {
        drag(drop(node));
      }}
      className="rounded-xl border bg-white select-none group"
      style={{
        opacity: isDragging ? 0.3 : 1,
        borderColor: isOver && canDrop ? "#7c3aed" : "#f3f4f6",
        boxShadow:
          isOver && canDrop
            ? "0 0 0 2px #7c3aed20, 0 4px 16px rgba(124,58,237,0.10)"
            : "none",
        transition: "border-color 0.15s, box-shadow 0.15s, opacity 0.15s",
        cursor: isDragging ? "grabbing" : "grab",
      }}
    >
      <Link
        to={`/projects/${project.id}`}
        draggable={false}
        onClick={(e) => {
          if (wasDragging) {
            e.preventDefault();
            setWasDragging(false);
          }
        }}
        className="flex items-center gap-4 px-4 py-3"
      >
        <RiDraggable
          size={16}
          className="text-gray-200 group-hover:text-gray-400 transition-colors shrink-0"
        />
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ background: project.accentColor }}
        />

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {project.projectName}
          </p>
          <p className="text-[11px] text-gray-400 truncate">
            {project.description ?? project.ownerName}
          </p>
        </div>

        {/* Members */}
        <div className="shrink-0">
          <MemberAvatars members={project.members} size={6} />
        </div>
        
        {/* Progress */}
        <div className="w-28 hidden sm:block shrink-0">
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-400">Progress</span>
            <span className="font-bold text-gray-600">{project.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${project.progress}%`,
                background: project.accentColor,
              }}
            />
          </div>
        </div>

        {/* Days left */}
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
          style={{ background: badgeBg, color: badgeColor }}
        >
          {project.daysLeft}d left
        </span>

        {/* Created date */}
        <span className="text-[11px] text-gray-400 shrink-0 hidden md:block w-24 text-right">
          {new Date(project.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </Link>
    </div>
  );
}

function ViewAllModal({
  projects,
  onClose,
  onReorder,
}: {
  projects: ProjectUI[];
  onClose: () => void;
  onReorder: (from: number, to: number) => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,15,25,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-gray-50 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-2xl">
          <div>
            <h2 className="font-heading font-bold text-gray-800 text-base">
              All Projects
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {projects.length} projects · drag rows to reorder
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
          >
            <RiCloseLine size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {projects.map((project, index) => (
            <DraggableRow
              key={project.id}
              project={project}
              index={index}
              moveProject={onReorder}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ActiveProjects({
  projects,
}: {
  projects: ProjectUI[];
}) {
  const [ordered, setOrdered] = useState<ProjectUI[]>(projects);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setOrdered(projects);
  }, [projects]);

  const moveProject = (from: number, to: number) => {
    setOrdered((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };

  const visible = ordered.slice(0, 3);

  return (
    <DndProvider backend={HTML5Backend}>
      <CustomDragLayer projects={ordered} />
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading px-1 font-semibold text-gray-700 text-sm">
            Active Projects
          </h2>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-violet-600 font-medium flex items-center gap-0.5 hover:text-violet-800 transition"
          >
            View all <RiArrowRightSLine size={13} />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {visible.map((project, index) => (
            <DraggableProjectCard
              key={project.id}
              project={project}
              index={index}
              moveProject={moveProject}
            />
          ))}
        </div>
        {showModal && (
          <ViewAllModal
            projects={ordered}
            onClose={() => setShowModal(false)}
            onReorder={moveProject}
          />
        )}
      </div>
    </DndProvider>
  );
}
