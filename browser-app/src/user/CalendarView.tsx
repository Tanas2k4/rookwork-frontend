import { useState, useRef, useEffect } from "react";
import { HiChevronDown, HiX } from "react-icons/hi";
import type { CalendarEvent, EventForm, ViewMode } from "../types/calendar";
import {
  INITIAL_EVENTS,
  EVENT_COLORS,
  VIEW_OPTIONS,
  getStartOfWeek,
} from "../types/calendar";

import MiniCalendar from "../calendar/MiniCalendar";
import ItemsDetail from "../calendar/ItemDetail";
import Calendar from "../calendar/Calendar";

//

export default function CalendarView() {
  const today = new Date();

  // State 
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(today));
  const [dayViewDate, setDayViewDate] = useState(today);

  const viewDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<EventForm>({
    title: "",
    date: today.toISOString().split("T")[0],
    time: "09:00",
    endTime: "10:00",
    location: "",
    note: "",
    color: "bg-violet-800",
    guestInput: "",
    guests: [],
  });

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        viewDropdownRef.current &&
        !viewDropdownRef.current.contains(e.target as Node)
      ) {
        setShowViewDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
    setWeekStart(getStartOfWeek(today));
    setDayViewDate(today);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());
    setWeekStart(getStartOfWeek(date));
    setDayViewDate(date);
  };

  const handleDoubleClick = (date: Date) => {
    handleSelectDate(date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    setForm((prev) => ({ ...prev, date: `${year}-${month}-${day}` }));
    setShowCreateModal(true);
  };

  const addGuest = () => {
    const name = form.guestInput.trim();
    if (!name) return;
    const avatar = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    setForm((f) => ({
      ...f,
      guests: [
        ...f.guests,
        {
          name,
          role: f.guests.length === 0 ? "organizer" : "attendee",
          avatar,
        },
      ],
      guestInput: "",
    }));
  };

  const handleCreateEvent = () => {
    if (!form.title || !form.date) return;
    const [y, m, d] = form.date.split("-").map(Number);
    const newEvent: CalendarEvent = {
      id: Date.now(),
      date: new Date(y, m - 1, d),
      time: form.time,
      endTime: form.endTime,
      title: form.title,
      color:
        form.color +
        " border border-" +
        form.color.split("-")[1] +
        "-800 text-" +
        form.color.split("-")[1] +
        "-800",
      location: form.location,
      guests:
        form.guests.length > 0
          ? form.guests
          : [{ name: "You", role: "organizer", avatar: "ME" }],
      note: form.note,
    };
    setEvents((prev) => [...prev, newEvent]);
    setShowCreateModal(false);
    setForm({
      title: "",
      date: today.toISOString().split("T")[0],
      time: "09:00",
      endTime: "10:00",
      location: "",
      note: "",
      color: "bg-violet-800",
      guestInput: "",
      guests: [],
    });
  };

  const handleDeleteEvent = (id: number) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Week days array for week view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="calendar-container font-heading relative flex w-full h-screen bg-gray-50 overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col py-5 px-4 gap-4 shrink-0 shadow-sm overflow-y-auto">
        <button
          className="text-white bg-purple-900 hover:bg-purple-800 rounded-md py-2 text-sm font-heading font-medium flex items-center justify-center gap-1.5 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setShowCreateModal(true);
          }}
        >
          Create Event
        </button>

        {/* Mini Calendar */}

        <MiniCalendar
          today={today}
          currentMonth={currentMonth}
          currentYear={currentYear}
          selectedDate={selectedDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onSelectDate={handleSelectDate}
          onDoubleClickDate={handleDoubleClick}
          onChangeMonth={setCurrentMonth}
          onChangeYear={setCurrentYear}
        />

        <ItemsDetail
          selectedDate={selectedDate}
          events={events}
          onDeleteEvent={handleDeleteEvent}
        />
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3 text-[55px] text-gray-800 font-semibold tracking-wide">
            Calendar
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="px-4 py-1.5 bg-purple-900 rounded-md text-sm font-heading font-medium text-gray-200 hover:bg-purple-800 transition-colors"
            >
              Today
            </button>

            {/* View switcher */}
            <div className="relative" ref={viewDropdownRef}>
              <button
                onClick={() => setShowViewDropdown((v) => !v)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md border border-gray-500 bg-white text-sm font-heading font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {viewMode}
                <HiChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${showViewDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {showViewDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 w-32 py-1 overflow-hidden">
                  {VIEW_OPTIONS.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setViewMode(v);
                        setShowViewDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-heading transition-colors ${v === viewMode ? "text-purple-800 font-bold hover:bg-purple-100" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendar grid */}
        <Calendar
          today={today}
          viewMode={viewMode}
          currentMonth={currentMonth}
          currentYear={currentYear}
          selectedDate={selectedDate}
          events={events}
          weekDays={weekDays}
          dayViewDate={dayViewDate}
          onSelectDate={handleSelectDate}
          onDoubleClickDate={handleDoubleClick}
        />
      </main>

      {/* Create Event Modal  */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-heading font-semibold text-gray-800">
                New Event
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-800"
              >
                <HiX size={18} />
              </button>
            </div>

            <div className="px-6 py-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              {/* Title */}
              <div>
                <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                  Title *
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-heading outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  placeholder="Event title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                  Date *
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-heading outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>

              {/* Start / End time */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                    Start
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-heading outline-none focus:ring-2 focus:ring-violet-500 transition"
                    value={form.time}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, time: e.target.value }))
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                    End
                  </label>
                  <input
                    type="time"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-heading outline-none focus:ring-2 focus:ring-violet-500 transition"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endTime: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                  Location
                </label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-heading outline-none focus:ring-2 focus:ring-violet-500 transition"
                  placeholder="zoom.us/j/..."
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </div>

              {/* Color */}
              <div>
                <label className="text-xs font-heading font-semibold text-gray-500 mb-2 block">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {EVENT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      title={c.label}
                      className={`w-7 h-7 rounded-full ${c.value} transition-transform hover:scale-110 ${form.color === c.value ? "ring-2 ring-offset-2 ring-gray-800 scale-110" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                    />
                  ))}
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                  Guests
                </label>
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-heading outline-none focus:ring-2 focus:ring-violet-500 transition"
                    placeholder="Guest name or email"
                    value={form.guestInput}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestInput: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && addGuest()}
                  />
                  <button
                    onClick={addGuest}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-800 text-sm font-heading transition"
                  >
                    Add
                  </button>
                </div>
                {form.guests.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {form.guests.map((g, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5"
                      >
                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-800 flex items-center justify-center text-[9px] font-heading font-bold">
                          {g.avatar}
                        </div>
                        <span className="text-xs font-heading text-gray-700 flex-1">
                          {g.name}
                        </span>
                        <span className="text-[9px] font-heading text-gray-800">
                          {g.role}
                        </span>
                        <button
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              guests: f.guests.filter((_, j) => j !== i),
                            }))
                          }
                          className="text-gray-300 hover:text-gray-500"
                        >
                          <HiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                  Note
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-heading outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
                  rows={2}
                  placeholder="Additional notes..."
                  value={form.note}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, note: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-heading border border-gray-500 text-gray-700 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                disabled={!form.title || !form.date}
                className="px-5 py-2 rounded-lg text-sm font-heading font-medium text-white bg-purple-800 hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
