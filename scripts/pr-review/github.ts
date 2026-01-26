import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import type { PullRequestContext, FileDiff } from './types';

export class GitHubClient {
  private octokit: Octokit;
  private context: PullRequestContext;

  constructor(token: string, context: PullRequestContext) {
    this.octokit = new Octokit({
      auth: token,
      userAgent: 'changjun-test-bot/1.0.0',
    });
    this.context = context;
  }

  /**
   * GitHub App 인증으로 Octokit 생성
   * GitHub App의 APP_ID, PRIVATE_KEY, INSTALLATION_ID이 필요합니다
   */
  static async createFromGitHubApp(
    appId: string,
    privateKey: string,
    installationId: string,
    context: PullRequestContext
  ): Promise<GitHubClient> {
    const auth = createAppAuth({
      appId,
      privateKey,
      installationId,
    });

    const installationAuth = await auth({ type: 'installation' });
    const token = installationAuth.token;

    return new GitHubClient(token, context);
  }

  async getPRDetails(): Promise<PullRequestContext> {
    const { data } = await this.octokit.rest.pulls.get({
      owner: this.context.owner,
      repo: this.context.repo,
      pull_number: this.context.prNumber,
    });

    return {
      ...this.context,
      title: data.title,
      description: data.body || '',
    };
  }

  async getDiff(): Promise<FileDiff[]> {
    const { data: files } = await this.octokit.rest.pulls.listFiles({
      owner: this.context.owner,
      repo: this.context.repo,
      pull_number: this.context.prNumber,
      per_page: 100,
    });

    return files.map((file) => ({
      path: file.filename,
      status: file.status as FileDiff['status'],
      additions: file.additions,
      deletions: file.deletions,
      patch: file.patch,
    }));
  }

  async getFileContent(path: string, ref: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.context.owner,
        repo: this.context.repo,
        path,
        ref,
      });

      if ('content' in data && data.type === 'file') {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      return '';
    } catch {
      return '';
    }
  }

  async createReviewComment(
    body: string,
    comments: Array<{ path: string; line: number; body: string }> = []
  ): Promise<void> {
    await this.octokit.rest.pulls.createReview({
      owner: this.context.owner,
      repo: this.context.repo,
      pull_number: this.context.prNumber,
      event: 'COMMENT',
      body,
      comments,
    });
  }

  async createReviewReply(summary: string): Promise<void> {
    await this.octokit.rest.issues.createComment({
      owner: this.context.owner,
      repo: this.context.repo,
      issue_number: this.context.prNumber,
      body: summary,
    });
  }

  async addReaction(commentId: number, reaction: '+1' | '-1' | 'laugh' | 'confused' | 'heart' | 'hooray' | 'rocket' | 'eyes'): Promise<void> {
    await this.octokit.rest.reactions.createForIssueComment({
      owner: this.context.owner,
      repo: this.context.repo,
      comment_id: commentId,
      content: reaction,
    });
  }
}
