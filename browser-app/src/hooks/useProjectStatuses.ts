/**
 * @file useProjectStatuses.ts
 * @description Hook fetching and caching the dynamic status columns of a project.
 * Components use the returned `statuses` list to render Kanban columns dynamically
 * instead of the old hardcoded ["to_do", "in_progress", "done"] array.
 */

import { useState, useEffect, useCallback } from "react";
import { projectStatusApi } from "../api/services/projectStatusApi";
import type { ProjectStatusResponse } from "../api/contracts/projectStatus";

export function useProjectStatuses(projectId: string | null) {
  const [statuses, setStatuses] = useState<ProjectStatusResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await projectStatusApi.list(projectId);
      setStatuses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load statuses");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  return { statuses, loading, error, reload: load, setStatuses };
}
