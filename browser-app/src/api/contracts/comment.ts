import type { UserSummary } from "./issue";

export interface CommentReactionResponse {
  reactionType: string;
  count: number;
  users: UserSummary[];
}

export interface CreateCommentRequest {
  content: string;
  parentCommentId?: string;
}

export interface CommentResponse {
  id: string;
  content: string;
  issueId: string;
  user: UserSummary;
  createdAt: string;
  updatedAt: string;
  parentCommentId: string | null;
  replies: CommentResponse[];
  reactions: CommentReactionResponse[];
}