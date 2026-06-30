import { NavLink, useParams } from "react-router-dom";
import { IoBarChartOutline } from "react-icons/io5"; //Overview icon
import { BsCollection } from "react-icons/bs"; //Board icon
import { TfiTimer } from "react-icons/tfi"; //Timeline icon
import { TfiViewListAlt } from "react-icons/tfi"; //List icon
import { RiAttachment2 } from "react-icons/ri"; //Files icon
import { BsCalendar2Event } from "react-icons/bs"; //Events icon
import { FiSettings } from "react-icons/fi"; //Settings icon

function ProjectTabs() {
  const { projectKey } = useParams();

  const tabs = [
    { key: "overview", label: "Overview", icon: IoBarChartOutline },
    { key: "board", label: "Board", icon: BsCollection },
    { key: "timeline", label: "Timeline", icon: TfiTimer },
    { key: "list", label: "List", icon: TfiViewListAlt },
    { key: "files", label: "Storage", icon: RiAttachment2 },
    { key: "events", label: "Events", icon: BsCalendar2Event },
    { key: "settings", label: "Settings", icon: FiSettings },
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
              <tab.icon size={16} className="shrink-0" />
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectTabs;
