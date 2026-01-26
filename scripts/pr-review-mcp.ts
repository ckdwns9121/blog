import { GoogleGenAI, mcpToTool } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const PR_NUMBER = process.env.PR_NUMBER!;
const REPO_OWNER = process.env.REPO_OWNER!;
const REPO_NAME = process.env.REPO_NAME!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

async function main() {
  console.log('[Bot] Starting PR review...');

  // MCP 연결
  const mcp = new Client({ name: 'pr-review-bot', version: '1.0.0' });
  await mcp.connect(new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_TOKEN },
  }));
  console.log('[MCP] Connected');

  // GenAI + MCP 도구
  const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const systemInstruction = `
너는 PR 리뷰 전문가다.

PR #${PR_NUMBER}를 리뷰해라.

사용 가능한 MCP 도구:
- get_pull_request: PR 정보
- get_pull_request_files: 파일 목록과 patch (diff)
- create_pull_request_review: 리뷰 게시

중요:
1. patch의 @@ 헤더에서 +로 시작하는 라인 번호를 정확히 계산해라
2. create_pull_request_review의 event는 'COMMENT'만 사용해라 (APPROVE/REQUEST_CHANGES 금지)
3. 최소 3개 이상의 라인 코멘트를 작성해라

출력 형식:
{
  "event": "COMMENT",
  "body": "전체 요약",
  "comments": [
    {"path": "파일경로", "line": 숫자, "body": "코멘트"}
  ]
}
`;

  // AI가 MCP 스스로 호출
  const chat = genAI.chats.create({
    model: 'gemini-2.5-flash',
    history: [],
    systemInstruction,
  });

  const result = await chat.sendMessage({
    tools: [mcpToTool(mcp)],
  }, [
    { role: 'user', parts: [{ text: `Review PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME}` }] },
  ]);

  console.log('[Bot] Review completed');
  await mcp.close();
}

main().catch(console.error);
