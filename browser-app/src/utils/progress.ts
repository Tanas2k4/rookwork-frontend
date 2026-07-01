import type { IssueResponse } from "../api/contracts/issue";

/**
 * Tính toán tiến độ phần trăm hoàn thành phân cấp cho toàn bộ danh sách issues:
 * - Nhiệm vụ lá (Task/Bug/Custom): tính dựa theo trạng thái hoặc tỷ lệ subtasks hoàn thành.
 * - Story: trung bình cộng tiến trình của các Task/Custom con.
 * - Epic: trung bình cộng tiến trình của các Story con.
 *
 * @param issues Danh sách tất cả issues trong dự án
 * @returns Bản đồ ánh xạ ID sự vụ sang tỉ lệ phần trăm hoàn thành (0 - 100)
 */
export function computeAllProgress(issues: IssueResponse[]): Record<string, number> {
  const progressMap: Record<string, number> = {};

  const getLeafProgress = (issue: IssueResponse): number => {
    if (issue.status?.statusCategory === "DONE") return 100;
    const subtasks = issue.subtasks || [];
    if (subtasks.length > 0) {
      const done = subtasks.filter((s) => s.isDone).length;
      return Math.round((done / subtasks.length) * 100);
    }
    return issue.status?.statusCategory === "IN_PROGRESS" ? 40 : 0;
  };

  const stories = issues.filter(
    (i) => i.issueType.name.toUpperCase() === "STORY",
  );
  const tasksAndCustom = issues.filter((i) => {
    const typeName = i.issueType.name.toUpperCase();
    return typeName !== "EPIC" && typeName !== "STORY";
  });

  for (const story of stories) {
    const children = tasksAndCustom.filter((t) => t.parentId === story.id);
    if (children.length > 0) {
      const sum = children.reduce(
        (acc, child) => acc + getLeafProgress(child),
        0,
      );
      progressMap[story.id] = Math.round(sum / children.length);
    } else {
      progressMap[story.id] = getLeafProgress(story);
    }
  }

  const epics = issues.filter((i) => i.issueType.name.toUpperCase() === "EPIC");
  for (const epic of epics) {
    const childStories = stories.filter((s) => s.parentId === epic.id);
    if (childStories.length > 0) {
      const sum = childStories.reduce((acc, story) => {
        const storyProg =
          progressMap[story.id] !== undefined
            ? progressMap[story.id]
            : getLeafProgress(story);
        return acc + storyProg;
      }, 0);
      progressMap[epic.id] = Math.round(sum / childStories.length);
    } else {
      progressMap[epic.id] = getLeafProgress(epic);
    }
  }

  for (const issue of issues) {
    if (progressMap[issue.id] === undefined) {
      progressMap[issue.id] = getLeafProgress(issue);
    }
  }

  return progressMap;
}
