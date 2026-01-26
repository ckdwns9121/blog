import { GitHubClient } from './github';
import { PRAgent } from './agent/agent';
import { parseDiffPatch } from './diff-parser';
import type { ReviewSummary } from './types';

function formatReviewMarkdown(summary: ReviewSummary, thoughts: string[]): string {
  const sections: string[] = [];

  sections.push('## 🤖 AI 코드 리뷰 (Agentic)\n');

  // AI의 사고 과정 포함
  if (thoughts.length > 0) {
    sections.push('### 🧠 사고 과정\n');
    thoughts.slice(0, 5).forEach((t) => sections.push(`- ${t}\n`));
    sections.push('');
  }

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

  sections.push('\n---\n*리뷰는 [Gemini AI](https://ai.google.dev/) Agent에 의해 생성되었습니다.*');

  return sections.join('\n');
}

function parseJSONResponse(text: string): ReviewSummary {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                     text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    return {
      overall: parsed.overall || '리뷰를 생성했습니다.',
      strengths: parsed.strengths || [],
      concerns: parsed.concerns || [],
      suggestions: parsed.suggestions || [],
      comments: (parsed.comments || []).map((c: any) => ({
        ...c,
        severity: c.severity || 'info',
      })),
    };
  } catch (error) {
    console.error('Failed to parse response:', error);
    return {
      overall: text.substring(0, 500),
      strengths: [],
      concerns: [],
      suggestions: [],
      comments: [],
    };
  }
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
  };

  console.log('\n=== Context ===');
  console.log('Owner:', context.owner);
  console.log('Repo:', context.repo);
  console.log('PR Number:', context.prNumber);
  console.log('Agent Mode: Agentic (AI가 스스로 도구를 선택하고 실행)');

  // GitHub App 인증이 있으면 사용, 없으면 기본 토큰 사용
  let github: GitHubClient;
  if (APP_ID && APP_PRIVATE_KEY && APP_INSTALLATION_ID) {
    console.log('\n=== Authentication ===');
    console.log('Method: GitHub App');
    console.log('App ID:', APP_ID);
    console.log('Installation ID:', APP_INSTALLATION_ID);

    let privateKey = APP_PRIVATE_KEY;
    if (!privateKey.includes('BEGIN RSA PRIVATE KEY')) {
      console.log('Private Key format: Base64 encoded, decoding...');
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
        console.log('Private Key decoded successfully');
      } catch {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
    } else {
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

  // Agent 실행
  const agent = new PRAgent(GEMINI_API_KEY, { ...context, github }, 'gemini-2.5-flash');
  const { review, thoughts } = await agent.run(10);

  console.log('\n=== Parsing Review ===');
  const summary = parseJSONResponse(review);

  // 라인 번호 유효성 검사
  const diffs = await github.getDiff();
  const validComments = [];

  for (const comment of summary.comments) {
    const fileDiff = diffs.find((d) => d.path === comment.path);
    if (!fileDiff || !fileDiff.patch) continue;

    const changedLines = parseDiffPatch(fileDiff.patch);
    const isValidLine = changedLines.some((l) => l.line === comment.line);

    if (isValidLine) {
      validComments.push(comment);
    } else {
      console.log(`Skipping invalid line comment: ${comment.path}:${comment.line}`);
    }
  }

  summary.comments = validComments;

  console.log('\n=== Review Summary ===');
  console.log('Overall:', summary.overall?.substring(0, 100) + '...');
  console.log('Strengths:', summary.strengths.length);
  console.log('Concerns:', summary.concerns.length);
  console.log('Suggestions:', summary.suggestions.length);
  console.log('Line comments:', summary.comments.length);
  console.log('Thoughts logged:', thoughts.length);

  // Post review comment
  console.log('\n=== Posting Review ===');
  const thoughtSummaries = thoughts.map((t) => `[${t.type}] ${t.content}`);
  const markdown = formatReviewMarkdown(summary, thoughtSummaries);
  console.log('Review markdown length:', markdown.length);

  if (summary.comments.length > 0) {
    console.log(`Posting ${summary.comments.length} line comments with review body...`);
    const lineComments = summary.comments.map((c) => ({
      path: c.path,
      line: c.line,
      body: `${c.severity === 'error' ? '🚫' : c.severity === 'warning' ? '⚠️' : '💬'} ${c.comment}`,
    }));

    await github.createReviewComment(markdown, lineComments);
    console.log('Review with line comments posted successfully');
  } else {
    console.log('No line comments, posting review as general comment...');
    await github.createReviewReply(markdown);
    console.log('Review comment posted successfully');
  }

  console.log('\n=== PR Review Completed Successfully ===');
}

main().catch((error) => {
  console.error('PR review failed:', error);
  process.exit(1);
});
