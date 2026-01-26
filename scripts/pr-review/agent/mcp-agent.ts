import { GoogleGenAI, mcpToTool } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ThoughtLog } from './types';

export interface MCPAgentContext {
  owner: string;
  repo: string;
  prNumber: number;
  baseSha: string;
  headSha: string;
  githubToken: string;
}

interface MCPMessage {
  role: 'user' | 'model';
  parts: any[];
}

/**
 * MCP GitHub 서버를 사용하는 Agentic PR 리뷰어
 *
 * GitHub MCP 서버가 제공하는 도구들을 사용하여:
 * - pull_requests.get: PR 정보 가져오기
 * - pull_requests.list_files: 변경된 파일 목록 가져오기
 * - pull_requests.create_review_comment: 리뷰 코멘트 생성
 * - search.code: 코드 검색
 * -_commits.get: 커밋 정보 가져오기
 */
export class MCPAgent {
  private ai: GoogleGenAI;
  private mcpClient: Client;
  private context: MCPAgentContext;
  private thoughtLogs: ThoughtLog[] = [];
  private model: string;
  private reviewRules: string;

  constructor(apiKey: string, context: MCPAgentContext, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.context = context;
    this.model = model;
    this.reviewRules = this.loadReviewRules();

    // MCP Client 초기화
    this.mcpClient = new Client(
      { name: 'pr-review-agent', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
  }

  /**
   * 리뷰 규칙 파일 로드
   */
  private loadReviewRules(): string {
    try {
      const rulesPath = join(__dirname, '../review-rules.toml');
      const rules = readFileSync(rulesPath, 'utf-8');
      console.log('[Agent] 📋 Review rules loaded (TOML)');
      return rules;
    } catch (error) {
      console.warn('[Agent] ⚠️ Could not load review rules, using defaults');
      return '';
    }
  }

  /**
   * GitHub MCP 서버에 연결
   */
  async connect(): Promise<void> {
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        ...process.env,
        GITHUB_PERSONAL_ACCESS_TOKEN: this.context.githubToken,
      },
    });

    // 로깅 래핑
    const originalCallTool = this.mcpClient.callTool.bind(this.mcpClient);
    this.mcpClient.callTool = async (params: any, resultSchema?: any, options?: any) => {
      const timestamp = new Date().toISOString();
      console.log(`  [MCP] 🛠️ ${params.name}(${JSON.stringify(params.arguments ?? {})})`);
      const result = await originalCallTool(params, resultSchema, options);
      console.log(`  [MCP] ✅ ${params.name} completed`);
      return result;
    };

    await this.mcpClient.connect(transport);
    console.log('[MCP] 🔌 Connected to GitHub MCP Server');
  }

  /**
   * Agent 실행 - 수동 멀티턴 루프
   */
  async run(maxLoops: number = 15): Promise<{ review: string; thoughts: ThoughtLog[] }> {
    console.log('\n=== 🤖 MCP Agent Starting ===\n');

    const systemInstruction = `
너는 **Agentic AI 코드 리뷰어**다.

## 프로젝트 리뷰 규칙 (TOML 형식)

아래 규칙은 TOML 형식으로 되어 있으며, 각 섹션별로 리뷰 기준을 정의합니다:
- [architecture]: FSD 패턴, 레이어 규칙
- [typescript]: 타입 안전성, any 금지
- [react]: Server/Client Component, Hooks, State 관리
- [performance]: 이미지, 데이터 fetching, 번들 크기
- [security]: 입력 검증, 시크릿 관리, XSS 방지
- [code_style]: 명명 규칙, 파일 구조
- [error_handling]: 에러 처리 패턴
- [quality]: 테스트, 품질 기준
- [notion_api]: Notion API 특이사항
- [checklist]: 리뷰 체크리스트

---
${this.reviewRules}
---

## 리뷰 절차

1. **계획 (Planning)**
   - pull_requests.get로 PR 정보 확인
   - pull_requests.list_files로 변경된 파일과 **patch(diff)** 확인
   - 어떤 관점에서 리뷰할지 계획

2. **정보 수집 (Information Gathering)**
   - **중요**: pull_requests.list_files 응답의 **patch 필드**를 확인하세요
   - patch에는 실제 변경된 코드가 포함되어 있습니다
   - 필요하면 search.code로 관련 코드 찾기

3. **분석 (Analysis)**
   - 위 리뷰 규칙에 따라 코드 품질, 아키텍처, 보안, 성능 확인
   - **patch에 있는 실제 변경 코드만** 분석하세요
   - 변경된 코드가 프로젝트 패턴과 일치하는지 확인
   - 구체적인 개선 사항을 도출

4. **결론 (Conclusion)**
   - 전체 요약, 잘한 점, 우려되는 점, 개선 제안
   - JSON 형식으로 최종 리뷰 반환

## 중요 사항

- **즉시 실행**: "준비됨" 같은 불필요한 말 대신 바로 도구 호출 시작
- **도구 사용**: PR 정보 조회, 파일 목록 조회, 코드 검색에만 도구 사용
- **리뷰 반환**: create_pull_request_review 같은 리뷰 생성 도구는 호출하지 말고 JSON으로만 반환
- **라인 코멘트**: comments 배열의 라인 번호는 diff에서 +로 시작하는 라인의 번호 사용
- **한국어 응답**: 모든 리뷰는 한국어로 작성
- **규칙 기반 리뷰**: 위 프로젝트 리뷰 규칙을 우선적으로 적용

## ⚠️ diff 기반 정확한 리뷰를 위한 필수 규칙

**pull_requests.list_files의 응답 구조:**
```
files: [
  {
    filename: "path/to/file.ts",
    status: "modified",
    patch: "@@ -1,3 +1,4 @@\n-old line\n+new line"  // 실제 변경 내용
  }
]
```

**리뷰 시 반드시 따를 것:**
1. **patch 필드 확인**: 파일의 `patch` 속성에 있는 실제 diff만 보고 코멘트 작성
2. **+로 시작하는 라인만**: 추가된 라인(+)에 대해서만 코멘트
3. **실제 변경내용 인용**: 코멘트에 변경된 코드를 직접 인용하여 근거 제시
4. **파일명만 보지 말기**: 파일 이름만 보고 추측하지 말기

**나쁜 예 (파일명만 보고 추측):**
```
// components.json 변경이니까 경로 설정 문제가 있겠군요
```

**좋은 예 (실제 diff 참고):**
```
// diff에서 "utils": "@/shared/lib"와 "lib": "@/shared/lib"가 중복되어 있어서
// 둘 중 하나로 통일하는 것이 좋겠습니다.
```

**라인 코멘트 형식:**
- path: 실제 변경된 파일 경로
- line: diff에서 +로 시작한 라인의 번호
- comment: "변경된 코드: \`코드 내용\` - 이렇게 된 이유와 개선안"

## 사용 가능한 도구 (정보 수집용)

- pull_requests.get: PR 정보 가져오기
- pull_requests.list_files: **변경된 파일 목록과 patch(diff) 가져오기** (중요!)
- search.code: 코드 검색
- commits.get: 커밋 정보 가져오기

## 최종 응답 형식

모든 정보 수집과 분석을 완료한 후, 다음 JSON 형식으로 최종 리뷰를 반환하세요:

\`\`\`json
{
  "overall": "전체 리뷰 요약 (2-3문장)",
  "strengths": ["좋은 점 1", "좋은 점 2"],
  "concerns": ["우려되는 점 1", "우려되는 점 2"],
  "suggestions": ["개선 제안 1", "개선 제안 2"],
  "comments": [
    {
      "path": "파일 경로",
      "line": 라인 번호,
      "code": "실제 변경된 코드 일부",
      "comment": "변경된 코드에 대한 구체적인 코멘트",
      "severity": "info"
    }
  ]
}
\`\`\`

**comments 필드 규칙:**
- 반드시 patch에서 실제 변경된 라인에만 코멘트
- code 필드에 변경된 코드를 포함하여 근거 명시
- 실제 변경이 없는 파일에는 코멘트 작성하지 말기
- severity: "info" (정보), "warning" (권장), "error" (심각한 문제)
`;

    const userPrompt = `
PR #${this.context.prNumber} in ${this.context.owner}/${this.context.repo}를 리뷰해주세요.

Repository: ${this.context.owner}/${this.context.repo}
PR Number: ${this.context.prNumber}
Base SHA: ${this.context.baseSha}
Head SHA: ${this.context.headSha}

단계별로 생각하면서 리뷰를 진행해주세요. 먼저 도구를 호출하여 PR 정보와 diff를 가져오세요.
`;

    // 히스토리 초기화
    let history: MCPMessage[] = [
      { role: 'user', parts: [{ text: userPrompt }] }
    ];

    let finalResponseText = '';
    let loopCount = 0;

    console.log('[Agent] 🧠 Starting reasoning loop...\n');

    // 수동 멀티턴 루프
    while (loopCount < maxLoops) {
      loopCount++;
      console.log(`[Agent] --- Iteration ${loopCount} ---`);

      const result = await this.ai.models.generateContent({
        model: this.model,
        systemInstruction,
        contents: history,
        config: {
          tools: [mcpToTool(this.mcpClient)],
          // 첫 턴에는 도구 사용 강제
          toolConfig: {
            functionCallingConfig: {
              mode: loopCount === 1 ? 'ANY' : 'AUTO',
            },
          },
        },
      });

      const response = result.candidates[0].content;
      history.push({ role: 'model', parts: response.parts });

      // 사고 추출
      this.extractThoughts(response);

      // 함수 호출 확인
      const toolCalls = response.parts.filter((p: any) => p.functionCall);

      if (toolCalls.length === 0) {
        // 더 이상 호출할 도구가 없으면 종료
        finalResponseText = result.text || '';
        break;
      }

      console.log(`[Agent] 🔧 Tool calls: ${toolCalls.map((tc: any) => tc.functionCall.name).join(', ')}`);

      // 도구 실행 및 결과 수집
      const functionResponses: any[] = [];

      // 차단할 도구 목록 (GitHub Actions에서 PR 승인/코멘트 작성 불가)
      const BLOCKED_TOOLS = [
        'create_pull_request_review',
        'create_review_comment',
        'pull_requests.create_review_comment',
        'pull_requests.create_review',
      ];

      for (const call of toolCalls) {
        const toolName = call.functionCall.name;

        // 차단된 도구인 경우 건너뛰기
        if (BLOCKED_TOOLS.some(blocked => toolName.includes(blocked))) {
          console.log(`[Agent] ⚠️ Tool '${toolName}' is blocked - returning JSON instead`);
          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: {
                content: 'This tool is blocked. Please return the review as JSON format instead.',
                blocked: true,
              },
            },
          });
          continue;
        }

        try {
          const mcpResult = await this.mcpClient.callTool({
            name: toolName,
            arguments: call.functionCall.args,
          });
          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: { content: mcpResult.content },
            },
          });
        } catch (error) {
          console.error(`[Agent] ❌ Tool ${toolName} failed:`, error);
          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: { error: error instanceof Error ? error.message : 'Unknown error' },
            },
          });
        }
      }

      // 도구 결과를 히스토리에 추가
      history.push({ role: 'user', parts: functionResponses });
    }

    console.log('\n=== 🤖 MCP Agent Completed ===\n');

    // 연결 종료는 호출자가 처리
    return {
      review: finalResponseText,
      thoughts: this.thoughtLogs,
    };
  }

  /**
   * 사고 추출
   */
  private extractThoughts(response: any): void {
    if (!response || !response.parts) return;

    for (const part of response.parts) {
      if (part.thought && part.text) {
        console.log(`[Agent] 💭 ${part.text}`);
        this.thoughtLogs.push({
          timestamp: new Date().toISOString(),
          type: 'analysis',
          content: part.text,
        });
      }
    }
  }

  /**
   * 연결 종료
   */
  async close(): Promise<void> {
    try {
      await this.mcpClient.close();
      console.log('[MCP] 🔌 Connection closed');
    } catch (e) {
      // 무시
    }
  }
}
