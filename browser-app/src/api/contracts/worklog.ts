export interface DailyHours {
  label: string;
  hours: number;
}

export interface WorkStatsResponse {
  thisWeek: DailyHours[];
  lastWeek: DailyHours[];
}

export interface LogWorkRequest {
  issueId: string;
  startAt: string;  
  endAt: string;    
  timezone?: string;
  note?: string;
}

export interface WorkLogResponse {
  id: string;
  issueId: string;
  issueName: string;
  userProfileName: string;
  userPicture: string | null;
  hours: number;
  loggedAt: string; // ISO LocalDateTime string
  startAt: string;
  endAt: string;
  createdAt: string;
  note: string | null;
}