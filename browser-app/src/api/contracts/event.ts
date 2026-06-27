export interface UserSummary {
  id: string;
  profileName: string;
  picture?: string;
  email?: string;
}

export interface EventResponse {
  id: string;
  eventName: string;
  eventDescription?: string;
  startTime: string;
  endTime: string;
  location?: string;
  color?: string;
  creator: UserSummary;
  guests: UserSummary[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventRequest {
  eventName: string;
  eventDescription?: string;
  startTime: string;
  endTime: string;
  location?: string;
  color?: string;
  guestEmails?: string[];
  projectId?: string;
}
