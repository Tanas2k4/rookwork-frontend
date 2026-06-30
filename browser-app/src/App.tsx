import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import CalendarView from "./user/CalendarView";
import EventsView from "./user/EventsView";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import Titlebar from "./components/layout/Titlebar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DashboardPage from "./pages/DashboardPage";
import ProjectPage from "./pages/ProjectPage";
import OverView from "./project/OverView";
import BoardView from "./project/BoardView";
import TimelineView from "./project/TimelineView";
import ListView from "./project/ListView";
import ProjectFilesView from "./project/storage/ProjectFilesView";
import Loading from "./components/common/Loading";
import MyIssuesPage from "./pages/MyIssuesPage";
import IssueDetailPage from "./pages/IssueDetailPage";
import SettingsPage from "./pages/SettingsPage";
import AdminPage from "./pages/admin/AdminPage";
import { projectApi } from "./api/services/projectApi";
import { userApi } from "./api/services/userApi";
import { tokenStorage } from "./api/tokenStorage";
import { toProjectUI, type ProjectUI } from "./api/contracts/projectUI";
import type { ProjectResponse } from "./api/contracts";
import { useAutoRefreshToken } from "./hooks/useAutoRefreshToken";

function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!tokenStorage.getAccess());

  // Tự động refresh token trước khi hết hạn
  useAutoRefreshToken();
  const [sidebar, setSidebar] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [projects, setProjects] = useState<ProjectUI[]>([]);
  const [profileName, setProfileName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const reloadProjects = () => {
    projectApi
      .getAll()
      .then((projectsRes: ProjectResponse[]) =>
        setProjects(projectsRes.map((p, i) => toProjectUI(p, i))),
      )
      .catch(console.error);
  };

  useEffect(() => {
    if (!loggedIn) return;

    const loadUserData = () => {
      Promise.all([userApi.getMe(), projectApi.getAll()])
        .then(([user, projectsRes]) => {
          setProfileName(user.profileName);
          setAvatarUrl(user.picture ?? undefined);
          setIsAdmin(user.isAdmin ?? false);
          setProjects(
            projectsRes.map((p: ProjectResponse, i: number) => toProjectUI(p, i)),
          );
        })
        .catch(console.error);
    };

    loadUserData();

    window.addEventListener("profileUpdated", loadUserData);
    return () => {
      window.removeEventListener("profileUpdated", loadUserData);
    };
  }, [loggedIn]);

  const handleLoginSuccess = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setLoggedIn(true);
      setIsTransitioning(false);
    }, 3000);
  };

  const handleLogout = () => {
    tokenStorage.clear();
    setLoggedIn(false);
    setProjects([]);
    setProfileName("");
    setAvatarUrl(undefined);
    setIsAdmin(false);
  };

  const handleProjectCreated = (newProject: ProjectResponse) => {
    setProjects((prev) => [...prev, toProjectUI(newProject, prev.length)]);
  };

  if (isTransitioning) return <Loading fullScreen />;

  return (
    <DndProvider backend={HTML5Backend}>
      <BrowserRouter>
        <div className="h-screen flex flex-col bg-white overflow-hidden">
          <Titlebar />

          {!loggedIn ? (
            <Routes>
              <Route
                path="/login"
                element={<Login onSuccess={handleLoginSuccess} />}
              />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          ) : (
            <Routes>
              {/* Standalone Admin Layout */}
              <Route 
                path="/admin/*" 
                element={isAdmin ? <AdminPage /> : <Navigate to="/dashboard" />} 
              />
              
              {/* Normal User Workspace Layout */}
              <Route path="*" element={
                <>
                  <Header
                    setSidebar={setSidebar}
                    displayName={profileName}
                    avatarUrl={avatarUrl}
                    onLogout={handleLogout}
                    onProjectCreated={handleProjectCreated}
                    onProjectsChanged={reloadProjects}
                  />

                  <div className="flex flex-1 overflow-hidden">
                    <Sidebar
                      sidebar={sidebar}
                      setSidebar={setSidebar}
                      projects={projects}
                      isAdmin={isAdmin}
                    />

                    <main className="flex-1 overflow-auto bg-gray-50">
                      <Routes>
                        <Route
                          path="/dashboard"
                          element={
                            <DashboardPage
                              projects={projects}
                              profileName={profileName}
                            />
                          }
                        />

                        <Route
                          path="/projects/:projectKey"
                          element={<ProjectPage onProjectsChanged={reloadProjects} />}
                        >
                          <Route
                            index
                            element={<Navigate to="overview" replace />}
                          />
                          <Route path="overview" element={<OverView />} />
                          <Route path="board" element={<BoardView />} />
                          <Route path="timeline" element={<TimelineView />} />
                          <Route path="list" element={<ListView />} />
                          <Route path="files" element={<ProjectFilesView />} />
                          <Route path="events" element={<EventsView />} />
                        </Route>

                        <Route path="/events" element={<EventsView />} />
                        <Route path="/calendars" element={<CalendarView />} />
                        <Route path="/my-issues" element={<MyIssuesPage />} />
                        <Route
                          path="/issues/:issueId"
                          element={<IssueDetailPage />}
                        />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" />} />
                      </Routes>
                    </main>
                  </div>
                </>
              } />
            </Routes>
          )}
        </div>
      </BrowserRouter>
    </DndProvider>
  );
}

export default App;
