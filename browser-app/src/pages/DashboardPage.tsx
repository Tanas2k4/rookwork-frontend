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

//  Helpers 
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
  // const [loading, setLoading] = useState(true);

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);


  useEffect(() => {
    issueApi.getAssigned()
      .then(setIssues)
      .catch(console.error)
      // .finally(() => setLoading(false));
  }, []);

  const totalIssues = issues.length;
  const doneIssues = issues.filter((i) => i.status === "DONE").length;
  const overdueIssues = issues.filter(
    (i) => i.deadline && new Date(i.deadline) < now && i.status !== "DONE",
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

  const todayTasks = issues.filter((i) => i.status !== "DONE").slice(0, 4);

  const markedDates = useMemo(
    () => new Set(
      issues
        .filter((i) => i.deadline && i.status !== "DONE")
        .map((i) => i.deadline!.split("T")[0]),
    ),
    [issues],
  );

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
                {todayTasks.map((issue) => {
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
                        {issue.assignedTo && (
                          <div className="flex items-center gap-1.5 mt-2">
                            {issue.assignedTo.picture ? (
                              <img
                                src={issue.assignedTo.picture}
                                alt={issue.assignedTo.profileName}
                                className="w-5 h-5 rounded-full border border-white object-cover"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-violet-200 flex items-center justify-center text-[9px] font-bold text-violet-700">
                                {issue.assignedTo.profileName[0]}
                              </div>
                            )}
                            <span className="text-[10px] text-gray-400 truncate max-w-20">
                              {issue.assignedTo.profileName.split(" ")[0]}
                            </span>
                          </div>
                        )}
                      </Link>
                    </div>
                  );
                })}

                {todayTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-xs font-medium">All tasks done for today! 🎉</p>
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