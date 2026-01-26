import { GoogleGenAI, Type, FunctionCallingConfigMode } from '@google/genai';
import type { Tool, AgentContext, AgentMessage, AgentState, ThoughtLog } from './types';
import { PR_REVIEW_TOOLS, toFunctionDeclarations } from './tools';

const SYSTEM_PROMPT = `너는 **AI 코드 리뷰 전문가**이다.

## 리뷰 절차

1. **계획 (Planning)**: PR을 이해하고 리뷰 전략을 세운다
   - `get_pr_details()`로 PR 정보 확인
   - `get_file_diff()`로 변경된 파일 확인
   - 어떤 관점에서 리뷰할지 계획

2. **정보 수집 (Information Gathering)**: 필요한 컨텍스트를 수집한다
   - 중요한 파일은 `get_file_content()`로 전체 내용 확인
   - `log_thought()`로 사고 과정을 기록

3. **분석 (Analysis)**: 변경사항을 분석한다
   - 코드 품질, 유지보수성, 잠재적 버그 확인
   - 보안 문제, 성능 저하 가능성 확인
   - `log_thought()`로 발견한 사항을 기록

4. **결론 (Conclusion)**: 최종 리뷰를 작성한다
   - 전체 요약, 잘한 점, 우려되는 점, 개선 제안
   - 구체적인 라인별 코멘트 (반드시 실제 변경된 라인만 지정)

## 중요 사항

- **라인 번호 정확성**: 라인별 코멘트는 반드시 diff에서 실제 변경된 라인(`+`로 시작)만 지정하세요
- **사고 기록**: 중요한 추론 과정은 `log_thought()`로 기록하세요
- **한국어 응답**: 모든 리뷰는 한국어로 작성하세요

## 최종 응답 형식

모든 도구 호출을 완료한 후, 다음 JSON 형식으로 최종 리뷰를 반환하세요:

\`\`\`json
{
  "overall": "전체 리뷰 요약 (2-3문장)",
  "strengths": ["좋은 점 1", "좋은 점 2"],
  "concerns": ["우려되는 점 1", "우려되는 점 2"],
  "suggestions": ["개선 제안 1", "개선 제안 2"],
  "comments": [
    {
      "path": "파일 경로",
      "line": 라인 번호 (실제 변경된 라인만),
      "comment": "구체적인 코멘트",
      "severity": "info" | "warning" | "error"
    }
  ]
}
\`\`\``;

export class PRAgent {
  private ai: GoogleGenAI;
  private model: string;
  private tools: Tool[];
  private context: AgentContext;
  private thoughtLogs: ThoughtLog[] = [];

  constructor(apiKey: string, context: AgentContext, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
    this.context = context;
    this.tools = PR_REVIEW_TOOLS;
  }

  /**
   * Agent 루프 실행
   * AI가 도구를 호출하고, 결과를 받아서, 다시 생각하고, 필요하면 더 도구를 호출합니다
   */
  async run(maxIterations: number = 10): Promise<{ review: string; thoughts: ThoughtLog[] }> {
    console.log('\n=== 🤖 PR Agent Starting ===\n');

    const state: AgentState = {
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `PR #${this.context.prNumber} in ${this.context.owner}/${this.context.repo}를 리뷰해주세요.

Repository: ${this.context.owner}/${this.context.repo}
PR Number: ${this.context.prNumber}
Base SHA: ${this.context.baseSha}
Head SHA: ${this.context.headSha}

단계별로 생각하면서 리뷰를 진행해주세요. 필요한 정보를 얻기 위해 도구를 적극적으로 활용하세요.`,
        },
      ],
      iteration: 0,
      completed: false,
    };

    // Agent 루프
    while (!state.completed && state.iteration < maxIterations) {
      state.iteration++;
      console.log(`\n--- Iteration ${state.iteration} ---`);

      const result = await this.executeStep(state);

      if (result.completed) {
        state.completed = true;
        state.finalAnswer = result.answer;
        break;
      }

      // AI의 응답과 도구 실행 결과를 메시지에 추가
      state.messages.push(...result.newMessages);
    }

    if (!state.finalAnswer) {
      throw new Error('Agent failed to produce final answer');
    }

    console.log('\n=== 🤖 PR Agent Completed ===\n');

    return {
      review: state.finalAnswer,
      thoughts: this.thoughtLogs,
    };
  }

  /**
   * 한 단계 실행: AI 호출 → 도구 실행 → 결과 반환
   */
  private async executeStep(state: AgentState) {
    const functionDeclarations = toFunctionDeclarations(this.tools);

    // AI 호출 (사고 활성화)
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: this.formatMessages(state.messages),
      config: {
        tools: [{ functionDeclarations }],
        thinkingConfig: {
          thinkingBudget: 8192, // 사고 토큰 예산
        },
        // 함수 호출 모드: AI가 필요할 때만 도구 호출
        toolConfig: {
          functionCallingConfig: {
            mode: FunctionCallingConfigMode.AUTO,
          },
        },
      },
    });

    // 사고 추출
    this.extractThoughts(response);

    // 함수 호출 확인
    const functionCalls = response.functionCalls;

    if (!functionCalls || functionCalls.length === 0) {
      // 함수 호출이 없으면 최종 응답
      const answer = response.text || '';
      return { completed: true, answer, newMessages: [] };
    }

    console.log(`🔧 Tool calls: ${functionCalls.map((fc) => fc.name).join(', ')}`);

    // 함수 실행
    const newMessages: AgentMessage[] = [];

    // 모델 응답 추가
    newMessages.push({
      role: 'assistant',
      content: response.text || '',
      thought: this.getLastThought(),
      toolCalls: functionCalls.map((fc) => ({
        id: `call_${Date.now()}_${fc.name}`,
        name: fc.name,
        arguments: fc.args,
      })),
    });

    // 각 함수 호출 실행
    for (const fc of functionCalls) {
      const tool = this.tools.find((t) => t.name === fc.name);
      if (!tool) {
        console.error(`Unknown tool: ${fc.name}`);
        continue;
      }

      try {
        console.log(`  → Executing ${fc.name}...`);
        const result = await tool.handler(fc.args, this.context);

        // log_thought 도구 결과는 별도 처리
        if (fc.name === 'log_thought') {
          const typedResult = result as ThoughtLog & { logged: boolean };
          if (typedResult.logged) {
            this.thoughtLogs.push({
              timestamp: typedResult.timestamp,
              type: typedResult.type,
              content: typedResult.content,
            });
          }
        }

        newMessages.push({
          role: 'user',
          content: '',
          toolResults: [
            {
              toolCallId: `call_${Date.now()}_${fc.name}`,
              output: result,
            },
          ],
        });

        console.log(`  ✓ ${fc.name} completed`);
      } catch (error) {
        console.error(`  ✗ ${fc.name} failed:`, error);
        newMessages.push({
          role: 'user',
          content: '',
          toolResults: [
            {
              toolCallId: `call_${Date.now()}_${fc.name}`,
              output: { error: error instanceof Error ? error.message : 'Unknown error' },
            },
          ],
        });
      }
    }

    return { completed: false, answer: '', newMessages };
  }

  /**
   * 사고 추출
   */
  private extractThoughts(response: ReturnType<typeof GoogleGenAI.prototype.models.generateContent>): void {
    // response.candidates[0].content.parts에서 thought 부분 추출
    const candidates = (response as any).candidates;
    if (!candidates || candidates.length === 0) return;

    const content = candidates[0].content;
    if (!content || !content.parts) return;

    for (const part of content.parts) {
      if (part.thought && part.text) {
        console.log(`💭 [THOUGHT] ${part.text}`);
        this.lastThought = part.text;
      }
    }
  }

  private lastThought: string = '';

  private getLastThought(): string {
    return this.lastThought;
  }

  /**
   * 메시지를 Gemini API 형식으로 변환
   */
  private formatMessages(messages: AgentMessage[]) {
    const formatted: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        // 시스템 프롬프트는 첫 번째 사용자 메시지에 통합
        continue;
      }

      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (msg.toolCalls && msg.toolCalls.length > 0) {
        for (const tc of msg.toolCalls) {
          parts.push({
            functionCall: {
              name: tc.name,
              args: tc.arguments,
            },
          });
        }
      }

      if (msg.toolResults && msg.toolResults.length > 0) {
        for (const tr of msg.toolResults) {
          parts.push({
            functionResponse: {
              name: tr.toolCallId.split('_').pop(),
              response: tr.output,
            },
          });
        }
      }

      formatted.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts,
      });
    }

    return formatted;
  }
}
