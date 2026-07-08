export interface ProjectSearchResult {
  id: string;
  projectName: string;
  description?: string;
}

export interface IssueSearchResult {
  id: string;
  issueName: string;
  description?: string;
  issueType: string;
  status?: string;
  projectId: string;
  projectName: string;
}

export interface FileSearchResult {
  id: string;
  originalName: string;
  mimeType: string;
  issueId?: string;
  projectId?: string;
  projectName?: string;
}

export interface SearchResponse {
  projects: ProjectSearchResult[];
  issues: IssueSearchResult[];
  files: FileSearchResult[];
}
