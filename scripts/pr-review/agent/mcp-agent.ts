import { GoogleGenAI, mcpToTool } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
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

  constructor(apiKey: string, context: MCPAgentContext, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.context = context;
    this.model = model;

    // MCP Client 초기화
    this.mcpClient = new Client(
      { name: 'pr-review-agent', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
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

## 리뷰 절차

1. **계획 (Planning)**
   - pull_requests.get로 PR 정보 확인
   - pull_requests.list_files로 변경된 파일 확인
   - 어떤 관점에서 리뷰할지 계획

2. **정보 수집 (Information Gathering)**
   - 필요하면 search.code로 관련 코드 찾기
   - commits.get으로 특정 커밋 확인

3. **분석 (Analysis)**
   - 코드 품질, 유지보수성, 잠재적 버그 확인
   - 보안 문제, 성능 저하 가능성 확인

4. **결론 (Conclusion)**
   - 전체 요약, 잘한 점, 우려되는 점, 개선 제안
   - JSON 형식으로 최종 리뷰 반환

## 중요 사항

- **즉시 실행**: "준비됨" 같은 불필요한 말 대신 바로 도구 호출 시작
- **도구 사용**: PR 정보 조회, 파일 목록 조회, 코드 검색에만 도구 사용
- **리뷰 반환**: create_pull_request_review 같은 리뷰 생성 도구는 호출하지 말고 JSON으로만 반환
- **라인 코멘트**: comments 배열의 라인 번호는 diff에서 +로 시작하는 라인의 번호 사용
- **한국어 응답**: 모든 리뷰는 한국어로 작성

## 사용 가능한 도구 (정보 수집용)

- pull_requests.get: PR 정보 가져오기
- pull_requests.list_files: 변경된 파일 목록과 diff 가져오기
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
      "comment": "구체적인 코멘트",
      "severity": "info"
    }
  ]
}
\`\`\`
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
      for (const call of toolCalls) {
        try {
          const mcpResult = await this.mcpClient.callTool({
            name: call.functionCall.name,
            arguments: call.functionCall.args,
          });
          functionResponses.push({
            functionResponse: {
              name: call.functionCall.name,
              response: { content: mcpResult.content },
            },
          });
        } catch (error) {
          console.error(`[Agent] ❌ Tool ${call.functionCall.name} failed:`, error);
          functionResponses.push({
            functionResponse: {
              name: call.functionCall.name,
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
