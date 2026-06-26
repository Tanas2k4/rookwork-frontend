export interface InvitationResponse {
  id: string;
  projectId: string;
  projectName: string;
  invitedById: string;
  invitedByName: string;
  invitedUserId?: string;
  invitedUserName?: string;
  invitedUserEmail?: string;
  invitedUserPicture?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  createdAt: string;    
}