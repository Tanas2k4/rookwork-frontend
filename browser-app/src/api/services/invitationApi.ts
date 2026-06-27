import { apiClient } from "../apiClient";
import type { InvitationResponse } from "../contracts/invitation";

export const invitationApi = {
  // POST /api/invitations/send  — body: { projectId, email }
  send: (projectId: string, email: string) =>
    apiClient.post<void>("/api/invitations/send", { projectId, email }),

  // GET /api/invitations/pending
  getPending: () =>
    apiClient.get<InvitationResponse[]>("/api/invitations/pending"),

  // GET /api/invitations/project/:projectId/pending
  getPendingForProject: (projectId: string) =>
    apiClient.get<InvitationResponse[]>(`/api/invitations/project/${projectId}/pending`),

  // POST /api/invitations/:id/respond?accept=true|false
  respond: (invitationId: string, accept: boolean) =>
    apiClient.post<void>(
      `/api/invitations/${invitationId}/respond?accept=${accept}`,
      null,
    ),

  // DELETE /api/invitations/:id
  cancel: (invitationId: string) =>
    apiClient.delete<void>(`/api/invitations/${invitationId}`),
};
