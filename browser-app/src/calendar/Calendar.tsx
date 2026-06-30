import type { CalendarEvent, ViewMode } from "../types/calendar";
import {
  DAYS,
  getDaysInMonth,
  getFirstDayOfMonth,
  timeToMinutes,
  getEventColorStyles,
} from "../types/calendar";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type CalendarProps = {
  today: Date;
  viewMode: ViewMode;
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | undefined;
  events: CalendarEvent[];
  weekDays: Date[];
  dayViewDate: Date;
  onSelectDate: (date: Date) => void;
  onDoubleClickDate: (date: Date) => void;
};

function getLayoutEvents(dayEvents: CalendarEvent[]) {
  // Sort events by start time, then by end time
  const sorted = [...dayEvents].sort((a, b) => {
    const startA = timeToMinutes(a.time);
    const startB = timeToMinutes(b.time);
    if (startA !== startB) return startA - startB;
    return timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
  });

  const columns: CalendarEvent[][] = [];
  const eventToColumnIndex = new Map<string, number>();
  const eventToGroupColumnsCount = new Map<string, number>();
  
  let groupEvents: CalendarEvent[] = [];
  let groupEnd = 0;

  const finalizeGroup = () => {
    if (groupEvents.length === 0) return;
    const colCount = columns.length;
    for (const ev of groupEvents) {
      eventToGroupColumnsCount.set(ev.id, colCount);
    }
    columns.length = 0;
    groupEvents = [];
    groupEnd = 0;
  };

  for (const ev of sorted) {
    const evStart = timeToMinutes(ev.time);
    
    // If this event starts at or after the groupEnd, finalize previous group
    if (evStart >= groupEnd) {
      finalizeGroup();
    }
    
    let placedColIdx = -1;
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const lastEv = col[col.length - 1];
      const lastEnd = timeToMinutes(lastEv.endTime);
      if (lastEnd <= evStart) {
        placedColIdx = c;
        col.push(ev);
        break;
      }
    }
    
    if (placedColIdx === -1) {
      placedColIdx = columns.length;
      columns.push([ev]);
    }
    
    eventToColumnIndex.set(ev.id, placedColIdx);
    groupEvents.push(ev);
    const evEnd = timeToMinutes(ev.endTime);
    groupEnd = Math.max(groupEnd, evEnd);
  }
  
  finalizeGroup();

  return sorted.map((ev) => {
    const colIdx = eventToColumnIndex.get(ev.id) ?? 0;
    const colCount = eventToGroupColumnsCount.get(ev.id) ?? 1;
    return {
      event: ev,
      colIdx,
      colCount,
    };
  });
}

function TimeGrid({
  dates,
  today,
  events,
  onSelectDate,
  onDoubleClickDate,
}: {
  dates: Date[];
  today: Date;
  events: CalendarEvent[];
  onSelectDate: (d: Date) => void;
  onDoubleClickDate: (d: Date) => void;
}) {
  const eventsForDate = (date: Date) =>
    events.filter(
      (e) =>
        e.date.getFullYear() === date.getFullYear() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate(),
    );

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="sticky top-0 z-10 bg-white border-b border-gray-100"
        style={{
          display: "grid",
          gridTemplateColumns: `56px repeat(${dates.length}, 1fr)`,
        }}
      >
        <div className="border-r border-gray-100" />
        {dates.map((date, i) => {
          const isTodayCol = date.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              className="text-center py-2 border-r border-gray-100 last:border-r-0"
            >
              <p className="text-[10px] font-heading font-semibold text-gray-400 uppercase">
                {DAYS[date.getDay()]}
              </p>
              <div
                className={`mx-auto mt-0.5 w-7 h-7 flex items-center justify-center rounded-lg text-sm font-heading font-semibold ${
                  isTodayCol ? "bg-purple-800 text-white" : "text-gray-700"
                }`}
              >
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative" style={{ minHeight: `${24 * 60}px` }}>
        {HOURS.map((h) => (
          <div
            key={h}
            className="absolute w-full flex"
            style={{ top: `${h * 60}px`, height: "60px" }}
          >
            <div className="w-14 shrink-0 flex items-start justify-end pr-2 pt-0.5">
              <span className="text-[10px] text-gray-400 font-heading">
                {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </span>
            </div>
            <div className="flex-1 border-t border-gray-100" />
          </div>
        ))}

        <div className="absolute inset-0 flex" style={{ left: "56px" }}>
          {dates.map((date, di) => {
            const dayEvts = eventsForDate(date);
            const layoutEvents = getLayoutEvents(dayEvts);
            return (
              <div
                key={di}
                className="flex-1 relative border-r border-gray-100 last:border-r-0 cursor-pointer hover:bg-purple-50/30 transition-colors"
                onDoubleClick={() => onDoubleClickDate(date)}
                onClick={() => onSelectDate(date)}
              >
                {layoutEvents.map(({ event: ev, colIdx, colCount }) => {
                  const startMin = timeToMinutes(ev.time);
                  const endMin = timeToMinutes(ev.endTime);
                  const height = Math.max(endMin - startMin, 20);
                  const colorStyles = getEventColorStyles(ev.color);
                  return (
                    <div
                      key={ev.id}
                      className={`absolute rounded-md px-2 py-1 overflow-hidden cursor-pointer hover:shadow-sm transition-shadow ${colorStyles.className}`}
                      style={{ 
                        top: `${startMin}px`, 
                        height: `${height}px`,
                        left: `calc(${(colIdx * 100) / colCount}% + 2px)`,
                        width: `calc(${100 / colCount}% - 4px)`,
                        ...colorStyles.style
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[10px] font-heading font-semibold truncate">
                        {ev.title}
                      </p>
                      <p className="text-[9px] font-heading opacity-70">
                        {ev.time} – {ev.endTime}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Calendar({
  today,
  viewMode,
  currentMonth,
  currentYear,
  selectedDate,
  events,
  weekDays,
  dayViewDate,
  onSelectDate,
  onDoubleClickDate,
}: CalendarProps) {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const eventsForDate = (date: Date) =>
    events.filter(
      (e) =>
        e.date.getFullYear() === date.getFullYear() &&
        e.date.getMonth() === date.getMonth() &&
        e.date.getDate() === date.getDate(),
    );

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    return day;
  });
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  if (viewMode === "Week")
    return (
      <TimeGrid
        dates={weekDays}
        today={today}
        events={events}
        onSelectDate={onSelectDate}
        onDoubleClickDate={onDoubleClickDate}
      />
    );

  if (viewMode === "Day")
    return (
      <TimeGrid
        dates={[dayViewDate]}
        today={today}
        events={events}
        onSelectDate={onSelectDate}
        onDoubleClickDate={onDoubleClickDate}
      />
    );

  return (
    <>
      <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-heading font-semibold text-gray-800 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <div
          className="grid grid-cols-7 h-full"
          style={{ minHeight: `${weeks.length * 120}px` }}
        >
          {weeks.flatMap((week, wi) =>
            week.map((day, di) => {
              if (day === null)
                return (
                  <div
                    key={`${wi}-${di}`}
                    className="border-b border-r border-gray-100 bg-gray-50/50 min-h-24"
                  />
                );

              const date = new Date(currentYear, currentMonth, day);
              const dayEvents = eventsForDate(date);
              const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();
              const isSelected =
                selectedDate &&
                day === selectedDate.getDate() &&
                currentMonth === selectedDate.getMonth() &&
                currentYear === selectedDate.getFullYear();

              return (
                <div
                  key={`${wi}-${di}`}
                  className={`border-b border-r border-gray-100 min-h-24 p-1.5 flex flex-col gap-1 transition-colors cursor-pointer ${
                    isSelected ? "bg-purple-200/30" : "hover:bg-purple-200/30"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(date);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onDoubleClickDate(date);
                  }}
                >
                  <div
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-heading font-semibold mb-0.5 self-center ${
                      isToday
                        ? "bg-purple-800 text-white"
                        : isSelected
                          ? "bg-purple-200 text-gray-700"
                          : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-0.5 max-h-32">
                    {dayEvents.slice(0, 3).map((event) => {
                      const colorStyles = getEventColorStyles(event.color);
                      return (
                        <div
                          key={event.id}
                          className={`text-[10px] font-heading font-medium rounded-md px-2 py-1 cursor-pointer truncate hover:brightness-95 transition-all ${colorStyles.solidClass}`}
                          style={colorStyles.solidStyle}
                        >
                          {event.time} {event.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-gray-500 font-medium px-2 py-0.5 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </>
  );
}
