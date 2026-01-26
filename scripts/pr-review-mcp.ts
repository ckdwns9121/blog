import { GoogleGenAI, mcpToTool, FunctionCallingConfigMode, ThinkingLevel } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PR_NUMBER = Number(process.env.PR_NUMBER!);
const REPO_OWNER = process.env.REPO_OWNER!;
const REPO_NAME = process.env.REPO_NAME!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

async function main() {
  console.log('[Bot] Starting PR review...');

  const serverParams = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_TOKEN },
    });

  if (!GEMINI_API_KEY) {
    console.error('[Error] GEMINI_API_KEY is missing. Please check your .env file or GitHub Secrets.');
    process.exit(1);
  }

  // MCP 연결
  const mcp = new Client({ name: 'pr-review-bot', version: '1.0.0' });
  try {
    await mcp.connect(serverParams);
    console.log('[MCP] ✅ Connected');
    const tools = await mcp.listTools();
    console.log(tools);

  } catch(e) {
    console.error('[MCP] ❌ Failed:', e);
    process.exit(1);
  }


  // 리뷰 규칙 가져오기
  const reviewRules = await readFile(join(process.cwd(), 'scripts/pr-review/review-rules.toml'), 'utf-8');

  // 개선된 프롬프트
  const systemInstruction = `
너는 PR 리뷰 전문가다. 다음 리뷰 규칙을 엄격히 준수해라.

---
[리뷰 규칙 및 프로젝트 설정]
${reviewRules}
---

**PR #${PR_NUMBER} 단일 리뷰 워크플로우:**

1. get_pull_request_files 호출 (1회만)
2. patch 분석 → 최소 3개 라인 코멘트 작성
3. create_pull_request_review 호출 (1회만!)

**중복 호출 금지!**

create_pull_request_review 인자:
- event: "COMMENT" (반드시!)
- body: 전체 요약
- comments: [{path, line(숫자), body}]
`;

  const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const response = await genAI.models.generateContent({
    model: 'gemini-3-flash-preview',  // tool 최적화
    contents: [
      { role: 'user', parts: [{ 
        text: `Review PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME}. 
MCP 도구를 정확히 2회만 사용: 1)get_pull_request_files 2)create_pull_request_review` 
      }] }
    ],
    config: {
      systemInstruction: systemInstruction,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },  
      tools: [mcpToTool(mcp)],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingConfigMode.ANY  // 자연 호출 + 중복 방지
        }
      }
    }
  });
  console.log(response.text);

  console.log('Function Calls:', response.functionCalls);
  if (response.functionCalls?.length) {
    console.log('✅ MCP 도구 호출 성공!');
  } else {
    console.log('⚠️ 텍스트 응답:', response.text?.substring(0, 200));
  }
  
  console.log('[Bot] ✅ Review completed');
  await mcp.close();
}

main().catch(console.error);
