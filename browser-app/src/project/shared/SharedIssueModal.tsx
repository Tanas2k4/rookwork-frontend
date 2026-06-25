/**
 * @file SharedIssueModal.tsx
 * @description Modal TaskPanel dùng chung cho Timeline và ListView.
 * Đăng ký hàm openIssueModal vào ProjectContext để bất kỳ view nào
 * cũng có thể mở TaskModal đầy đủ bằng cách gọi openIssueModal(uuid).
 * Sau mỗi thao tác cập nhật, gọi notifyIssueUpdated() để các view khác tự reload.
 */

import { useEffect, useCallback, useContext, useRef } from "react";
import { useBoard } from "../../hooks/useBoard";
import { ProjectContext } from "../../context/ProjectContext";
import { TaskModal } from "../board/TaskModal";
import type { Task, Status, Priority, User } from "../../types/project";
import { issueApi } from "../../api/services/issueApi";
import { issueToTask, uuidToId } from "../../utils/issueMapper";

export function SharedIssueModal() {
  const { projectId, setOpenIssueModal, notifyIssueUpdated } = useContext(ProjectContext);
  const board = useBoard(projectId);
  const boardRef = useRef(board);
  boardRef.current = board;

  // Tìm hoặc fetch task theo UUID rồi mở modal
  const handleOpenByUuid = useCallback(
    async (uuid: string) => {
      const b = boardRef.current;
      const existing = b.tasks.find(
        (t) => (t as Task & { _uuid?: string })._uuid === uuid,
      );
      if (existing) {
        b.openTask(existing);
        return;
      }
      // Fallback: tasks chưa kịp load → fetch riêng
      if (!projectId) return;
      try {
        const allIssues = await issueApi.getAll(projectId);
        allIssues.forEach((i) => uuidToId(i.id));
        const tasks = allIssues.map((i) => issueToTask(i, allIssues));
        const found = tasks.find(
          (t) => (t as Task & { _uuid?: string })._uuid === uuid,
        );
        if (found) b.openTask(found);
        else console.warn("[SharedIssueModal] Issue not found:", uuid);
      } catch (err) {
        console.error("[SharedIssueModal] Failed to load issue:", err);
      }
    },
    [projectId],
  );

  useEffect(() => {
    setOpenIssueModal(handleOpenByUuid);
  }, [setOpenIssueModal, handleOpenByUuid]);

  // Wrap các actions để tự động notify sau khi thay đổi
  const saveTitle = useCallback((title: string) => {
    board.saveTitle(title);
    notifyIssueUpdated();
  }, [board, notifyIssueUpdated]);

  const saveDescription = useCallback((desc: string) => {
    board.saveDescription(desc);
    notifyIssueUpdated();
  }, [board, notifyIssueUpdated]);

  const changeStatus = useCallback((s: Status) => {
    board.changeStatus(s);
    notifyIssueUpdated();
  }, [board, notifyIssueUpdated]);

  const changePriority = useCallback((p: Priority) => {
    board.changePriority(p);
    notifyIssueUpdated();
  }, [board, notifyIssueUpdated]);

  const changeAssignee = useCallback((users: User[]) => {
    board.changeAssignee(users);
    notifyIssueUpdated();
  }, [board, notifyIssueUpdated]);

  const saveDeadline = useCallback((val: string) => {
    board.saveDeadline(val);
    notifyIssueUpdated();
  }, [board, notifyIssueUpdated]);

  const deleteTask = useCallback((task: Task) => {
    board.deleteTask(task);
    notifyIssueUpdated();
  }, [board, notifyIssueUpdated]);

  return (
    <TaskModal
      task={board.selectedTask}
      open={board.panelOpen}
      allTasks={board.tasks}
      onClose={board.closePanel}
      onOpenTask={board.openTask}
      onSaveTitle={saveTitle}
      onSaveDescription={saveDescription}
      onChangeStatus={changeStatus}
      onChangePriority={changePriority}
      onChangeAssignee={changeAssignee}
      onSaveDeadline={saveDeadline}
      onDeleteTask={deleteTask}
      onLink={board.linkChild}
      onUnlink={board.unlinkChild}
      onToggleSubtask={board.toggleSubtask}
      onAddSubtask={board.addSubtask}
      onDeleteSubtask={board.deleteSubtask}
    />
  );
}
