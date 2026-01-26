import { GoogleGenAI, mcpToTool } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client';
// @ts-ignore - Check for module resolution issues with .js extension in imports
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
  async run(maxLoops: number = 10): Promise<{ review: string; thoughts: ThoughtLog[] }> {
    console.log('\n=== 🤖 MCP Agent Starting ===\n');

    // 루프 감지: 동일한 도구 호출 반복 확인
    const recentToolCalls: string[] = [];

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
   - pull_requests.list_files로 변경된 파일과 patch(diff) 확인
   - 어떤 관점에서 리뷰할지 계획

2. **정보 수집 (Information Gathering)**
   - **중요**: pull_requests.list_files 응답의 patch 필드를 확인하세요
   - patch에는 실제 변경된 코드가 포함되어 있습니다
   - 필요하면 search.code로 관련 코드 찾기

3. **분석 (Analysis)**
   - 위 리뷰 규칙에 따라 코드 품질, 아키텍처, 보안, 성능 확인
   - patch에 있는 실제 변경 코드만 분석하세요
   - 변경된 코드가 프로젝트 패턴과 일치하는지 확인
   - 구체적인 개선 사항을 도출

4. **결론 (Conclusion)**
   - 전체 요약, 잘한 점, 우려되는 점, 개선 제안
   - JSON 형식으로 최종 리뷰 반환

## 중요 사항

- **JSON만 반환**: 최종 리뷰는 반드시 JSON 형식으로 반환하세요
- **도구 사용 안 함**: 이미 PR 정보와 diff가 제공됩니다
- **한국어 응답**: 모든 리뷰는 한국어로 작성
- **규칙 기반 리뷰**: 위 프로젝트 리뷰 규칙을 우선적으로 적용

## 최종 응답 형식 (JSON만 반환)

제공된 PR 정보와 diff를 분석하여 다음 JSON 형식으로 리뷰를 반환하세요:

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

comments 필드 규칙:
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

    // 정보 수집 단계 추적
    let hasGatheredInfo = false;
    let getPullRequestCalled = false;
    let getPullRequestFilesCalled = false;
    let jsonRequestSent = false;  // JSON 요청 메시지 전송 여부

    // 단 2단계만 실행: 1) 정보 수집, 2) JSON 리뷰 반환
    while (loopCount < maxLoops && loopCount <= 2) {
      loopCount++;
      console.log(`[Agent] --- Iteration ${loopCount} ---`);

      let result: any;
      let response: any;

      // 1단계: PR 정보와 파일 목록 가져오기
      if (loopCount === 1) {
        console.log('[Agent] 📋 Step 1: Gathering PR information...');

        // 명시적으로 get_pull_request와 get_pull_request_files만 호출
        const prResult = await this.mcpClient.callTool({
          name: 'get_pull_request',
          arguments: { owner: this.context.owner, repo: this.context.repo, pull_number: this.context.prNumber }
        });

        const filesResult = await this.mcpClient.callTool({
          name: 'get_pull_request_files',
          arguments: { owner: this.context.owner, repo: this.context.repo, pull_number: this.context.prNumber }
        });

        // 결과를 히스토리에 추가
        history.push({ role: 'user', parts: [{ functionResponse: { name: 'get_pull_request', response: { content: prResult.content } } }] });
        history.push({ role: 'user', parts: [{ functionResponse: { name: 'get_pull_request_files', response: { content: filesResult.content } } }] });

        console.log('[Agent] ✅ PR information gathered');
        continue;
      }

      // 2단계: AI에게 JSON 리뷰 요청 (도구 없음)
      if (loopCount === 2) {
        console.log('[Agent] 📝 Step 2: Requesting JSON review from AI (NO TOOLS)');

        result = await this.ai.models.generateContent({
          model: this.model,
          systemInstruction,
          contents: history,
          config: {
            // 도구 전혀 제공하지 않음
            toolConfig: {
              functionCallingConfig: {
                mode: 'NONE',
              },
            },
          },
        });

        response = result.candidates[0].content;
        history.push({ role: 'model', parts: response.parts });

        // AI가 반환한 텍스트가 최종 리뷰
        finalResponseText = result.text || '';
        console.log('[Agent] ✅ Review received:', finalResponseText.substring(0, 100) + '...');
        break;
      }

      /* 더 이상 실행되지 않음 */
      break;
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
