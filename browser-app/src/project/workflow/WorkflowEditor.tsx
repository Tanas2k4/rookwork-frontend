/**
 * @file WorkflowEditor.tsx
 * @description Beautiful modal editor for configuring custom status transition paths (Workflow).
 * Displays a clean N×N checkbox matrix matching Jira's workflow rule builder.
 */

import { useState, useEffect } from "react";
import { MdClose, MdSettingsBackupRestore, MdCheck, MdSwapCalls } from "react-icons/md";
import type { ProjectStatusResponse } from "../../api/contracts/projectStatus";
import type { AddTransitionRequest } from "../../api/contracts/workflow";

interface Props {
  open: boolean;
  onClose: () => void;
  statuses: ProjectStatusResponse[];
  currentTransitions: AddTransitionRequest[];
  isOpenWorkflow: boolean;
  onSave: (transitions: AddTransitionRequest[]) => Promise<any>;
}

export function WorkflowEditor({
  open,
  onClose,
  statuses,
  currentTransitions,
  onSave,
}: Props) {
  const [selectedTransitions, setSelectedTransitions] = useState<AddTransitionRequest[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state
  useEffect(() => {
    if (open) {
      setSelectedTransitions([...currentTransitions]);
      setError(null);
    }
  }, [open, currentTransitions]);

  if (!open) return null;

  const isChecked = (fromId: string, toId: string) => {
    return selectedTransitions.some(
      (t) => t.fromStatusId === fromId && t.toStatusId === toId
    );
  };

  const handleToggle = (fromId: string, toId: string) => {
    if (fromId === toId) return;

    setSelectedTransitions((prev) => {
      const exists = prev.some(
        (t) => t.fromStatusId === fromId && t.toStatusId === toId
      );
      if (exists) {
        return prev.filter(
          (t) => !(t.fromStatusId === fromId && t.toStatusId === toId)
        );
      } else {
        return [...prev, { fromStatusId: fromId, toStatusId: toId }];
      }
    });
  };

  // Preset helper
  const handleAllowAll = () => {
    setSelectedTransitions([]); // Empty array represents "Open Workflow" where any move is allowed
  };

  const handleStandardFlow = () => {
    // Generate linear flow between statuses ordered by position
    const sorted = [...statuses].sort((a, b) => a.position - b.position);
    const flow: AddTransitionRequest[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const current = sorted[i];
      const next = sorted[i + 1];
      // Forward path (e.g. To Do -> In Progress)
      flow.push({ fromStatusId: current.id, toStatusId: next.id });
      // Backward path (e.g. In Progress -> To Do)
      flow.push({ fromStatusId: next.id, toStatusId: current.id });
    }
    setSelectedTransitions(flow);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const cleaned = selectedTransitions.map((t) => ({
        fromStatusId: t.fromStatusId,
        toStatusId: t.toStatusId,
      }));
      await onSave(cleaned);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save workflow rules");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <MdSwapCalls size={24} />
            <h3 className="font-semibold text-gray-800 text-lg">Project Workflow Rules</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Define which column transitions are allowed when users drag and drop issues.
              Unchecked pairs will block users from moving cards between those columns.
            </p>
            <div className="mt-3 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-xs text-indigo-700 font-medium">
                {selectedTransitions.length === 0
                  ? "Open Workflow is active: users can drag and drop issues freely to any column."
                  : `Custom Workflow is active: users may only transition issues via the ${selectedTransitions.length} allowed paths below.`}
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Preset templates */}
          <div className="flex gap-2">
            <button
              onClick={handleAllowAll}
              type="button"
              className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center gap-1.5"
            >
              <MdSettingsBackupRestore size={14} />
              Reset to Open (Allow all)
            </button>
            <button
              onClick={handleStandardFlow}
              type="button"
              className="text-xs font-semibold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition flex items-center gap-1.5"
            >
              <MdSwapCalls size={14} />
              Apply Linear Path (Left ⇆ Right)
            </button>
          </div>

          {/* Matrix table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-200">
                  <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                    From ↓ / To →
                  </th>
                  {statuses.map((s) => (
                    <th
                      key={s.id}
                      className="p-3 text-xs font-bold text-gray-600 text-center truncate"
                      style={{ maxWidth: "120px" }}
                      title={s.statusName}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        {s.statusName}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {statuses.map((rowStatus) => (
                  <tr key={rowStatus.id} className="border-b border-gray-100 last:border-0 hover:bg-white/50 transition">
                    <td className="p-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: rowStatus.color }} />
                      {rowStatus.statusName}
                    </td>
                    {statuses.map((colStatus) => {
                      const isSelf = rowStatus.id === colStatus.id;
                      return (
                        <td key={colStatus.id} className="p-3 text-center">
                          {isSelf ? (
                            <span className="text-gray-300 text-xs font-medium">—</span>
                          ) : (
                            <label className="inline-flex items-center justify-center cursor-pointer p-2 hover:bg-gray-100 rounded-md transition">
                              <input
                                type="checkbox"
                                checked={isChecked(rowStatus.id, colStatus.id)}
                                onChange={() => handleToggle(rowStatus.id, colStatus.id)}
                                className="w-4.5 h-4.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                            </label>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium
              disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-1.5"
          >
            {saving ? "Saving..." : (
              <>
                <MdCheck size={16} />
                Save changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
