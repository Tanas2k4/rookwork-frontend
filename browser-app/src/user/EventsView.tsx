import { useState, useEffect, useRef, useCallback } from "react";
import { HiChevronDown } from "react-icons/hi";
import {
  IoVideocamOutline,
  IoLocationOutline,
  IoTimeOutline,
} from "react-icons/io5";
import { FiPlus } from "react-icons/fi";
import { BsCalendar2Event } from "react-icons/bs";
import { TfiTrash } from "react-icons/tfi";

import type { CalendarEvent } from "../types/calendar";
import {
  mapToCalendarEvent,
  formatTime12h,
  getEventColorStyles,
} from "../types/calendar";
import CreateEventModal from "../calendar/CreateEventModal";
import { eventApi } from "../api/services/eventApi";
import { projectApi } from "../api/services/projectApi";
import type { ProjectResponse } from "../api/contracts";
import { ToastContainer } from "../components/common/ToastContainer";
import type { Toast } from "../types/project";
import { avatarUrl } from "../utils/avatar";
import { useProject } from "../hooks/useProject";
import { MdOutlineGroup } from "react-icons/md";

export default function EventsView() {
  const today = new Date();
  const projectContext = useProject();
  const contextProjectId = projectContext?.projectId || null;

  // View States
  const [filterMode, setFilterMode] = useState<"Upcoming" | "Past" | "All">(
    "All",
  );
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Calendar States
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [userProjects, setUserProjects] = useState<ProjectResponse[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  }, [removeToast]);

  // Load events and projects
  useEffect(() => {
    projectApi
      .getAll()
      .then((projs) => setUserProjects(projs))
      .catch((err) => console.error("Failed to load projects", err));

    const fetchEvents = () => {
      const apiCall = contextProjectId
        ? eventApi.getByProject(contextProjectId)
        : eventApi.getMyEvents();

      apiCall
        .then((res) => {
          setEvents(res.map(mapToCalendarEvent));
        })
        .catch((err) => {
          console.error("Failed to load events", err);
          addToast("Failed to load events", "error");
        });
    };

    fetchEvents();
  }, [contextProjectId, addToast]);

  // Helpers

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

  // Grouping for List View
  const filteredEvents = events.filter((ev) => {
    const evDate = new Date(ev.date);
    evDate.setHours(0, 0, 0, 0);
    const todayCopy = new Date(today);
    todayCopy.setHours(0, 0, 0, 0);

    if (filterMode === "Upcoming") {
      return evDate >= todayCopy;
    } else if (filterMode === "Past") {
      return evDate < todayCopy;
    }
    return true;
  });

  filteredEvents.sort((a, b) => {
    const diff = a.date.getTime() - b.date.getTime();
    if (diff !== 0) return diff;
    return a.time.localeCompare(b.time);
  });

  const groups: { dateKey: string; dateObj: Date; items: CalendarEvent[] }[] =
    [];
  filteredEvents.forEach((ev) => {
    const key = ev.date.toDateString();
    let g = groups.find((x) => x.dateKey === key);
    if (!g) {
      g = { dateKey: key, dateObj: ev.date, items: [] };
      groups.push(g);
    }
    g.items.push(ev);
  });

  return (
    <div className="font-heading w-full h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Header bar if global, else rendered inside project Outlet */}
      <div className="pt-4 pl-8">
        {!contextProjectId && (
          <div className="flex items-center gap-3 text-[55px] text-gray-800 font-semibold tracking-wide">
            Events
          </div>
        )}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-purple-900 hover:bg-purple-800 text-gray-200 rounded-md text-sm transition cursor-pointer"
          >
            New Event
            <FiPlus size={15} />
          </button>

          {/* Filter dropdown */}
          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setShowFilterDropdown((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-500 rounded-md text-sm text-gray-700 outline-none hover:bg-gray-50 transition-all cursor-pointer"
            >
              <span> {filterMode === "All" ? "All Events" : filterMode}</span>
              <HiChevronDown
                size={14}
                className={`text-gray-500 transition-transform duration-200 ${
                  showFilterDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showFilterDropdown && (
              <div className="absolute left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-50 py-1 w-36 overflow-hidden">
                {(["All", "Upcoming", "Past"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setFilterMode(m);
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm font-heading transition-colors ${
                      filterMode === m
                        ? "bg-gray-50 text-purple-800 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {m === "All" ? "All Events" : m}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Grouped chronological list layout matching user screenshot */}
        <div className="flex-1 overflow-y-auto px-8 py-4 flex flex-col gap-6">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 ">
              <BsCalendar2Event size={48} className="text-gray-300 mb-3" />
              <p className="text-lg font-semibold text-gray-400">
                No events found
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Try creating a new event or changing the filter
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.dateKey} className="flex gap-2 items-start">
                {/* Left Column: Date block */}
                <div className="flex flex-col items-start w-32 h-full bg-gray-100 rounded-xl shrink-0 pt-3 pl-3 ">
                  <span className="text-lg font-bold text-gray-800">
                    {group.dateObj.toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {group.dateObj.toLocaleDateString("en-US", {
                      weekday: "long",
                    })}
                  </span>
                </div>

                {/* Right Column: Event Cards List */}
                <div className="flex flex-col w-full gap-2">
                  {group.items.map((ev) => {
                    const organizer = ev.guests.find(
                      (g) => g.role === "organizer",
                    );
                    const colorStyles = getEventColorStyles(ev.color);
                    return (
                      <div
                        key={ev.id}
                        className="relative flex items-center justify-between 
                        bg-white hover:bg-neutral-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-300 p-4"
                      >
                        <div className="flex items-stretch gap-3 flex-1">
                          {/* Color bar */}
                          <div
                            className={`w-1 rounded-full shrink-0 ${colorStyles.barClass}`}
                            style={colorStyles.barStyle}
                          ></div>

                          <div className="flex flex-col gap-1 flex-1">
                            <h3 className="text-[15px] font-semibold text-gray-800">
                              {ev.title}
                            </h3>
                            {ev.note && (
                              <div className="text-[13px] text-gray-500 italic">
                                {ev.note}
                              </div>
                            )}
                            {/* Metadata */}
                            <div className="flex flex-wrap items-center gap-x-4 text-xs text-gray-500">
                              {/* Organizer */}
                              {organizer && (
                                <div className="flex items-center gap-1">
                                  <img
                                    src={avatarUrl(
                                      organizer.name,
                                      organizer.picture,
                                    )}
                                    alt={organizer.name}
                                    className="w-5 h-5 rounded-full object-cover border border-white shrink-0"
                                  />

                                  <span className=" text-gray-700">
                                    {organizer.name}
                                  </span>
                                </div>
                              )}

                              {/* Time */}
                              <div className="flex items-center gap-1">
                                <IoTimeOutline
                                  className="text-gray-400"
                                  size={13}
                                />
                                <span>{formatTime12h(ev.time)}</span>
                              </div>

                              {/* Location */}
                              {ev.location && (
                                <div className="flex items-center gap-1">
                                  {ev.location.toLowerCase() === "online" ? (
                                    <IoVideocamOutline
                                      className="text-gray-400"
                                      size={13}
                                    />
                                  ) : (
                                    <IoLocationOutline
                                      className="text-gray-400"
                                      size={13}
                                    />
                                  )}
                                  <span>{ev.location}</span>
                                </div>
                              )}

                              {/* Guests Avatar Stack (excluding organizer) */}
                              {ev.guests &&
                                ev.guests.filter((g) => g.role !== "organizer")
                                  .length > 0 &&
                                (() => {
                                  const guestAttendees = ev.guests.filter(
                                    (g) => g.role !== "organizer",
                                  );
                                  return (
                                    <div className="flex items-center gap-1">
                                      <MdOutlineGroup
                                        className="text-gray-400"
                                        size={13}
                                      />
                                      <div className="flex -space-x-1">
                                        {guestAttendees
                                          .slice(0, 5)
                                          .map((g, i) => (
                                            <img
                                              key={g.name}
                                              title={g.name}
                                              style={{ zIndex: 10 - i }}
                                              src={avatarUrl(g.name, g.picture)}
                                              alt={g.name}
                                              className="w-5 h-5 rounded-full object-cover border border-white shadow-sm shrink-0"
                                            />
                                          ))}
                                      </div>
                                      {guestAttendees.length > 5 && (
                                        <span className="text-[10px] text-gray-500 font-medium">
                                          +{guestAttendees.length - 5}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}
                            </div>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteEvent(ev.id)}
                          className="p-2 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-55 transition shrink-0 cursor-pointer"
                          title="Delete event"
                        >
                          <TfiTrash size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(created) => {
          setEvents((prev) => [...prev, mapToCalendarEvent(created)]);
        }}
        userProjects={userProjects}
        initialProjectId={contextProjectId || ""}
        disableProjectSelect={contextProjectId !== null}
        addToast={addToast}
      />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
