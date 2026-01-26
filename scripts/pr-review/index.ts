import { GitHubClient } from './github';
import { GeminiReviewer } from './gemini';
import type { ReviewSummary } from './types';

function formatReviewMarkdown(summary: ReviewSummary): string {
  const sections: string[] = [];

  sections.push('## 🤖 AI 코드 리뷰\n');

  if (summary.overall) {
    sections.push(`### 📋 요약\n${summary.overall}\n`);
  }

  if (summary.strengths.length > 0) {
    sections.push('### ✅ 잘한 점\n');
    summary.strengths.forEach((s) => sections.push(`- ${s}`));
    sections.push('');
  }

  if (summary.concerns.length > 0) {
    sections.push('### ⚠️ 주의사항\n');
    summary.concerns.forEach((c) => sections.push(`- ${c}`));
    sections.push('');
  }

  if (summary.suggestions.length > 0) {
    sections.push('### 💡 개선 제안\n');
    summary.suggestions.forEach((s) => sections.push(`- ${s}`));
    sections.push('');
  }

  if (summary.comments.length > 0) {
    sections.push('### 📝 라인별 코멘트\n');
    summary.comments.forEach((c) => {
      const icon = c.severity === 'error' ? '🚫' : c.severity === 'warning' ? '⚠️' : '💬';
      sections.push(`${icon} **\`${c.path}:${c.line}\`**`);
      sections.push(`   ${c.comment}\n`);
    });
  }

  sections.push('\n---\n*리뷰는 [Gemini AI](https://ai.google.dev/)에 의해 생성되었습니다.*');

  return sections.join('\n');
}

async function main() {
  const {
    GITHUB_TOKEN,
    GEMINI_API_KEY,
    PR_NUMBER,
    REPO_OWNER,
    REPO_NAME,
    BASE_SHA,
    HEAD_SHA,
    APP_ID,
    APP_PRIVATE_KEY,
    APP_INSTALLATION_ID,
  } = process.env;

  if (!GEMINI_API_KEY || !PR_NUMBER || !REPO_OWNER || !REPO_NAME) {
    throw new Error('Missing required environment variables');
  }

  const context = {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    prNumber: parseInt(PR_NUMBER, 10),
    baseSha: BASE_SHA || '',
    headSha: HEAD_SHA || '',
    title: '',
    description: '',
  };

  console.log(`Starting PR review for ${REPO_OWNER}/${REPO_NAME}#${PR_NUMBER}`);

  // GitHub App 인증이 있으면 사용, 없으면 기본 토큰 사용
  let github: GitHubClient;
  if (APP_ID && APP_PRIVATE_KEY && APP_INSTALLATION_ID) {
    console.log('Using GitHub App authentication...');
    // Private Key의 \n 문자열을 실제 개행 문자로 변환
    const privateKey = APP_PRIVATE_KEY.replace(/\\n/g, '\n');
    github = await GitHubClient.createFromGitHubApp(
      APP_ID,
      privateKey,
      APP_INSTALLATION_ID,
      context
    );
  } else if (GITHUB_TOKEN) {
    console.log('Using GitHub Token authentication...');
    github = new GitHubClient(GITHUB_TOKEN, context);
  } else {
    throw new Error('Either GITHUB_TOKEN or GitHub App credentials are required');
  }

  const reviewer = new GeminiReviewer(GEMINI_API_KEY, 'gemini-2.5-flash');

  // Get PR details
  console.log('Fetching PR details...');
  const prDetails = await github.getPRDetails();
  context.title = prDetails.title;
  context.description = prDetails.description;

  // Get diff
  console.log('Fetching PR diff...');
  const diffs = await github.getDiff();
  console.log(`Found ${diffs.length} changed files`);

  // Review with Gemini
  console.log('Generating review with Gemini...');
  const summary: ReviewSummary = await reviewer.reviewPR(context, diffs);

  // Post review comment
  console.log('Posting review comment...');
  const markdown = formatReviewMarkdown(summary);
  await github.createReviewReply(markdown);

  console.log('PR review completed successfully!');
}

main().catch((error) => {
  console.error('PR review failed:', error);
  process.exit(1);
});
