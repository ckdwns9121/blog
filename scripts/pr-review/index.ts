import { MCPAgent } from './agent/mcp-agent';
import { parseDiffPatch } from './diff-parser';
import type { ReviewSummary } from './types';

function formatReviewMarkdown(summary: ReviewSummary, thoughts: string[]): string {
  const sections: string[] = [];

  sections.push('## 🤖 AI 코드 리뷰 (MCP Agent)\n');

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

  sections.push('\n---\n*리뷰는 [Gemini AI](https://ai.google.dev/) + [GitHub MCP](https://github.com/modelcontextprotocol/servers) Agent에 의해 생성되었습니다.*');

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
  } = process.env;

  console.log('=== Environment Variables Check ===');
  console.log('GITHUB_TOKEN:', GITHUB_TOKEN ? '***SET***' : 'NOT SET');
  console.log('GEMINI_API_KEY:', GEMINI_API_KEY ? '***SET***' : 'NOT SET');
  console.log('PR_NUMBER:', PR_NUMBER);
  console.log('REPO_OWNER:', REPO_OWNER);
  console.log('REPO_NAME:', REPO_NAME);
  console.log('BASE_SHA:', BASE_SHA);
  console.log('HEAD_SHA:', HEAD_SHA);

  if (!GEMINI_API_KEY || !PR_NUMBER || !REPO_OWNER || !REPO_NAME) {
    throw new Error('Missing required environment variables');
  }

  const context = {
    owner: REPO_OWNER,
    repo: REPO_NAME,
    prNumber: parseInt(PR_NUMBER, 10),
    baseSha: BASE_SHA || '',
    headSha: HEAD_SHA || '',
    githubToken: GITHUB_TOKEN!,
  };

  console.log('\n=== Context ===');
  console.log('Owner:', context.owner);
  console.log('Repo:', context.repo);
  console.log('PR Number:', context.prNumber);
  console.log('Agent Mode: MCP Agent (GitHub MCP 서버 연동)');

  // MCP Agent 실행
  const agent = new MCPAgent(GEMINI_API_KEY, context, 'gemini-2.5-flash');

  try {
    // GitHub MCP 서버 연결
    await agent.connect();

    // Agent 실행 (수동 멀티턴 루프)
    const { review, thoughts } = await agent.run(15);

    console.log('\n=== Parsing Review ===');
    const summary = parseJSONResponse(review);

    console.log('\n=== Review Summary ===');
    console.log('Overall:', summary.overall?.substring(0, 100) + '...');
    console.log('Strengths:', summary.strengths.length);
    console.log('Concerns:', summary.concerns.length);
    console.log('Suggestions:', summary.suggestions.length);
    console.log('Line comments:', summary.comments.length);
    console.log('Thoughts logged:', thoughts.length);

    // 리뷰 출력
    const thoughtSummaries = thoughts.map((t) => `[${t.type}] ${t.content}`);
    const markdown = formatReviewMarkdown(summary, thoughtSummaries);
    console.log('\n=== Review Output ===\n');
    console.log(markdown);

  } finally {
    // MCP 연결 종료
    await agent.close();
  }

  console.log('\n=== PR Review Completed Successfully ===');
}

main().catch((error) => {
  console.error('PR review failed:', error);
  process.exit(1);
});
