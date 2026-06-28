import { useState, useEffect, useRef } from "react";
import { HiX, HiChevronDown } from "react-icons/hi";
import type { EventForm } from "../types/calendar";
import { EVENT_COLORS } from "../types/calendar";
import { eventApi } from "../api/services/eventApi";
import { userApi } from "../api/services/userApi";
import type { ProjectResponse, UserSummary } from "../api/contracts";
import type { Toast } from "../types/project";
import { avatarUrl } from "../utils/avatar";

import type { EventResponse } from "../api/contracts/event";

type CreateEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdEvent: EventResponse) => void;
  userProjects: ProjectResponse[];
  initialProjectId?: string;
  initialDate?: string;
  disableProjectSelect?: boolean;
  addToast: (message: string, type: Toast["type"]) => void;
};

const getPresetHex = (colorValue: string) => {
  if (colorValue === "bg-violet-800/70") return "#5b21b6"; // violet-800
  if (colorValue === "bg-sky-800/70") return "#075985"; // sky-800
  if (colorValue === "bg-emerald-800/70") return "#065f46"; // emerald-800
  if (colorValue === "bg-amber-800/70") return "#92400e"; // amber-800
  if (colorValue === "bg-pink-800/70") return "#9d174d"; // pink-800
  if (colorValue === "bg-rose-800/70") return "#9f1239"; // rose-800
  if (colorValue === "bg-indigo-800/70") return "#3730a3"; // indigo-800
  return "#8b5cf6";
};

export default function CreateEventModal({
  isOpen,
  onClose,
  onSuccess,
  userProjects,
  initialProjectId = "",
  initialDate = "",
  disableProjectSelect = false,
  addToast,
}: CreateEventModalProps) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);

  const [form, setForm] = useState<EventForm & { projectId: string }>({
    title: "",
    date: initialDate || new Date().toISOString().split("T")[0],
    time: "09:00",
    endTime: "10:00",
    location: "",
    note: "",
    color: "bg-violet-800/70",
    guestInput: "",
    guests: [],
    projectId: initialProjectId,
  });

  // Sync initial values when modal opens or initial values change
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((f) => ({
        ...f,
        date: initialDate || new Date().toISOString().split("T")[0],
        projectId: initialProjectId,
        title: "",
        time: "09:00",
        endTime: "10:00",
        location: "",
        note: "",
        color: "bg-violet-800/70",
        guestInput: "",
        guests: [],
      }));
      setShowProjectDropdown(false);
    }
  }, [isOpen, initialDate, initialProjectId]);

  // Fetch current user details when modal opens
  useEffect(() => {
    if (isOpen && !currentUser) {
      userApi
        .getMe()
        .then(setCurrentUser)
        .catch((err) =>
          console.error("Failed to load current user details", err),
        );
    }
  }, [isOpen, currentUser]);


  // Close project dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        projectDropdownRef.current &&
        !projectDropdownRef.current.contains(e.target as Node)
      ) {
        setShowProjectDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addGuest = () => {
    const emailInput = form.guestInput.trim();
    if (!emailInput) return;

    // Check if the user is inviting themselves
    if (
      currentUser &&
      emailInput.toLowerCase() === currentUser.email.toLowerCase()
    ) {
      addToast("You cannot invite yourself as a guest", "error");
      return;
    }

    // Check if already in guests list
    if (
      form.guests.some(
        (g) => g.email?.toLowerCase() === emailInput.toLowerCase(),
      )
    ) {
      addToast("This guest is already added", "error");
      return;
    }

    // If project is linked, guest must be a member of the selected project
    if (form.projectId) {
      const selectedProj = userProjects.find((p) => p.id === form.projectId);
      if (selectedProj) {
        const isMember = selectedProj.members?.some(
          (m) => m.email && m.email.toLowerCase() === emailInput.toLowerCase(),
        );
        if (!isMember) {
          addToast("Guest must be a member of the selected project", "error");
          return;
        }
      }
    }

    // Search in userProjects members to find matching email
    let foundMember: UserSummary | null = null;
    for (const project of userProjects) {
      if (project.members) {
        const match = project.members.find(
          (m) => m.email && m.email.toLowerCase() === emailInput.toLowerCase(),
        );
        if (match) {
          foundMember = match;
          break;
        }
      }
    }

    const name: string = foundMember ? foundMember.profileName : emailInput;
    const picture = foundMember?.picture || undefined;
    const email = foundMember ? foundMember.email : emailInput;
    const avatar = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    setForm((f) => ({
      ...f,
      guests: [
        ...f.guests,
        {
          name,
          role: "attendee",
          avatar,
          picture,
          email,
        },
      ],
      guestInput: "",
    }));
  };

  const addMemberAsGuest = (member: UserSummary) => {
    if (!member.email) return;

    if (
      currentUser &&
      member.email.toLowerCase() === currentUser.email.toLowerCase()
    ) {
      addToast("You cannot invite yourself as a guest", "error");
      return;
    }

    if (
      form.guests.some(
        (g) => g.email?.toLowerCase() === member.email.toLowerCase(),
      )
    ) {
      addToast("This guest is already added", "error");
      return;
    }

    const name = member.profileName;
    const picture = member.picture || undefined;
    const email = member.email;
    const avatar = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    setForm((f) => ({
      ...f,
      guests: [
        ...f.guests,
        {
          name,
          role: "attendee",
          avatar,
          picture,
          email,
        },
      ],
    }));
  };

  const selectedProject = form.projectId
    ? userProjects.find((p) => p.id === form.projectId)
    : null;

  const availableMembers = selectedProject
    ? (selectedProject.members || []).filter(
        (m) =>
          m.email &&
          (!currentUser ||
            m.email.toLowerCase() !== currentUser.email.toLowerCase()) &&
          !form.guests.some(
            (g) => g.email?.toLowerCase() === m.email.toLowerCase(),
          ),
      )
    : [];

  const handleCreateEvent = async () => {
    if (!form.title || !form.date) return;

    const [y, m, d] = form.date.split("-").map(Number);
    const [startH, startM] = form.time.split(":").map(Number);
    const [endH, endM] = form.endTime.split(":").map(Number);

    const startTimeISO = new Date(y, m - 1, d, startH, startM).toISOString();
    const endTimeISO = new Date(y, m - 1, d, endH, endM).toISOString();
    const guestEmails = form.guests.map((g) => g.email || g.name);

    try {
      const created = await eventApi.create({
        eventName: form.title,
        eventDescription: form.note || undefined,
        startTime: startTimeISO,
        endTime: endTimeISO,
        location: form.location || undefined,
        color: form.color,
        guestEmails: guestEmails.length > 0 ? guestEmails : undefined,
        projectId: form.projectId || undefined,
      });

      onSuccess(created);
      onClose();
      addToast(`Event "${created.eventName}" created successfully!`, "success");
    } catch (err) {
      console.error("Failed to create event", err);
      const msg = err instanceof Error ? err.message : "Failed to create event";
      addToast(msg, "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-999 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">New Event</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
          >
            <HiX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {/* Event Name */}
          <div>
            <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
              Event Name
            </label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-heading outline-none  
              focus:border-purple-400 focus:ring-1 focus:ring-purple-700 transition bg-white"
              placeholder="e.g. Kickoff sprint"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
            />
          </div>

          {/* Project Selection */}
          <div className="relative" ref={projectDropdownRef}>
            <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
              Project Link (Optional)
            </label>
            <div className="relative">
              <button
                type="button"
                disabled={disableProjectSelect}
                onClick={() => setShowProjectDropdown((v) => !v)}
                className="w-full flex items-center justify-between border border-gray-200 rounded-md px-3 py-2 text-sm font-heading outline-none 
                transition bg-white disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer"
              >
                <span>
                  {form.projectId
                    ? userProjects.find((p) => p.id === form.projectId)
                        ?.projectName || "Personal Event"
                    : "Personal Event"}
                </span>
                <HiChevronDown
                  size={16}
                  className={`text-gray-500 transition-transform duration-200 ${
                    showProjectDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProjectDropdown && !disableProjectSelect && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-md z-50 py-1 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, projectId: "" }));
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-heading transition-colors ${
                      !form.projectId
                        ? "bg-gray-50 text-purple-800 font-semibold"
                        : "text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    Personal Event
                  </button>
                  {userProjects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setForm((f) => {
                          const filteredGuests = p.members
                            ? f.guests.filter((g) =>
                                p.members!.some(
                                  (m) =>
                                    m.email &&
                                    m.email.toLowerCase() ===
                                      g.email?.toLowerCase(),
                                ),
                              )
                            : f.guests;
                          return {
                            ...f,
                            projectId: p.id,
                            guests: filteredGuests,
                          };
                        });
                        setShowProjectDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-heading transition-colors ${
                        form.projectId === p.id
                          ? "bg-purple-50 text-purple-900 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {p.projectName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date and Time Layout */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                Date
              </label>
              <input
                type="date"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm font-heading outline-none transition bg-white text-gray-700"
                value={form.date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                Start Time
              </label>
              <input
                type="time"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm font-heading outline-none transition bg-white text-gray-700"
                value={form.time}
                onChange={(e) =>
                  setForm((f) => ({ ...f, time: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
                End Time
              </label>
              <input
                type="time"
                className="w-full border border-gray-200 rounded-md px-3 py-2.5 text-sm font-heading outline-none transition bg-white text-gray-700"
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
              type="text"
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-heading outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-700 transition bg-white"
              placeholder="e.g. Online or Conference Room A"
              value={form.location}
              onChange={(e) =>
                setForm((f) => ({ ...f, location: e.target.value }))
              }
            />
          </div>

          {/* Guests */}
          <div>
            <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
              Guests (Emails)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm font-heading outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-700 transition bg-white"
                placeholder="Guest email"
                value={form.guestInput}
                onChange={(e) =>
                  setForm((f) => ({ ...f, guestInput: e.target.value }))
                }
                onKeyDown={(e) => e.key === "Enter" && addGuest()}
              />
              <button
                type="button"
                onClick={addGuest}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 text-sm font-heading transition cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Suggested Project Members */}
            {form.projectId && availableMembers.length > 0 && (
              <div className="mt-2 mb-3">
                <span className="text-[11px] font-semibold text-purple-800 uppercase tracking-wider block mb-1.5">
                  Project Members
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-md bg-gray-200">
                  {availableMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => addMemberAsGuest(member)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-gray-100 hover:border-gray-200 shadow-xs transition-all text-xs text-gray-700 cursor-pointer "
                    >
                      <img
                        src={avatarUrl(member.profileName, member.picture)}
                        alt={member.profileName}
                        className="w-4.5 h-4.5 rounded-full object-cover shrink-0"
                      />
                      <span className="font-heading font-medium">
                        {member.profileName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {form.guests.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {form.guests.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-gray-55 rounded-md px-3 py-1.5"
                  >
                    <img
                      src={avatarUrl(g.name, g.picture)}
                      alt={g.name}
                      className="w-6 h-6 rounded-full object-cover bg-gray-100 shrink-0"
                    />
                    <span className="text-xs font-heading text-gray-700 flex-1 truncate">
                      {g.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          guests: f.guests.filter((_, j) => j !== i),
                        }))
                      }
                      className="text-gray-300 hover:text-gray-550 cursor-pointer"
                    >
                      <HiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Color Indicator */}
          <div>
            <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
              Color Indicator
            </label>
            <div className="flex gap-3 flex-wrap items-center">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${c.value} ${
                    form.color === c.value ? "scale-110" : "hover:scale-105"
                  }`}
                  style={{
                    boxShadow:
                      form.color === c.value
                        ? `0 0 0 2px #fff, 0 0 0 4px ${getPresetHex(c.value)}`
                        : undefined,
                  }}
                  title={c.label}
                />
              ))}

              {/* Custom RGB Color Picker */}
              <div
                className={`relative w-7 h-7 rounded-full border border-gray-300 overflow-hidden hover:scale-110 transition-transform cursor-pointer flex items-center justify-center shrink-0 ${
                  !form.color.startsWith("bg-") ? "scale-110" : ""
                }`}
                style={{
                  background:
                    "linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)",
                  boxShadow: !form.color.startsWith("bg-")
                    ? `0 0 0 2px #fff, 0 0 0 4px ${form.color}`
                    : undefined,
                }}
                title="Custom RGB Color"
              >
                <input
                  type="color"
                  value={form.color.startsWith("#") ? form.color : "#8b5cf6"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, color: e.target.value }))
                  }
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                {!form.color.startsWith("bg-") && (
                  <div
                    className="w-3 h-3 rounded-full bg-white border border-gray-400"
                    style={{ backgroundColor: form.color }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-heading font-semibold text-gray-500 mb-1 block">
              Note
            </label>
            <textarea
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm font-heading outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-700 transition resize-none bg-white"
              rows={2}
              placeholder="Additional notes..."
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm font-heading border border-gray-550 text-gray-700 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateEvent}
            disabled={!form.title || !form.date}
            className="px-5 py-2 rounded-md text-sm font-heading text-gray-200 bg-purple-800 hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
