import { useState } from "react";
import type { OverviewData } from "../../hooks/useOverview";
import { avatarUrl } from "../../utils/avatar";

const ITEMS_PER_PAGE = 5;

export default function RecentActivity({ data }: { data: OverviewData }) {
  const { activities } = data;

  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);

  const paginatedActivities = activities.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">
        Recent Activity
      </h2>

      {activities.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">
          No recent activity.
        </p>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-gray-50">
            {paginatedActivities.map((a) => (
              <div key={a.id} className="flex gap-3 py-2.5">
                <img
                  src={avatarUrl(a.actorName, a.actorPicture)}
                  alt={a.actorName}
                  className="w-7 h-7 rounded-full object-cover shrink-0 ring-2 ring-white"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] text-gray-600 leading-snug">
                    <span className="font-semibold text-gray-800">
                      {a.actorName}
                    </span>{" "}
                    {a.action}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {a.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-xs">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 rounded-lg border disabled:opacity-40"
            >
              Prev
            </button>

            <span className="text-gray-500">
              Page {page} / {totalPages}
            </span>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg border disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}