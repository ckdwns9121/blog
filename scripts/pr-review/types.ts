export interface PullRequestContext {
  owner: string;
  repo: string;
  prNumber: number;
  baseSha: string;
  headSha: string;
  title: string;
  description: string;
}

export interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
}

export interface ReviewComment {
  path: string;
  line: number;
  comment: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface ReviewSummary {
  overall: string;
  strengths: string[];
  concerns: string[];
  suggestions: string[];
  comments: ReviewComment[];
}
