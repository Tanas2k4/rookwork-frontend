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
import { FilterMenu } from "./board/FilterMenu";
import { TaskPanel } from "./board/TaskPanel";
import type { Priority, TaskType } from "../types/project";
import { statuses } from "../types/project";

/**
 * Component BoardView hiển thị giao diện bảng phân cột các công việc theo trạng thái.
 * Cho phép lọc danh sách theo tên, mức ưu tiên, loại công việc và mở panel chỉnh sửa chi tiết của từng sự vụ.
 */
export default function BoardView() {
  const { projectId, setReloadIssues } = useProject();
  const board = useBoard(projectId);

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

        <span className="text-sm text-gray-600">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Board columns */}
      <div className="grid grid-cols-4 gap-4">
        {statuses.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={filteredTasks.filter((t) => t.status === status)}
            allTasks={board.tasks}
            hasFilter={hasFilter}
            onOpenTask={board.openTask}
            onCreateTask={(title, type, priority, colStatus) =>
              board.createTask(title, type, priority, colStatus)
            }
            onMoveTask={(taskId, newStatus) => {
              const task = board.tasks.find((t) => t.id === taskId);
              if (task) board.changeTaskStatus(task, newStatus);
            }}
            onReorderTasks={board.reorderTasks}
          />
        ))}
      </div>

      {/* Task detail panel */}
      <TaskPanel
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
      />
    </div>
  );
}