/**
 * @file BoardView.tsx
 * @description Component hiển thị bảng Kanban (Kanban Board View), là màn hình tương tác chính để theo dõi, lọc, kéo thả và quản lý chi tiết các công việc trong dự án.
 * @author Warmdrobe
 */

import { useState, useEffect } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { useBoard } from "../hooks/useBoard";
import { useProject } from "../hooks/useProject";
import { useProjectStatuses } from "../hooks/useProjectStatuses";
import { useWorkflow } from "../hooks/useWorkflow";
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
import { MdSwapCalls } from "react-icons/md";

/**
 * Component BoardView hiển thị giao diện bảng phân cột các công việc theo trạng thái.
 * Cho phép lọc danh sách theo tên, mức ưu tiên, loại công việc và mở panel chỉnh sửa chi tiết của từng sự vụ.
 */
export default function BoardView() {
  const { projectId, setReloadIssues } = useProject();
  const board = useBoard(projectId);
  const { statuses: projectStatuses, reload: reloadStatuses, setStatuses } = useProjectStatuses(projectId);
  const { workflow, isTransitionAllowed, updateWorkflow } = useWorkflow(projectId);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);

  async function handleAddColumn(name: string, category: StatusCategory, color: string) {
    if (!projectId) return;
    await projectStatusApi.create(projectId, { statusName: name, statusCategory: category, color });
    await reloadStatuses();
  }

  async function handleRenameColumn(statusId: string, newName: string) {
    if (!projectId) return;
    await projectStatusApi.update(projectId, statusId, { statusName: newName });
    await reloadStatuses();
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
      alert(err instanceof Error ? err.message : "Failed to reorder columns");
      await reloadStatuses();
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
    </div>
  );
}