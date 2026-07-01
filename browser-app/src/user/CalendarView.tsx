import { useState, useRef, useEffect, useMemo } from "react";
import { HiChevronDown } from "react-icons/hi";
import type { CalendarEvent, ViewMode } from "../types/calendar";
import {
  VIEW_OPTIONS,
  getStartOfWeek,
  mapToCalendarEvent,
} from "../types/calendar";

import MiniCalendar from "../calendar/MiniCalendar";
import ItemsDetail from "../calendar/ItemDetail";
import Calendar from "../calendar/Calendar";
import CreateEventModal from "../calendar/CreateEventModal";
import { eventApi } from "../api/services/eventApi";
import { projectApi } from "../api/services/projectApi";
import { issueApi } from "../api/services/issueApi";
import type { ProjectResponse } from "../api/contracts";
import type { IssueResponse } from "../api/contracts/issue";
import { priorityColorMap } from "../types/project";
import { apiPriorityToUI } from "../utils/issueMapper";
import { ToastContainer } from "../components/common/ToastContainer";
import type { Toast } from "../types/project";



export default function CalendarView() {
  const today = new Date();

  // State 
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const markedDates = useMemo(() => {
    const dates: Record<string, string[]> = {};

    // Add event dots
    events.forEach((ev) => {
      const year = ev.date.getFullYear();
      const month = String(ev.date.getMonth() + 1).padStart(2, "0");
      const day = String(ev.date.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;
      if (!dates[dateKey]) dates[dateKey] = [];
      dates[dateKey].push(ev.color);
    });

    // Add issue deadline dots
    issues
      .filter((i) => i.deadline && i.status?.statusCategory !== "DONE")
      .forEach((i) => {
        const dateKey = i.deadline!.split("T")[0];
        if (!dates[dateKey]) dates[dateKey] = [];
        const uiPriority = apiPriorityToUI(i.priority);
        dates[dateKey].push(priorityColorMap[uiPriority]);
      });

    return dates;
  }, [events, issues]);
  const [userProjects, setUserProjects] = useState<ProjectResponse[]>([]);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("Month");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getStartOfWeek(today));
  const [dayViewDate, setDayViewDate] = useState(today);

  const viewDropdownRef = useRef<HTMLDivElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function addToast(message: string, type: Toast["type"]) {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }

  function removeToast(id: number) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }



  // Load events, projects, and issues
  useEffect(() => {
    projectApi.getAll()
      .then((projs) => setUserProjects(projs))
      .catch((err) => console.error("Failed to load projects", err));

    eventApi.getMyEvents()
      .then((res) => {
        setEvents(res.map(mapToCalendarEvent));
      })
      .catch((err) => console.error("Failed to load events", err));

    issueApi.getAssigned()
      .then((data) => setIssues(data))
      .catch((err) => console.error("Failed to load issues", err));
  }, []);

  // Close dropdown on outside click
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

  // Helpers
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
    setSelectedDateStr(`${year}-${month}-${day}`);
    setShowCreateModal(true);
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await eventApi.delete(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      addToast("Event deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete event", err);
      const msg = err instanceof Error ? err.message : "Failed to delete event";
      addToast(msg, "error");
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="calendar-container font-heading relative flex w-full h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
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
          markedDates={markedDates}
        />

        <ItemsDetail
          selectedDate={selectedDate}
          events={events}
          onDeleteEvent={handleDeleteEvent}
        />
      </aside>

      {/* Main */}
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
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md border border-gray-500 bg-white text-sm font-heading font-medium text-gray-700
                 hover:bg-gray-50 transition-all cursor-pointer"
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
                      className={`w-full text-left px-4 py-2 text-sm font-heading transition-colors ${v === viewMode ? "text-purple-800 font-bold hover:bg-gray-50" : "text-gray-700 hover:bg-gray-100"}`}
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

      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedDateStr("");
        }}
        onSuccess={(created) => {
          setEvents((prev) => [...prev, mapToCalendarEvent(created)]);
        }}
        userProjects={userProjects}
        initialDate={selectedDateStr}
        addToast={addToast}
      />
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
