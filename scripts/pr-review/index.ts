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

  console.log('=== Environment Variables Check ===');
  console.log('GITHUB_TOKEN:', GITHUB_TOKEN ? '***SET***' : 'NOT SET');
  console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? '***SET***' : 'NOT SET');
  console.log('PR_NUMBER:', PR_NUMBER);
  console.log('REPO_OWNER:', REPO_OWNER);
  console.log('REPO_NAME:', REPO_NAME);
  console.log('BASE_SHA:', BASE_SHA);
  console.log('HEAD_SHA:', HEAD_SHA);
  console.log('APP_ID:', APP_ID || 'NOT SET');
  console.log('APP_PRIVATE_KEY:', APP_PRIVATE_KEY ? '***SET***' : 'NOT SET');
  console.log('APP_INSTALLATION_ID:', APP_INSTALLATION_ID || 'NOT SET');

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

  console.log('\n=== Context ===');
  console.log('Owner:', context.owner);
  console.log('Repo:', context.repo);
  console.log('PR Number:', context.prNumber);

  // GitHub App 인증이 있으면 사용, 없으면 기본 토큰 사용
  let github: GitHubClient;
  if (APP_ID && APP_PRIVATE_KEY && APP_INSTALLATION_ID) {
    console.log('\n=== Authentication ===');
    console.log('Method: GitHub App');
    console.log('App ID:', APP_ID);
    console.log('Installation ID:', APP_INSTALLATION_ID);

    // Private Key 처리: \n 문자열을 실제 개행으로 변환하거나 Base64 디코딩
    let privateKey = APP_PRIVATE_KEY;

    // Base64로 인코딩된 경우 디코딩
    if (!privateKey.includes('BEGIN RSA PRIVATE KEY')) {
      console.log('Private Key format: Base64 encoded, decoding...');
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
        console.log('Private Key decoded successfully');
      } catch {
        console.log('Base64 decode failed, trying \\n replacement');
        // Base64 디코딩 실패 시 \n을 개행으로 변환 시도
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
    } else {
      // 이미 PEM 형식이지만 \n 문자열이 포함된 경우
      console.log('Private Key format: PEM format');
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    github = await GitHubClient.createFromGitHubApp(
      APP_ID,
      privateKey,
      APP_INSTALLATION_ID,
      context
    );
    console.log('GitHub App authentication successful');
  } else if (GITHUB_TOKEN) {
    console.log('\n=== Authentication ===');
    console.log('Method: GitHub Token');
    github = new GitHubClient(GITHUB_TOKEN, context);
  } else {
    throw new Error('Either GITHUB_TOKEN or GitHub App credentials are required');
  }

  const reviewer = new GeminiReviewer(GEMINI_API_KEY, 'gemini-2.5-flash');

  // Get PR details
  console.log('\n=== Step 1: Fetching PR Details ===');
  const prDetails = await github.getPRDetails();
  context.title = prDetails.title;
  context.description = prDetails.description;
  console.log('PR Title:', context.title);
  console.log('PR Description length:', context.description.length);

  // Get diff
  console.log('\n=== Step 2: Fetching PR Diff ===');
  const diffs = await github.getDiff();
  console.log(`Total files changed: ${diffs.length}`);
  diffs.forEach((d) => {
    console.log(`  - ${d.path} (${d.status}): +${d.additions} -${d.deletions}`);
  });

  // Review with Gemini
  console.log('\n=== Step 3: Generating Review with Gemini ===');
  console.log('Model: gemini-2.5-flash');
  const summary: ReviewSummary = await reviewer.reviewPR(context, diffs);

  console.log('\n=== Review Summary ===');
  console.log('Overall:', summary.overall?.substring(0, 100) + '...');
  console.log('Strengths:', summary.strengths.length);
  console.log('Concerns:', summary.concerns.length);
  console.log('Suggestions:', summary.suggestions.length);
  console.log('Line comments:', summary.comments.length);
  if (summary.comments.length > 0) {
    summary.comments.forEach((c) => {
      console.log(`  - ${c.path}:${c.line} [${c.severity}]`);
    });
  }

  // Post review comment
  console.log('\n=== Step 4: Posting Review ===');
  const markdown = formatReviewMarkdown(summary);
  console.log('Review markdown length:', markdown.length);

  // 라인별 코멘트가 있으면 createReviewComment 사용 (diff에 직접 코멘트)
  if (summary.comments.length > 0) {
    console.log(`Posting ${summary.comments.length} line comments with review body...`);
    const lineComments = summary.comments.map((c) => ({
      path: c.path,
      line: c.line,
      body: `${c.severity === 'error' ? '🚫' : c.severity === 'warning' ? '⚠️' : '💬'} ${c.comment}`,
    }));

    // 전체 리뷰를 body로, 라인별 코멘트를 comments로 전달
    await github.createReviewComment(markdown, lineComments);
    console.log('Review with line comments posted successfully');
  } else {
    console.log('No line comments, posting review as general comment...');
    // 라인별 코멘트가 없으면 일반 댓글로 전체 리뷰만
    await github.createReviewReply(markdown);
    console.log('Review comment posted successfully');
  }

  console.log('\n=== PR Review Completed Successfully ===');
}

main().catch((error) => {
  console.error('PR review failed:', error);
  process.exit(1);
});
