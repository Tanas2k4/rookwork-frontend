import { useState, useEffect } from "react";
import { useOverview } from "../hooks/useOverview";
import OverallProgress from "./overview/Overallprogress";
import DeadlineTimeline from "./overview/Deadlinetimeline";
import Milestones from "./overview/Milestones";
import TaskSnapshot from "./overview/Tasksnapshot";
import ProjectCard from "./overview/Projectcard";
import RecentActivity from "./overview/Recentactivity";
import WorkloadSection from "./overview/Workloadsection";

export default function Overview() {
  const [animated, setAnimated] = useState(false);
  const { data, error, reload } = useOverview();

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 flex-col gap-3">
        <span className="text-sm">{error}</span>
        <button onClick={reload}
          className="text-xs px-4 py-1.5 rounded-md bg-purple-700 text-white hover:bg-purple-800 transition-colors">
          Retry
        </button>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-350 mx-auto px-8 py-7 grid grid-cols-3 gap-5">
        <OverallProgress data={data} animated={animated} />
        <DeadlineTimeline data={data} />
        <Milestones data={data} animated={animated} />
        <TaskSnapshot data={data} />
        <ProjectCard data={data} />
        <RecentActivity data={data} />
        <WorkloadSection data={data} animated={animated} />
      </div>
    </div>
  );
}