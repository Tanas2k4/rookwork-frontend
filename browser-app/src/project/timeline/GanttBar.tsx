import type { GanttTask } from "./timelineUtils";

interface GanttBarProps {
  task: GanttTask;
  x: number;
  y: number;
  width: number;
  isHovered: boolean;
  onHover: (id: string | null) => void;
  /** Click vào bar → mở TaskModal đầy đủ */
  onOpenModal: (uuid: string) => void;
}

export function GanttBar({ task, x, y, width, isHovered, onHover, onOpenModal }: GanttBarProps) {
  const color = task.color || "#6366f1";
  const barH = 28;

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: x,
        width,
        height: barH,
        borderRadius: 6,
        background: `${color}a6`,
        border: `1px solid ${color}`,
        boxShadow: isHovered
          ? `0 2px 12px ${color}33`
          : `0 1px 4px ${color}11`,
        pointerEvents: "all",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.15s",
        transform: isHovered ? "scaleY(1.08)" : "scaleY(1)",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
      onMouseEnter={() => onHover(task.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onOpenModal(task.id)}
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
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, paddingLeft: 8, paddingRight: 6, width: "100%", overflow: "hidden" }}>
        {width > 80 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textShadow: "0 1px 3px rgba(15,23,42,0.6)" }}>
            {task.name}
          </span>
        )}

        {/* Avatar on bar */}
        {width > 130 && task.assignees && task.assignees.map((a, i) => i < 2 && (
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

        {width > 60 && (
          <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0, marginLeft: "auto", paddingRight: 2, textShadow: "0 1px 3px rgba(15,23,42,0.6)" }}>
            {task.progress}%
          </span>
        )}
      </div>
    </div>
  );
}