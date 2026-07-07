import { useState, useRef, useEffect, startTransition } from "react";
import type { GanttTask } from "./timelineUtils";

interface GanttBarProps {
  task: GanttTask;
  x: number;
  y: number;
  width: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onOpenModal: (uuid: string) => void;
  colWidth: number;
  timelineStart: Date;
  onUpdateDates?: (taskId: string, newStart: Date, newEnd: Date) => void;
  onStartLink?: (taskId: string, startX: number, startY: number) => void;
  onEndLink?: (targetId: string) => void;
  linkingSourceId?: string | null;
}

export function GanttBar({
  task,
  x,
  y,
  width,
  isHovered,
  onHover,
  onOpenModal,
  colWidth,
  timelineStart,
  onUpdateDates,
  onStartLink,
  onEndLink,
  linkingSourceId,
}: GanttBarProps) {
  const color = task.color || "#6366f1";
  const barH = 28;

  const [dragState, setDragState] = useState<{
    type: "move" | "resize-left" | "resize-right";
    startX: number;
    initialX: number;
    initialWidth: number;
  } | null>(null);

  const [localX, setLocalX] = useState<number | null>(null);
  const [localWidth, setLocalWidth] = useState<number | null>(null);
  const localXRef = useRef<number | null>(null);
  const localWidthRef = useRef<number | null>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    if (!dragState) {
      localXRef.current = null;
      localWidthRef.current = null;
      startTransition(() => {
        setLocalX(null);
        setLocalWidth(null);
      });
    }
  }, [x, width, dragState]);

  const handleMouseDown = (
    e: React.MouseEvent,
    type: "move" | "resize-left" | "resize-right"
  ) => {
    e.stopPropagation();
    e.preventDefault();
    didDrag.current = false;
    setDragState({
      type,
      startX: e.clientX,
      initialX: x,
      initialWidth: width,
    });
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragState.startX;
      if (Math.abs(dx) > 3) {
        didDrag.current = true;
      }

      if (dragState.type === "move") {
        const nx = dragState.initialX + dx;
        setLocalX(nx);
        localXRef.current = nx;
      } else if (dragState.type === "resize-left") {
        const newX = dragState.initialX + dx;
        const newWidth = dragState.initialWidth - dx;
        if (newWidth >= colWidth * 0.4) {
          setLocalX(newX);
          setLocalWidth(newWidth);
          localXRef.current = newX;
          localWidthRef.current = newWidth;
        }
      } else if (dragState.type === "resize-right") {
        const newWidth = dragState.initialWidth + dx;
        if (newWidth >= colWidth * 0.4) {
          setLocalWidth(newWidth);
          localWidthRef.current = newWidth;
        }
      }
    };

    const handleMouseUp = () => {
      const finalX = localXRef.current !== null ? localXRef.current : x;
      const finalWidth = localWidthRef.current !== null ? localWidthRef.current : width;

      if (finalX !== x || finalWidth !== width) {
        const startDays = Math.round(finalX / colWidth);
        const endDays = Math.round((finalX + finalWidth) / colWidth);

        const newStart = new Date(timelineStart);
        newStart.setDate(newStart.getDate() + startDays);

        const newEnd = new Date(timelineStart);
        newEnd.setDate(newEnd.getDate() + endDays);

        onUpdateDates?.(task.id, newStart, newEnd);
      }
      setDragState(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, x, width, colWidth, timelineStart, onUpdateDates, task.id]);

  const displayX = localX !== null ? localX : x;
  const displayWidth = localWidth !== null ? localWidth : width;

  const handleConnectorMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onStartLink?.(task.id, displayX + displayWidth, y + 14);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: displayX,
        width: displayWidth,
        height: barH,
        borderRadius: 6,
        background: `${color}a6`,
        border: `1px solid ${color}`,
        boxShadow: isHovered
          ? `0 2px 12px ${color}33`
          : `0 1px 4px ${color}11`,
        pointerEvents: "auto",
        cursor: dragState ? (dragState.type === "move" ? "grabbing" : "ew-resize") : "pointer",
        transition: dragState ? "none" : "box-shadow 0.15s, transform 0.15s",
        transform: isHovered && !dragState ? "scaleY(1.08)" : "scaleY(1)",
        display: "flex",
        alignItems: "center",
        overflow: "visible",
      }}
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => {
        if (!dragState) {
          onHover(null);
        }
      }}
      onMouseDown={(e) => handleMouseDown(e, "move")}
      onMouseUp={(e) => {
        if (linkingSourceId && linkingSourceId !== task.id) {
          e.stopPropagation();
          onEndLink?.(task.id);
        }
      }}
      onClick={() => {
        if (didDrag.current) return;
        onOpenModal(task.id);
      }}
      title={task.name}
    >
      {/* Progress fill */}
      <div
        style={{
          position: "absolute",
          left: 0, top: 0,
          height: "100%",
          width: `${task.progress}%`,
          background: task.progress > 0 && task.progress < 100
            ? `linear-gradient(90deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.15) calc(100% - 12px), rgba(0, 0, 0, 0) 100%), linear-gradient(90deg, ${color} 0%, ${color} calc(100% - 12px), ${color}a6 100%)`
            : `linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)), ${color}`,
          borderRadius: task.progress === 100 ? "6px" : "6px 0 0 6px",
          borderRight: task.progress > 0 && task.progress < 100 ? "1px solid rgba(255, 255, 255, 0.2)" : "none",
          boxShadow: task.progress > 0 && task.progress < 100 ? "1px 0 2px rgba(0, 0, 0, 0.1)" : "none",
          transition: "width 0.4s ease",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, paddingLeft: 8, paddingRight: 8, width: "100%", overflow: "hidden" }}>
        {displayWidth > 80 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textShadow: "0 1px 3px rgba(15,23,42,0.6)", userSelect: "none" }}>
            {task.name}
          </span>
        )}

        {/* Avatar on bar */}
        {displayWidth > 130 && task.assignees && task.assignees.map((a, i) => i < 2 && (
          <img
            key={a.id}
            src={a.avatar}
            alt={a.name}
            title={a.name}
            style={{
              width: 18, height: 18,
              borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.6)",
              marginLeft: i === 0 ? 0 : -6,
              objectFit: "cover",
              flexShrink: 0,
            }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ))}

        {displayWidth > 60 && (
          <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0, marginLeft: "auto", paddingRight: 2, textShadow: "0 1px 3px rgba(15,23,42,0.6)", userSelect: "none" }}>
            {task.progress}%
          </span>
        )}
      </div>

      {/* Left resize handle */}
      {(isHovered || dragState) && (
        <div
          style={{
            position: "absolute",
            left: -4,
            top: 0,
            width: 8,
            height: "100%",
            cursor: "ew-resize",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={(e) => handleMouseDown(e, "resize-left")}
        >
          <div
            style={{
              width: 2,
              height: 14,
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              borderRadius: 1,
              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      )}

      {/* Right resize handle */}
      {(isHovered || dragState) && (
        <div
          style={{
            position: "absolute",
            right: -4,
            top: 0,
            width: 8,
            height: "100%",
            cursor: "ew-resize",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseDown={(e) => handleMouseDown(e, "resize-right")}
        >
          <div
            style={{
              width: 2,
              height: 14,
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              borderRadius: 1,
              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      )}

      {/* Connector handle for dependency */}
      {isHovered && !dragState && !linkingSourceId && (
        <div
          style={{
            position: "absolute",
            right: -6,
            top: 7,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "#4f46e5",
            border: "2px solid #fff",
            cursor: "crosshair",
            zIndex: 30,
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
          onMouseDown={handleConnectorMouseDown}
          title="Drag to link dependency"
        />
      )}
    </div>
  );
}