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
너는 코드 리뷰어다. 제공된 PR 정보와 diff를 분석하여 JSON 형식으로만 응답해라.

## 리뷰 규칙
${this.reviewRules}

## 출력 형식 - JSON ONLY
반드시 아래 JSON 형식으로만 출력해라. 마크다운, 설명, 코드 블록 없이 JSON 문자열만 출력:

{"overall":"요약","strengths":[],"concerns":[],"suggestions":[],"comments":[]}

- overall: 전체 요약 (2-3문장)
- strengths: 좋은 점 배열
- concerns: 우려되는 점 배열
- suggestions: 개선 제안 배열
- comments: 라인별 코멘트 배열 (path, line, code, comment, severity)

comments는 실제 diff에서 변경된 라인에만 작성. severity는 info/warning/error.
`;

    const userPrompt = `
PR #${this.context.prNumber} in ${this.context.owner}/${this.context.repo}
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

        // 명시적으로 JSON 요청 메시지 추가
        history.push({
          role: 'user',
          parts: [{
            text: '위 정보를 바탕으로 리뷰를 완료하세요. 반드시 JSON 형식으로만 출력하세요. 코드 블록이나 마크다운 없이 JSON 문자열만 출력해야 합니다.'
          }]
        });

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
   * PR에 리뷰 코멘트 게시
   */
  async postReviewComment(markdown: string): Promise<void> {
    try {
      await this.mcpClient.callTool({
        name: 'add_issue_comment',
        arguments: {
          owner: this.context.owner,
          repo: this.context.repo,
          issue_number: this.context.prNumber,
          body: markdown,
        },
      });
      console.log('[MCP] ✅ Review comment posted to PR');
    } catch (error) {
      console.error('[MCP] ❌ Failed to post review comment:', error);
      throw error;
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
