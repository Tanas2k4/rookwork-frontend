import { NavLink, useParams } from "react-router-dom";
import {
  ChartBarIcon,
  ViewColumnsIcon,
  ClockIcon,
  ListBulletIcon,
  PaperClipIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

function ProjectTabs() {
  const { projectKey } = useParams();

  const tabs = [
    { key: "overview", label: "Overview", icon: ChartBarIcon },
    { key: "board", label: "Board", icon: ViewColumnsIcon },
    { key: "timeline", label: "Timeline", icon: ClockIcon },
    { key: "list", label: "List", icon: ListBulletIcon },
    { key: "files", label: "Storage", icon: PaperClipIcon },
    { key: "events", label: "Events", icon: CalendarDaysIcon },
    { key: "settings", label: "Settings", icon: Cog6ToothIcon },
  ];

  return (
    <div className="bg-white text-[14px] border-b border-gray-200 px-8">
      <ul className="flex gap-10">
        {tabs.map((tab) => (
          <li key={tab.key}>
            <NavLink
              to={`/projects/${projectKey}/${tab.key}`}
              data-text={tab.label}
              className={({ isActive }) =>
                `
                flex flex-row items-center gap-2
                relative py-2 
                after:content-[attr(data-text)]
                after:font-semibold after:invisible after:absolute
                ${isActive
                  ? "font-semibold text-purple-800 border-b-[3px] border-purple-800"
                  : "text-gray-800"
                }
              `
              }
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectTabs;
