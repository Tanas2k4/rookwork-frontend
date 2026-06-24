import { Outlet } from "react-router-dom";
import ProjectHeader from "../project/ProjectHeader";
import ProjectTabs from "../navigation/ProjectTabs";
import { ProjectProvider } from "../project/ProjectProvider";

interface ProjectPageProps {
  onProjectsChanged?: () => void;
}

function ProjectPage({ onProjectsChanged }: ProjectPageProps) {
  return (
    <ProjectProvider>
      <ProjectHeader onProjectsChanged={onProjectsChanged} />
      <ProjectTabs />
      <div>
        <Outlet />
      </div>
    </ProjectProvider>
  );
}

export default ProjectPage;
