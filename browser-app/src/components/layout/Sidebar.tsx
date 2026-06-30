import { NavLink, useNavigate, useLocation } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import { GoSidebarCollapse } from "react-icons/go";
import { IoCalendarOutline, IoSettingsOutline, IoShieldOutline } from "react-icons/io5";
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from "react-icons/md";
import { BsCalendar2Event, BsFolder } from "react-icons/bs";
import { AiOutlineCheckSquare } from "react-icons/ai";
import type { ProjectUI } from "../../api/contracts/projectUI";

interface SidebarProps {
  sidebar: boolean;
  setSidebar: Dispatch<SetStateAction<boolean>>;
  projects: ProjectUI[];
  isAdmin?: boolean;
}

const Sidebar = ({ sidebar, setSidebar, projects, isAdmin }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const isProjectActive = (projectId: string) =>
    location.pathname.includes(`/projects/${projectId}`);

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}/overview`);
    if (window.innerWidth < 768) setSidebar(false);
  };

  return (
    <>
      {sidebar && (
        <div
          onClick={() => setSidebar(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed md:static z-50
          top-0 left-0 h-full
          bg-white text-gray-700 text-[14px]
          border-r border-gray-200
          transition-all duration-300 ease-in-out
          overflow-hidden
          ${sidebar ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0 md:w-16"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-gray-200">
            <button
              onClick={() => setSidebar(!sidebar)}
              className="flex items-center w-full h-14 px-1 hover:bg-gray-50 transition-colors"
            >
              <div className="w-14 flex justify-center items-center shrink-0">
                <GoSidebarCollapse
                  size={20}
                  className={`transition-transform duration-300 ${!sidebar ? "rotate-180" : ""}`}
                />
              </div>
              <span
                className={`font-semibold text-gray-800 whitespace-nowrap transition-all duration-300 ${
                  sidebar ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
                }`}
              >
                Workspace
              </span>
            </button>
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
            <nav className="flex flex-col gap-1 px-2">
              <NavLink
                to="/my-issues"
                className={({ isActive }) =>
                  `flex items-center h-10 rounded-lg transition-colors group ${
                    isActive ? "bg-purple-50 text-purple-700 font-medium" : "hover:bg-gray-100"
                  }`
                }
              >
                <div className="w-12 flex justify-center items-center shrink-0">
                  <AiOutlineCheckSquare size={20} />
                </div>
                <span className={`truncate transition-all duration-300 ${sidebar ? "opacity-100" : "opacity-0"}`}>
                  Issues
                </span>
              </NavLink>

              <NavLink
                to="/events"
                className={({ isActive }) =>
                  `flex items-center h-10 rounded-lg transition-colors group ${
                    isActive ? "bg-purple-50 text-purple-700 font-medium" : "hover:bg-gray-100"
                  }`
                }
              >
                <div className="w-12 flex justify-center items-center shrink-0">
                  <BsCalendar2Event size={17} />
                </div>
                <span className={`truncate transition-all duration-300 ${sidebar ? "opacity-100" : "opacity-0"}`}>
                  Events
                </span>
              </NavLink>

              <div className="my-2 border-t border-gray-200" />

              {/* Projects */}
              <div>
                <button
                  onClick={() => sidebar && setProjectsExpanded(!projectsExpanded)}
                  className="flex items-center w-full h-10 rounded-lg hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-12 flex justify-center items-center shrink-0">
                    <BsFolder size={17} className="text-gray-600 group-hover:text-purple-800" />
                  </div>
                  <span className={`flex-1 text-left font-medium truncate transition-all duration-300 group-hover:text-purple-800 ${sidebar ? "opacity-100" : "opacity-0"}`}>
                    Projects
                  </span>
                  {sidebar && (
                    <div className="w-8 flex justify-center items-center shrink-0">
                      {projectsExpanded
                        ? <MdKeyboardArrowDown size={20} className="text-gray-500" />
                        : <MdKeyboardArrowRight size={20} className="text-gray-500" />
                      }
                    </div>
                  )}
                </button>

                {projectsExpanded && (
                  <div className={`flex flex-col gap-0.5 mt-1 transition-all duration-300 ${sidebar ? "opacity-100" : "opacity-0 hidden"}`}>
                    {projects.length === 0 && sidebar && (
                      <p className="text-[12px] text-gray-400 px-4 py-2">No projects yet</p>
                    )}
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectClick(project.id)}
                        className={`flex items-center h-9 rounded-lg transition-colors ml-3 ${
                          isProjectActive(project.id)
                            ? "bg-purple-50 text-purple-700 font-medium"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <div className="w-9 flex justify-center items-center shrink-0">
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ background: project.accentColor }}
                          >
                            {project.projectName[0]?.toUpperCase() ?? "P"}
                          </div>
                        </div>
                        <span className="truncate text-[13px] pr-2">{project.projectName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 py-2 px-2">
            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center w-full h-10 rounded-lg transition-colors group ${
                    isActive || location.pathname.startsWith('/admin') ? "bg-purple-50 text-purple-700 font-medium" : "hover:bg-gray-100"
                  }`
                }
              >
                <div className="w-12 flex justify-center items-center shrink-0">
                  <IoShieldOutline size={20} />
                </div>
                <span className={`truncate transition-all duration-300 ${sidebar ? "opacity-100" : "opacity-0"}`}>
                  Admin Panel
                </span>
              </NavLink>
            )}

            <NavLink
              to="/calendars"
              className={({ isActive }) =>
                `flex items-center w-full h-10 rounded-lg transition-colors group ${
                  isActive ? "bg-purple-50 text-purple-700 font-medium" : "hover:bg-gray-100"
                }`
              }
            >
              <div className="w-12 flex justify-center items-center shrink-0">
                <IoCalendarOutline size={20} />
              </div>
              <span className={`truncate transition-all duration-300 ${sidebar ? "opacity-100" : "opacity-0"}`}>
                Calendar
              </span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center w-full h-10 rounded-lg transition-colors group ${
                  isActive ? "bg-purple-50 text-purple-700 font-medium" : "hover:bg-gray-100"
                }`
              }
            >
              <div className="w-12 flex justify-center items-center shrink-0">
                <IoSettingsOutline size={20} />
              </div>
              <span className={`truncate transition-all duration-300 ${sidebar ? "opacity-100" : "opacity-0"}`}>
                Settings
              </span>
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;