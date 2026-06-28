import { TfiTrash } from "react-icons/tfi";
import { getEventColorStyles } from "../types/calendar";
import type { CalendarEvent } from "../types/calendar";
import { avatarUrl } from "../utils/avatar";

type ItemsDetailProps = {
  selectedDate: Date | undefined;
  events: CalendarEvent[];
  onDeleteEvent: (id: string) => void;
};

function EventCard({
  ev,
  onDelete,
}: {
  ev: CalendarEvent;
  onDelete: (id: string) => void;
}) {
  const colorStyles = getEventColorStyles(ev.color);
  return (
    <div
      className={`rounded-xl p-3 flex flex-col gap-2 group cursor-pointer hover:shadow-sm transition-shadow ${colorStyles.className}`}
      style={colorStyles.style}
    >
      <div className="flex items-start gap-2">
        <p className="px-3 text-base font-heading font-medium tracking-wide leading-snug flex-1">
          {ev.title}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(ev.id);
          }}
          title="Delete event"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-gray-300 hover:text-red-500 shrink-0"
        >
          <TfiTrash size={16} />
        </button>
      </div>
      <div className="flex items-center gap-1 pl-3.5 text-gray-600">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <span className="text-[10px] font-heading font-medium">
          {ev.time} - {ev.endTime}
        </span>
      </div>
      {ev.location && (
        <div className="flex items-center gap-1 pl-3.5 text-gray-600">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          <span className="text-[10px] font-heading truncate">
            {ev.location}
          </span>
        </div>
      )}
      {ev.guests.length > 0 && (
        <div className="pl-3.5 flex items-center gap-1 mt-0.5">
          <div className="flex -space-x-1.5">
            {ev.guests.slice(0, 4).map((g, i) => (
              <img
                key={g.name}
                title={g.name}
                style={{ zIndex: 10 - i }}
                src={avatarUrl(g.name, g.picture)}
                alt={g.name}
                className="relative w-5 h-5 rounded-full overflow-hidden border border-white object-cover bg-gray-100 shrink-0"
              />
            ))}
          </div>
          <span className="text-[9px] font-heading text-gray-600 ml-1">
            {ev.guests.length} guest{ev.guests.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ItemsDetail({
  selectedDate,
  events,
  onDeleteEvent,
}: ItemsDetailProps) {
  if (!selectedDate) return null;

  const dayEvents = events.filter(
    (e) =>
      e.date.getFullYear() === selectedDate.getFullYear() &&
      e.date.getMonth() === selectedDate.getMonth() &&
      e.date.getDate() === selectedDate.getDate(),
  );

  return (
    <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
      <div className="flex flex-row items-center justify-between">
        <div>
          <p className="text-[10px] font-heading font-semibold text-gray-400 uppercase tracking-widest">
            {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
          </p>
          <p className="text-2xl font-heading font-semibold text-gray-800 leading-none mt-0.5">
            {selectedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>

        {dayEvents.length > 0 && (
          <span className="flex items-center justify-center min-w-6 h-6 text-sm font-heading font-semibold text-gray-700 bg-gray-200 rounded-full px-2">
            {dayEvents.length}
          </span>
        )}
      </div>

      {dayEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-gray-300"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p className="text-[11px] text-gray-300 font-heading font-medium">
            No events scheduled
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 min-h-0">
          {dayEvents.map((ev) => (
            <EventCard key={ev.id} ev={ev} onDelete={onDeleteEvent} />
          ))}
        </div>
      )}
    </div>
  );
}
