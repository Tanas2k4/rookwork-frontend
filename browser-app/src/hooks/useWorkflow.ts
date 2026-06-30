import { useState, useEffect, useCallback } from "react";
import { workflowApi } from "../api/services/workflowApi";
import type { WorkflowResponse, AddTransitionRequest } from "../api/contracts/workflow";

export function useWorkflow(projectId: string | null) {
  const [workflow, setWorkflow] = useState<WorkflowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkflow = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await workflowApi.getWorkflow(projectId);
      setWorkflow(data);
    } catch (err) {
      console.error("Failed to load workflow", err);
      setError(err instanceof Error ? err.message : "Failed to load workflow");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadWorkflow();
  }, [loadWorkflow]);

  const isTransitionAllowed = useCallback((fromStatusId: string | null | undefined, toStatusId: string | null | undefined): boolean => {
    if (!fromStatusId || !toStatusId) return true;
    if (fromStatusId === toStatusId) return true;
    if (!workflow) return true; // if not loaded, fallback to allowing
    if (workflow.openWorkflow) return true; // no rules configured -> free flow

    const allowed = workflow.transitions.some(
      (t) => t.fromStatusId === fromStatusId && t.toStatusId === toStatusId
    );
    console.log("isTransitionAllowed check:", {
      fromStatusId,
      toStatusId,
      allowed,
      transitionsCount: workflow.transitions.length,
      transitions: workflow.transitions
    });
    return allowed;
  }, [workflow]);

  const updateWorkflow = useCallback(async (transitions: AddTransitionRequest[]) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await workflowApi.replaceWorkflow(projectId, { transitions });
      setWorkflow(data);
      return data;
    } catch (err) {
      console.error("Failed to update workflow", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  return {
    workflow,
    loading,
    error,
    isTransitionAllowed,
    updateWorkflow,
    reloadWorkflow: loadWorkflow,
  };
}
