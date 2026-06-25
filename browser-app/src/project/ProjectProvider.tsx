import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { projectApi } from "../api/services/projectApi";
import type { ProjectResponse } from "../api/contracts";
import { ProjectContext } from "../context/ProjectContext";
import { useWebSocket, type WsNotificationPayload } from "../hooks/useWebSocket";

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { projectKey } = useParams<{ projectKey: string }>();
  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [issueUpdateTick, setIssueUpdateTick] = useState(0);
  const reloadIssuesRef = useRef<() => void>(() => {});
  const openIssueModalRef = useRef<(uuid: string) => void>(() => {});

  const load = useCallback(async () => {
    if (!projectKey) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const all = await projectApi.getAll();
      const found = all.find(
        (p) => p.id.toLowerCase() === projectKey.toLowerCase(),
      );
      setProject(found ?? null);
      if (!found) console.warn("Project not found for key:", projectKey);
    } catch (err) {
      console.error("Failed to load project", err);
    } finally {
      setLoading(false);
    }
  }, [projectKey]);

  useEffect(() => {
    load();
  }, [load]);

  useWebSocket({
    projectId: projectKey ?? null,
    issueId: null,
    onNotification: useCallback(
      (payload: WsNotificationPayload) => {
        if (
          payload.type === "INVITATION_ACCEPTED" &&
          payload.projectId === projectKey
        ) {
          load();
        }
      },
      [load, projectKey],
    ),
  });

  const notifyIssueUpdated = useCallback(() => {
    setIssueUpdateTick((n) => n + 1);
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projectId: projectKey ?? null,
        projectKey: projectKey ?? null,
        project,
        members: project?.members ?? [],
        loading,
        refresh: load,
        reloadIssues: () => reloadIssuesRef.current(),
        setReloadIssues: (fn) => {
          reloadIssuesRef.current = fn;
        },
        openIssueModal: (uuid) => openIssueModalRef.current(uuid),
        setOpenIssueModal: (fn) => {
          openIssueModalRef.current = fn;
        },
        issueUpdateTick,
        notifyIssueUpdated,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}
