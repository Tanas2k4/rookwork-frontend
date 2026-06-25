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
        background: `linear-gradient(90deg, ${color}cc, ${color}88)`,
        border: `1px solid ${color}66`,
        boxShadow: isHovered
          ? `0 2px 12px ${color}44`
          : `0 1px 4px ${color}22`,
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
          background: `${color}55`,
          borderRadius: "6px 0 0 6px",
          transition: "width 0.4s ease",
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, paddingLeft: 8, paddingRight: 6, width: "100%", overflow: "hidden" }}>
        {width > 80 && (
          <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
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
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 700, flexShrink: 0, marginLeft: "auto", paddingRight: 2 }}>
            {task.progress}%
          </span>
        )}
      </div>
    </div>
  );
}