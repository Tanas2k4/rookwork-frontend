export interface SystemAlert {
  type: "warn" | "err" | "ok";
  content: string;
  time: string;
}

export interface RecentWorkspace {
  id: string;
  name: string;
  memberCount: number;
  owner: string;
  createdAt: string;
  plan: string;
  status?: string;
}

export interface AdminStatsResponse {
  totalUsers: number;
  activeWorkspaces: number;
  issuesToday: number;
  mrr: number;
  userGrowth: number[];
  workspaceGrowth: number[];
  issueGrowth: number[];
  userGrowthLabels: string[];
  planDistribution: Record<string, number>;
  issueDistribution: Record<string, number>;
  recentWorkspaces: RecentWorkspace[];
  alerts: SystemAlert[];
}

export interface AdminUserResponse {
  id: string;
  profileName: string;
  email: string;
  picture?: string | null;
  systemRole: string;
  plan: string;
  workspace: string;
  lastLogin: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface SystemLog {
  type: "warn" | "err" | "ok";
  content: string;
  time: string;
}

export interface SystemHealthResponse {
  uptime30d: string;
  apiLatency: string;
  errorRate: string;
  jobQueue: number;
  cpuUsage: string;
  memoryUsage: string;
  logs: SystemLog[];
}
