import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import WorkingHoursChart from "../dashboard/WorkingHoursChart";
import ActiveProjects from "../dashboard/ActiveProjects";
import { type ProjectUI } from "../api/contracts/projectUI";
import { RiCheckLine } from "react-icons/ri";
import Image from "../assets/image.png";
import type { TaskPriority, TaskStatus } from "../types/project";
import MiniCalendar from "../calendar/MiniCalendar";
import { issueApi } from "../api/services/issueApi";
import type { IssueResponse } from "../api/contracts/issue";
import { avatarUrl } from "../utils/avatar";
import { isOverdue } from "../utils/date";
import { priorityColorMap } from "../types/project";
import { apiPriorityToUI } from "../utils/issueMapper";
import { eventApi } from "../api/services/eventApi";
import type { CalendarEvent } from "../types/calendar";
import { mapToCalendarEvent } from "../types/calendar";
import { HiOutlineClock, HiOutlineLocationMarker } from "react-icons/hi";

//  Helpers 
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

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: "#22c55e", medium: "#f59e0b", high: "#f43f5e", urgent: "#7c3aed",
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  to_do: "To Do", in_progress: "In Progress", done: "Done",
};
const STATUS_COLOR: Record<TaskStatus, string> = {
  to_do: "#94a3b8", in_progress: "#7c3aed", done: "#22c55e",
};

function toTaskStatus(s: string | null): TaskStatus {
  const map: Record<string, TaskStatus> = {
    TO_DO: "to_do", IN_PROGRESS: "in_progress", DONE: "done",
  };
  return map[s ?? ""] ?? "to_do";
}

function toTaskPriority(p: string | null): TaskPriority {
  const map: Record<string, TaskPriority> = {
    LOW: "low", MEDIUM: "medium", HIGH: "high", URGENT: "urgent",
  };
  return map[p ?? ""] ?? "low";
}

//  Sub-components 
const WELCOME_PHRASES = [
  "A new day, a fresh start — let's work.",
  "Great things happen one task at a time.",
  "Focus, execute, and make it count today.",
  "Your best work starts right now.",
];

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

function TypewriterText() {
  const [phraseIdx, setPhraseIdx] = useState(() =>
    Math.floor(Math.random() * WELCOME_PHRASES.length),
  );
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "waiting" | "erasing">("typing");

  useEffect(() => {
    const phrase = WELCOME_PHRASES[phraseIdx];
    if (phase === "typing") {
      if (displayed.length < phrase.length) {
        const t = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 40);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("waiting"), 2200);
        return () => clearTimeout(t);
      }
    }
    if (phase === "waiting") {
      const t = setTimeout(() => setPhase("erasing"), 200);
      return () => clearTimeout(t);
    }
    if (phase === "erasing") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed((d) => d.slice(0, -1)), 18);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => {
          setPhraseIdx((i) => {
            let next = Math.floor(Math.random() * WELCOME_PHRASES.length);
            while (next === i) next = Math.floor(Math.random() * WELCOME_PHRASES.length);
            return next;
          });
          setPhase("typing");
        }, 0);
        return () => clearTimeout(t);
      }
    }
  }, [displayed, phase, phraseIdx]);

  return (
    <p className="text-sm text-gray-500 mb-1 h-5 flex items-center">
      {displayed}
      <span
        className="inline-block w-[1.5px] h-3.25 bg-gray-400 ml-px align-middle"
        style={{ animation: "blink 1s step-end infinite" }}
      />
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </p>
  );
}

function StatCard({ value, label, delta, color }: {
  value: number; label: string; delta: string; color: string;
}) {
  const num = useCountUp(value, 1200);
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 cursor-default">
      <div className="flex items-center gap-3">
        <div className="font-heading text-3xl font-bold text-gray-800 tracking-tight leading-none">{num}</div>
        <div>
          <div className="text-xs text-gray-400">{label}</div>
          <div className="text-[10px] font-semibold mt-0.5" style={{ color }}>{delta}</div>
        </div>
      </div>
    </div>
  );
}

//  Main 
interface DashboardPageProps {
  projects: ProjectUI[];
  profileName: string;
}

export default function DashboardPage({ projects, profileName }: DashboardPageProps) {
  const [issues, setIssues] = useState<IssueResponse[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  // const [loading, setLoading] = useState(true);

  const now = useMemo(() => new Date(), []);
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);


  useEffect(() => {
    issueApi.getAssigned()
      .then(setIssues)
      .catch(console.error);

    eventApi.getMyEvents()
      .then((res) => {
        setEvents(res.map(mapToCalendarEvent));
      })
      .catch(console.error);
  }, []);

  const totalIssues = issues.length;
  const doneIssues = issues.filter((i) => i.status === "DONE").length;
  const overdueIssues = issues.filter(
    (i) => i.deadline && isOverdue(i.deadline, i.status),
  ).length;

  const STATS = [
    { label: "Active Projects", value: projects.length, delta: `${projects.length} total`, color: "#7c3aed" },
    {
      label: "Tasks Done", value: doneIssues,
      delta: totalIssues > 0 ? `${Math.round((doneIssues / totalIssues) * 100)}% completed` : "0% completed",
      color: "#22c55e",
    },
    { label: "Total Tasks", value: totalIssues, delta: "assigned to you", color: "#f43f5e" },
    { label: "Overdue", value: overdueIssues, delta: "need attention", color: "#d97706" },
  ];

  const todayItems = useMemo(() => {
    const todayStr = now.toISOString().split("T")[0];

    // 1. Get events happening today
    const todayEvents = events.filter((ev) => {
      const year = ev.date.getFullYear();
      const month = String(ev.date.getMonth() + 1).padStart(2, "0");
      const day = String(ev.date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}` === todayStr;
    });

    // 2. Get tasks due today, fallback to general active tasks if none
    let filteredTasks = issues.filter((i) => {
      if (i.status === "DONE" || !i.deadline) return false;
      return i.deadline.split("T")[0] === todayStr;
    });
    
    if (filteredTasks.length === 0) {
      filteredTasks = issues.filter((i) => i.status !== "DONE").slice(0, 4);
    }

    const items = [
      ...todayEvents.map((ev) => ({
        id: ev.id,
        type: "event" as const,
        event: ev,
      })),
      ...filteredTasks.map((i) => ({
        id: i.id,
        type: "task" as const,
        issue: i,
      })),
    ];

    return items;
  }, [events, issues, now]);

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
      .filter((i) => i.deadline && i.status !== "DONE")
      .forEach((i) => {
        const dateKey = i.deadline!.split("T")[0];
        if (!dates[dateKey]) dates[dateKey] = [];
        const uiPriority = apiPriorityToUI(i.priority);
        dates[dateKey].push(priorityColorMap[uiPriority]);
      });

    return dates;
  }, [events, issues]);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gray-100 flex items-center justify-center">
  //       <p className="text-sm text-gray-400">Loading dashboard...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 xl:grid-cols-[1fr_296px] gap-5 items-start">

        {/* LEFT */}
        <div className="space-y-4 min-w-0">
          {/* Welcome */}
          <div className="bg-white rounded-2xl px-7 py-6 border border-gray-100 flex items-center justify-between overflow-hidden">
            <div>
              <TypewriterText />
              <h1 className="font-heading text-3xl font-bold tracking-tight leading-tight">
                Hi <span style={{ color: "#7c3aed" }}>{profileName}</span>!
              </h1>
            </div>
            <div className="shrink-0 w-28 h-20 flex items-center justify-center select-none">
              <img src={Image} alt="" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {STATS.map((s, i) => <StatCard key={i} {...s} />)}
          </div>

          {/* Active Projects */}
          <ActiveProjects projects={projects} />

          {/* Chart */}
          <WorkingHoursChart />
        </div>

        {/* RIGHT */}
        <div className="space-y-5 min-w-0 xl:sticky xl:top-8">
          {/* Calendar */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <MiniCalendar
              today={now}
              currentMonth={calMonth}
              currentYear={calYear}
              selectedDate={selectedDate}
              markedDates={markedDates}
              onPrevMonth={() => {
                if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
                else setCalMonth((m) => m - 1);
              }}
              onNextMonth={() => {
                if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
                else setCalMonth((m) => m + 1);
              }}
              onSelectDate={setSelectedDate}
              onDoubleClickDate={setSelectedDate}
              onChangeMonth={setCalMonth}
              onChangeYear={setCalYear}
            />
          </div>

          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-semibold text-gray-700 text-sm">
                Today — {now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </h2>
            </div>
            <div className="relative pl-4">
              <div className="absolute left-1.75 top-2 bottom-2 w-px bg-gray-200" />
              <div className="space-y-3">
                {todayItems.map((item) => {
                  if (item.type === "event") {
                    const event = item.event;
                    return (
                      <div key={event.id} className="flex gap-3">
                        <div
                          className="relative z-10 mt-1.5 w-3.5 h-3.5 -ml-4 rounded-full border-2 shrink-0 flex items-center justify-center bg-white"
                          style={{ borderColor: getPresetHex(event.color) }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: getPresetHex(event.color) }}
                          />
                        </div>
                        <div className="flex-1 rounded-xl p-3 border border-gray-100 bg-gray-50 min-w-0 block">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold truncate text-gray-700">{event.title}</p>
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 border border-purple-200 bg-purple-50 text-purple-700">
                              Event
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <HiOutlineClock className="text-gray-400 shrink-0" size={12} />
                            <span>{event.time} - {event.endTime}</span>
                          </p>
                          {event.location && (
                            <p className="text-[10px] text-gray-400 truncate mt-1 flex items-center gap-1">
                              <HiOutlineLocationMarker className="text-gray-400 shrink-0" size={12} />
                              <span>{event.location}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const issue = item.issue;
                  const status = toTaskStatus(issue.status);
                  const priority = toTaskPriority(issue.priority);
                  const isDone = status === "done";
                  const accentColor = PRIORITY_COLOR[priority];

                  return (
                    <div key={issue.id} className="flex gap-3">
                      <div
                        className="relative z-10 mt-1 w-3.5 h-3.5 -ml-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                        style={{ borderColor: isDone ? accentColor : "#e5e7eb", background: isDone ? accentColor : "white" }}
                      >
                        {isDone && <RiCheckLine size={8} color="white" />}
                      </div>
                      <Link
                        to={`/projects/${issue.projectId}/issues/${issue.id}`}
                        draggable={false}
                        className="flex-1 rounded-xl p-3 border min-w-0 block transition-opacity hover:opacity-80 bg-gray-100 border-gray-100"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold truncate text-gray-700">{issue.issueName}</p>
                          <span
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 border"
                            style={{
                              color: STATUS_COLOR[status],
                              borderColor: STATUS_COLOR[status] + "40",
                              background: STATUS_COLOR[status] + "10",
                            }}
                          >
                            {STATUS_LABEL[status]}
                          </span>
                        </div>
                        {issue.deadline && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Due {new Date(issue.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        )}
                        {issue.assignees && issue.assignees.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {issue.assignees.slice(0, 2).map((a, i) => (
                                <img
                                  key={i}
                                  src={avatarUrl(a.profileName, a.picture)}
                                  alt={a.profileName}
                                  title={a.profileName}
                                  className="inline-block h-5 w-5 rounded-full ring-1 ring-white object-cover"
                                />
                              ))}
                              {issue.assignees.length > 2 && (
                                <span className="w-5 h-5 rounded-full bg-purple-100 border ring-1 ring-white flex items-center justify-center text-[9px] font-bold text-purple-700 shrink-0">
                                  +{issue.assignees.length - 2}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 truncate max-w-20">
                              {issue.assignees.length === 1
                                ? issue.assignees[0].profileName.split(" ")[0]
                                : `${issue.assignees.length} people`}
                            </span>
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}

                {todayItems.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-xs font-medium">All tasks and events done for today! 🎉</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}