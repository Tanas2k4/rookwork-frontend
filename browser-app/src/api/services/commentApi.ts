import { apiClient } from "../apiClient";
import type { CommentResponse, CommentReactionResponse, CreateCommentRequest } from "../contracts/comment";

export const commentApi = {
  getByIssue: (projectId: string, issueId: string) =>
    apiClient.get<CommentResponse[]>(
      `/api/projects/${projectId}/issues/${issueId}/comments`,
    ),

  create: (projectId: string, issueId: string, data: CreateCommentRequest) =>
    apiClient.post<CommentResponse>(
      `/api/projects/${projectId}/issues/${issueId}/comments`,
      data,
    ),

  update: (
    projectId: string,
    issueId: string,
    commentId: string,
    data: CreateCommentRequest,
  ) =>
    apiClient.put<CommentResponse>(
      `/api/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
      data,
    ),

  delete: (projectId: string, issueId: string, commentId: string) =>
    apiClient.delete<void>(
      `/api/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
    ),

  /**
   * Thả / đổi / gỡ biểu cảm trên một bình luận.
   * Server trả về danh sách reactions tổng hợp mới nhất của bình luận đó.
   */
  react: (projectId: string, issueId: string, commentId: string, reactionType: string) =>
    apiClient.post<CommentReactionResponse[]>(
      `/api/projects/${projectId}/issues/${issueId}/comments/${commentId}/reactions`,
      { reactionType },
    ),
};