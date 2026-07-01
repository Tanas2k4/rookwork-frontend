export interface UpdateProfileRequest {
  profileName?: string;
  picture?: string;
  jobTitle?: string;
  organization?: string;
  location?: string;
  emailPublic?: boolean;
  jobTitlePublic?: boolean;
  organizationPublic?: boolean;
  locationPublic?: boolean;
}



export interface UpdateNotificationsRequest {
  notifyIssueAssigned?: boolean;
  notifyMentioned?: boolean;
  notifyProjectUpdates?: boolean;
  notifyDailyDigest?: boolean;
  notifyComment?: boolean;
  notifyEventInvited?: boolean;
}

export interface UpdatePasswordRequest {
  currentPassword?: string;
  newPassword?: string;
}
