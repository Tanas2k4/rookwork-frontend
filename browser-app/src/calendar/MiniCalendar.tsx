import { useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";
import {
  DAYS,
  MONTHS,
  MONTHS_SHORT,
  getDaysInMonth,
  getFirstDayOfMonth,
} from "../types/calendar";

type MiniCalendarProps = {
  today: Date;
  currentMonth: number;
  currentYear: number;
  selectedDate: Date | undefined;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date) => void;
  onDoubleClickDate: (date: Date) => void;
  onChangeMonth: (month: number) => void;
  onChangeYear: (year: number) => void;
  markedDates?: Set<string> | Record<string, string[]>;
};

const getPresetHex = (colorValue: string) => {
  if (colorValue === "bg-violet-800/70") return "#8b5cf6";
  if (colorValue === "bg-sky-800/70") return "#0ea5e9";
  if (colorValue === "bg-emerald-800/70") return "#10b981";
  if (colorValue === "bg-amber-800/70") return "#f59e0b";
  if (colorValue === "bg-pink-800/70") return "#ec4899";
  if (colorValue === "bg-rose-800/70") return "#f43f5e";
  if (colorValue === "bg-indigo-800/70") return "#6366f1";
  
  if (colorValue === "bg-gray-400") return "#9ca3af";
  if (colorValue === "bg-blue-500") return "#3b82f6";
  if (colorValue === "bg-amber-600") return "#d97706";
  if (colorValue === "bg-rose-600") return "#e11d48";
  
  return colorValue;
};

export default function MiniCalendar({
  today,
  currentMonth,
  currentYear,
  selectedDate,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
  onDoubleClickDate,
  onChangeMonth,
  onChangeYear,
  markedDates = new Set(),
}: MiniCalendarProps) {
  const [showPicker, setShowPicker] = useState(false);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  return (
    <div className="mini-cal">
      <div className="relative flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => setShowPicker((p) => !p)}
          className="text-2xl font-heading font-semibold text-gray-900 hover:text-purple-800 transition-colors flex items-center gap-1"
        >
          {MONTHS_SHORT[currentMonth]} {currentYear}
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onPrevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-800 transition"
          >
            <HiChevronLeft size={16} />
          </button>
          <button
            onClick={onNextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-800 transition"
          >
            <HiChevronRight size={16} />
          </button>
        </div>

        {showPicker && (
          <div
            className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 w-64 p-3 grid grid-cols-3 gap-1 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {MONTHS.map((month, idx) => (
              <button
                key={month}
                onClick={() => {
                  onChangeMonth(idx);
                  setShowPicker(false);
                }}
                className={`py-1.5 rounded-md transition-colors text-xs ${
                  idx === currentMonth
                    ? "bg-purple-100 text-purple-800 font-medium"
                    : "hover:bg-gray-100"
                }`}
              >
                {month.slice(0, 3)}
              </button>
            ))}
            <div className="col-span-3 mt-3 border-t pt-3 grid grid-cols-4 gap-1">
              {Array.from({ length: 21 }, (_, i) => currentYear - 10 + i).map(
                (y) => (
                  <button
                    key={y}
                    onClick={() => {
                      onChangeYear(y);
                      setShowPicker(false);
                    }}
                    className={`py-1.5 rounded-md transition-colors text-xs ${
                      y === currentYear
                        ? "bg-purple-100 text-purple-800 font-medium"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {y}
                  </button>
                ),
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-xs font-heading font-medium mt-2">
        {DAYS.map((day) => (
          <div key={day} className="text-gray-500 py-1 text-[10px]">
            {day.slice(0, 3)}
          </div>
        ))}

        {Array.from({ length: firstDay + daysInMonth }).map((_, i) => {
          const dayNum = i - firstDay + 1;
          const isCurrentMonth = i >= firstDay;
          const date = isCurrentMonth
            ? new Date(currentYear, currentMonth, dayNum)
            : null;

          const isToday =
            date &&
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          const isSelected =
            selectedDate &&
            date &&
            date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();

          const dateKey = isCurrentMonth
            ? `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`
            : null;

          let dayColors: string[] = [];
          if (dateKey && markedDates) {
            if (markedDates instanceof Set) {
              if (markedDates.has(dateKey)) {
                dayColors = ["bg-violet-800/70"];
              }
            } else if (typeof markedDates === "object") {
              const val = (markedDates as Record<string, string[]>)[dateKey];
              if (Array.isArray(val)) {
                dayColors = val;
              } else if (val) {
                dayColors = [String(val)];
              }
            }
          }

          return (
            <div
              key={i}
              onClick={() => {
                if (isCurrentMonth && date) onSelectDate(date);
              }}
              onDoubleClick={() => {
                if (isCurrentMonth && date) onDoubleClickDate(date);
              }}
              className={[
                "relative flex items-center justify-center aspect-square rounded-lg transition-colors text-xs font-heading",
                !isCurrentMonth
                  ? "text-gray-300 pointer-events-none"
                  : "text-gray-800 cursor-pointer",
                isToday ? "text-white bg-purple-800" : "",
                isSelected
                  ? "bg-purple-200 text-gray-700 font-semibold shadow-sm"
                  : "",
                isCurrentMonth && !isToday && !isSelected
                  ? "hover:bg-gray-100"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {isCurrentMonth ? dayNum : ""}
              {dayColors.length > 0 && (
                <div className="absolute bottom-0.75 left-0 right-0 flex items-center justify-center gap-0.5 px-0.5">
                  {dayColors.slice(0, 3).map((col, idx) => (
                    <span
                      key={idx}
                      className="w-1 h-1 rounded-full shrink-0"
                      style={{
                        backgroundColor: isToday ? "#ffffff" : getPresetHex(col),
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map(
          (_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ),
        )}
      </div>
    </div>
  );
}
