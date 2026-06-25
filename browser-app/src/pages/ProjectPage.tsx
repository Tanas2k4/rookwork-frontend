import { Outlet } from "react-router-dom";
import ProjectHeader from "../project/ProjectHeader";
import ProjectTabs from "../navigation/ProjectTabs";
import { ProjectProvider } from "../project/ProjectProvider";
import { SharedIssueModal } from "../project/shared/SharedIssueModal";

interface ProjectPageProps {
  onProjectsChanged?: () => void;
}

function ProjectPage({ onProjectsChanged }: ProjectPageProps) {
  return (
    <ProjectProvider>
      <ProjectHeader onProjectsChanged={onProjectsChanged} />
      <ProjectTabs />
      {/* SharedIssueModal cung cấp TaskModal đầy đủ cho Timeline và ListView */}
      <SharedIssueModal />
      <div>
        <Outlet />
      </div>
    </ProjectProvider>
  );
}

export default ProjectPage;
