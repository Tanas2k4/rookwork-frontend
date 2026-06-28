import { useState, useContext, useEffect } from "react";
import type { OverviewData } from "../../hooks/useOverview";
import { avatarUrl } from "../../utils/avatar";
import { ProjectContext } from "../../context/ProjectContext";
import { eventApi } from "../../api/services/eventApi";
import type { CalendarEvent } from "../../types/calendar";
import { mapToCalendarEvent } from "../../types/calendar";
import { HiOutlineLocationMarker, HiOutlineClock } from "react-icons/hi";

export default function ProjectCard({ data }: { data: OverviewData }) {
  const [tab, setTab] = useState<"event" | "activity">("event");
  const { activities } = data;
  const { projectId } = useContext(ProjectContext);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (!projectId) return;
    eventApi.getByProject(projectId)
      .then((res) => {
        setEvents(res.map(mapToCalendarEvent));
      })
      .catch(console.error);
  }, [projectId]);

  // Sort events by date descending to show the latest events first
  const latestEvents = [...events]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100">
        {(["event", "activity"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-xs uppercase tracking-widest transition-colors ${
              tab === t ? "text-purple-800 border-b-2 border-purple-800 font-bold" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}>
            {t === "event" ? "Event" : "Activity"}
          </button>
        ))}
      </div>

      {tab === "event" && (
        <div className="p-5">
          {latestEvents.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No events yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {latestEvents.map((ev) => (
                <div key={ev.id} className="flex flex-col gap-1 p-3 bg-gray-55 rounded-xl border border-gray-100 hover:bg-white hover:border-gray-200 transition-all cursor-default">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-gray-800 truncate">{ev.title}</span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {ev.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <HiOutlineClock className="text-gray-400 shrink-0" size={12} />
                    <span>{ev.time} - {ev.endTime}</span>
                  </div>
                  {ev.location && (
                    <div className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                      <HiOutlineLocationMarker className="text-gray-400 shrink-0" size={12} />
                      <span>{ev.location}</span>
                    </div>
                  )}
                  {ev.note && (
                    <p className="text-[11px] text-gray-400 italic truncate max-w-full">
                      {ev.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="p-5">
          {activities.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activities.slice(0, 5).map((a) => (
                <div key={a.id} className="flex gap-3 p-3 bg-gray-55 rounded-xl border border-gray-100 hover:bg-white hover:border-gray-200 transition-all">
                  <img src={avatarUrl(a.actorName, a.actorPicture)}
                    alt="" className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-white" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[12px] font-semibold text-gray-800">{a.actorName}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">{a.time}</span>
                    </div>
                    <p className="text-[12px] text-gray-600 leading-snug">{a.action}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}