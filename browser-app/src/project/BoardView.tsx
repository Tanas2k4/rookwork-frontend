/**
 * @file BoardView.tsx
 * @description Component hiển thị bảng Kanban (Kanban Board View), là màn hình tương tác chính để theo dõi, lọc, kéo thả và quản lý chi tiết các công việc trong dự án.
 * @author Warmdrobe
 */

import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { useBoard } from "../hooks/useBoard";
import { useProject } from "../hooks/useProject";
import { ToastContainer } from "../components/common/ToastContainer";
import { BoardColumn } from "./board/BoardColumn";
import { AddColumnButton } from "./board/AddColumnButton";
import { FilterMenu } from "./board/FilterMenu";
import { TaskModal } from "./board/TaskModal";
import { WorkflowEditor } from "./workflow/WorkflowEditor";
import type { Priority, TaskType } from "../types/project";
import { categoryToUIStatus } from "../utils/issueMapper";
import { projectStatusApi } from "../api/services/projectStatusApi";
import type { StatusCategory } from "../api/contracts/projectStatus";
import { MdSwapCalls, MdClose } from "react-icons/md";

/**
 * Component BoardView hiển thị giao diện bảng phân cột các công việc theo trạng thái.
 * Cho phép lọc danh sách theo tên, mức ưu tiên, loại công việc và mở panel chỉnh sửa chi tiết của từng sự vụ.
 */
export default function BoardView() {
  const {
    projectId,
    setReloadIssues,
    projectStatuses,
    reloadStatuses,
    setStatuses,
    workflow,
    isTransitionAllowed,
    updateWorkflow,
  } = useProject();
  const board = useBoard(projectId);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [fallbackColumnId, setFallbackColumnId] = useState<string>("");

  async function handleAddColumn(name: string, category: StatusCategory, color: string) {
    if (!projectId) return;
    try {
      await projectStatusApi.create(projectId, { statusName: name, statusCategory: category, color });
      await reloadStatuses();
      board.pushToast("Column created successfully", "success");
    } catch (err) {
      console.error("Failed to create column", err);
      board.pushToast(
        err instanceof Error ? err.message : "Failed to create column. Only the project OWNER can manage workflow statuses.",
        "error"
      );
    }
  }

  async function handleRenameColumn(statusId: string, newName: string) {
    if (!projectId) return;
    try {
      await projectStatusApi.update(projectId, statusId, { statusName: newName });
      await reloadStatuses();
      board.pushToast("Column renamed successfully", "success");
    } catch (err) {
      console.error("Failed to rename column", err);
      board.pushToast(
        err instanceof Error ? err.message : "Failed to rename column. Only the project OWNER can manage workflow statuses.",
        "error"
      );
    }
  }

  function handleReorderColumns(fromIndex: number, toIndex: number) {
    const list = [...projectStatuses];
    const [dragged] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, dragged);
    setStatuses(list);
  }

  async function handlePersistColumnOrder() {
    if (!projectId) return;
    try {
      const orders = projectStatuses.map((s, idx) => ({
        statusId: s.id,
        position: idx + 1,
        version: s.version,
      }));
      await projectStatusApi.reorder(projectId, { statusOrders: orders });
      await reloadStatuses();
      board.reload();
    } catch (err) {
      console.error("Failed to reorder columns", err);
      board.pushToast(
        err instanceof Error ? err.message : "Failed to reorder columns. Only the project OWNER can manage workflow statuses.",
        "error"
      );
      await reloadStatuses();
    }
  }

  function handleInitiateDeleteColumn(statusId: string) {
    if (projectStatuses.length <= 1) {
      board.pushToast("Cannot delete the only column in the project.", "error");
      return;
    }
    setDeleteColumnId(statusId);
    
    // Find valid targets allowed by the workflow
    const allowedTargets = projectStatuses.filter((s) => s.id !== statusId && isTransitionAllowed(statusId, s.id));
    if (allowedTargets.length > 0) {
      setFallbackColumnId(allowedTargets[0].id);
    } else {
      // If none, fallback to any other column
      const otherColumns = projectStatuses.filter((s) => s.id !== statusId);
      if (otherColumns.length > 0) {
        setFallbackColumnId(otherColumns[0].id);
      }
    }
  }

  async function handleConfirmDeleteColumn() {
    if (!projectId || !deleteColumnId || !fallbackColumnId) return;
    try {
      await projectStatusApi.delete(projectId, deleteColumnId, { fallbackStatusId: fallbackColumnId });
      await reloadStatuses();
      board.reload(); // Reload tasks to see them migrated
      setDeleteColumnId(null);
      board.pushToast("Column deleted and tasks migrated successfully", "success");
    } catch (err) {
      console.error("Failed to delete column", err);
      board.pushToast(
        err instanceof Error ? err.message : "Failed to delete column. Only the project OWNER can manage workflow statuses.",
        "error"
      );
    }
  }

  // Register board.reload vào context để ProjectHeader có thể trigger
  useEffect(() => {
    setReloadIssues(board.reload);
  }, [board.reload, setReloadIssues]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<Priority | "">("");
  const [filterType, setFilterType] = useState<TaskType | "">("");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const hasFilter = !!(searchQuery || filterPriority || filterType);

  const filteredTasks = board.tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterPriority === "" || t.priority === filterPriority) &&
      (filterType === "" || t.type === filterType),
  );


  return (
    <div className="px-6 py-4 bg-gray-50 min-h-screen">
      <ToastContainer toasts={board.toasts} onRemove={board.removeToast} />

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative w-80">
          <IoSearchSharp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-500 rounded-md pl-9 pr-3 py-1.5 text-sm
              focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-none focus:border-transparent transition"
          />
        </div>

        <FilterMenu
          filterType={filterType}
          filterPriority={filterPriority}
          onTypeChange={setFilterType}
          onPriorityChange={setFilterPriority}
          open={showFilterMenu}
          onToggle={() => setShowFilterMenu((p) => !p)}
          onClose={() => setShowFilterMenu(false)}
        />

        <button
          onClick={() => setShowWorkflowEditor(true)}
          className="flex items-center gap-1.5 bg-white border border-gray-500 hover:border-indigo-500 hover:text-indigo-600 rounded-md px-3 py-1.5 text-sm font-medium transition cursor-pointer text-gray-700"
          title="Configure status transitions"
        >
          <MdSwapCalls className="text-indigo-500" size={16} />
          Workflow
        </button>

        <span className="text-sm text-gray-600">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Board columns — flex layout, scrollable, unlimited columns */}
      <div className="board-scroll flex gap-4 pb-2 min-h-0">
        {projectStatuses.map((ps, index) => {
          const uiStatus = categoryToUIStatus(ps.statusCategory);
          return (
            <div key={ps.id} className="w-72 shrink-0 flex flex-col">
              <BoardColumn
                status={uiStatus}
                statusId={ps.id}
                statusLabel={ps.statusName}
                statusColor={ps.color}
                index={index}
                tasks={filteredTasks.filter((t) => {
                  const tStatusId = (t as any)._statusId;
                  if (tStatusId) return tStatusId === ps.id;
                  return t.status === uiStatus;
                })}
                allTasks={board.tasks}
                hasFilter={hasFilter}
                onOpenTask={board.openTask}
                onCreateTask={(title, type, priority, colStatus) =>
                  board.createTask(title, type, priority, colStatus)
                }
                onMoveTask={(taskId, statusId) => {
                  const task = board.tasks.find((t) => t.id === taskId);
                  if (task) board.changeTaskStatus(task, statusId);
                }}
                onReorderTasks={board.reorderTasks}
                onRename={handleRenameColumn}
                isTransitionAllowed={isTransitionAllowed}
                onReorderColumns={handleReorderColumns}
                onPersistColumnOrder={handlePersistColumnOrder}
                onDeleteColumn={handleInitiateDeleteColumn}
              />
            </div>
          );
        })}

        {/* Add column button — appears after all columns */}
        <AddColumnButton onAdd={handleAddColumn} />
      </div>

      {/* Task detail modal */}
      <TaskModal
        task={board.selectedTask}
        open={board.panelOpen}
        allTasks={board.tasks}
        onClose={board.closePanel}
        onOpenTask={board.openTask}
        onSaveTitle={board.saveTitle}
        onSaveDescription={board.saveDescription}
        onChangeStatus={board.changeStatus}
        onChangePriority={board.changePriority}
        onChangeAssignee={board.changeAssignee}
        onSaveDeadline={board.saveDeadline}
        onDeleteTask={board.deleteTask}
        onLink={board.linkChild}
        onUnlink={board.unlinkChild}
        onToggleSubtask={board.toggleSubtask}
        onAddSubtask={board.addSubtask}
        onDeleteSubtask={board.deleteSubtask}
        onUpdateAttachments={(attachments) =>
          board.selectedTask && board.updateAttachments(board.selectedTask.id, attachments)
        }
        projectStatuses={projectStatuses}
      />

      {/* Workflow Rule Matrix Config Modal */}
      <WorkflowEditor
        open={showWorkflowEditor}
        onClose={() => setShowWorkflowEditor(false)}
        statuses={projectStatuses}
        currentTransitions={workflow ? workflow.transitions : []}
        isOpenWorkflow={workflow ? workflow.openWorkflow : true}
        onSave={updateWorkflow}
      />

      {/* Delete Column Confirmation Modal */}
      {deleteColumnId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-lg">Delete Column</h3>
              <button
                onClick={() => setDeleteColumnId(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition"
              >
                <MdClose size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                Are you sure you want to delete the column{" "}
                <span className="font-bold text-gray-800">
                  "{projectStatuses.find((s) => s.id === deleteColumnId)?.statusName}"
                </span>
                ?
              </p>
              
              <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Any tasks currently in this column must be migrated to another column.
                </p>
              </div>

              {/* Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Migrate tasks to
                </label>
                <select
                  value={fallbackColumnId}
                  onChange={(e) => setFallbackColumnId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  {projectStatuses
                    .filter((s) => s.id !== deleteColumnId)
                    .map((s) => {
                      const allowed = isTransitionAllowed(deleteColumnId, s.id);
                      return (
                        <option key={s.id} value={s.id}>
                          {s.statusName} {!allowed ? "(Not allowed by workflow)" : ""}
                        </option>
                      );
                    })}
                </select>
                
                {/* Warning if selected is not allowed by workflow */}
                {fallbackColumnId && !isTransitionAllowed(deleteColumnId, fallbackColumnId) && (
                  <p className="text-xs text-red-500 font-medium">
                    ⚠️ The selected column is not allowed by the project's workflow rules. 
                    Moving tasks here will bypass workflow rules for this operation.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteColumnId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteColumn}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition"
              >
                Delete & Migrate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}