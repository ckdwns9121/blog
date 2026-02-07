export interface ReviewConfig {
  anthropicApiKey: string;
  githubToken: string;
  repoOwner: string;
  repoName: string;
  prNumber: number;
  maxTokens?: number;
  model?: string;
}

export function getConfigFromEnv(): ReviewConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const githubToken = process.env.GITHUB_TOKEN;
  const repoOwner = process.env.REPO_OWNER || '';
  const repoName = process.env.REPO_NAME || '';
  const prNumber = parseInt(process.env.PR_NUMBER || '0');

  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  if (!githubToken) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }
  if (!repoOwner || !repoName || !prNumber) {
    throw new Error('REPO_OWNER, REPO_NAME, and PR_NUMBER environment variables are required');
  }

  return {
    anthropicApiKey,
    githubToken,
    repoOwner,
    repoName,
    prNumber,
    maxTokens: 8192,
    model: 'claude-haiku-4-5-20251001'
  };
}
