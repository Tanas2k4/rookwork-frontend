import { useState } from "react";
import type { OverviewData } from "../../hooks/useOverview";

export default function ProjectCard({ data }: { data: OverviewData }) {
  const [tab, setTab] = useState<"activity" | "assignment">("activity");
  const { activities } = data;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100">
        {(["activity", "assignment"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-xs uppercase tracking-widest transition-colors ${
              tab === t ? "text-purple-800 border-b-2 border-purple-800 font-bold" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            }`}>
            {t === "activity" ? "Activity" : "Assignment"}
          </button>
        ))}
      </div>

      {tab === "activity" && (
        <div className="p-5">
          {activities.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activities.slice(0, 5).map((a) => (
                <div key={a.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:border-gray-200 transition-all">
                  <img src={a.actorPicture ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(a.actorName)}&background=7c3aed&color=fff`}
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

      {tab === "assignment" && (
        <div className="p-5 flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-400">Assignment coming soon</p>
          <p className="text-xs text-gray-300 text-center max-w-50 leading-relaxed">Team assignment features will be available in the next release.</p>
        </div>
      )}
    </div>
  );
}