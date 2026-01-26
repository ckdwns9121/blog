import { GoogleGenAI } from '@google/genai';
import { buildAnnotatedDiff, parseDiffPatch, type ParsedDiff } from './diff-parser';
import type { PullRequestContext, FileDiff, ReviewSummary, ReviewComment } from './types';

const REVIEW_PROMPT = `You are an expert code reviewer. Analyze the following pull request and provide constructive feedback.

**IMPORTANT - Line Number Accuracy:**
- The "Review these lines" section shows EXACT line numbers that were changed in this PR
- Your line-specific comments MUST use one of these exact line numbers
- Do NOT guess or estimate line numbers - only use numbers from the "Review these lines" list

Guidelines:
- Focus on code quality, maintainability, and potential bugs
- Suggest improvements for performance and security
- Point out any breaking changes or potential issues
- Be concise and actionable in your comments
- Use Korean for all responses

Respond in the following JSON format:
{
  "overall": "전체 리뷰 요약 (2-3문장)",
  "strengths": ["좋은 점 1", "좋은 점 2"],
  "concerns": ["우려되는 점 1", "우려되는 점 2"],
  "suggestions": ["개선 제안 1", "개선 제안 2"],
  "comments": [
    {
      "path": "파일 경로",
      "line": 변경된 라인 번호 (반드시 "Review these lines"에 있는 번호만 사용),
      "comment": "구체적인 코멘트",
      "severity": "info" | "warning" | "error"
    }
  ]
}`;

export class GeminiReviewer {
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.5-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async reviewPR(
    context: PullRequestContext,
    diffs: FileDiff[]
  ): Promise<ReviewSummary> {
    // Filter out deleted files and limit the number of files
    const relevantDiffs = diffs
      .filter((d) => d.status !== 'deleted')
      .filter((d) => d.path.match(/\.(ts|tsx|js|jsx|py|go|rs|java|cs|css|html|json|md)$/))
      .slice(0, 10);

    if (relevantDiffs.length === 0) {
      return this.getEmptyReview();
    }

    // Build context for the AI with annotated diffs
    const diffSummary = this.buildAnnotatedDiffSummary(relevantDiffs);

    const prompt = `${REVIEW_PROMPT}

## Pull Request
**Title:** ${context.title}
**Description:** ${context.description || 'No description provided'}

## Files Changed (${relevantDiffs.length} files)
${diffSummary}

Please analyze these changes and provide your review in the requested JSON format.
**IMPORTANT:** Only use line numbers that are explicitly listed in "Review these lines" for each file.`;

    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        throw new Error('Empty response from Gemini');
      }

      return this.parseResponse(text, relevantDiffs);
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.getErrorReview(error);
    }
  }

  private buildAnnotatedDiffSummary(diffs: FileDiff[]): string {
    return diffs
      .filter((d) => d.patch) // patch가 있는 파일만
      .map((diff) => buildAnnotatedDiff(diff.path, diff.patch!, 4000))
      .join('\n');
  }

  private parseResponse(response: string, diffs: FileDiff[]): ReviewSummary {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/) ||
                       response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      // 라인 번호 유효성 검사 및 필터링
      const validComments = this.validateLineNumbers(
        parsed.comments || [],
        diffs
      );

      return {
        overall: parsed.overall || '리뷰를 생성했습니다.',
        strengths: parsed.strengths || [],
        concerns: parsed.concerns || [],
        suggestions: parsed.suggestions || [],
        comments: validComments.map((c: ReviewComment) => ({
          ...c,
          severity: c.severity || 'info',
        })),
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return {
        overall: response.substring(0, 500),
        strengths: [],
        concerns: [],
        suggestions: [],
        comments: [],
      };
    }
  }

  /**
   * AI가 반환한 라인 번호가 실제 변경된 라인인지 검증
   */
  private validateLineNumbers(comments: ReviewComment[], diffs: FileDiff[]): ReviewComment[] {
    const validComments: ReviewComment[] = [];

    for (const comment of comments) {
      // 해당 파일의 diff를 찾기
      const fileDiff = diffs.find((d) => d.path === comment.path);
      if (!fileDiff || !fileDiff.patch) {
        console.log(`Skipping comment for ${comment.path}:${comment.line} - no diff found`);
        continue;
      }

      // 해당 라인이 실제 변경된 라인인지 확인
      const changedLines = parseDiffPatch(fileDiff.patch);
      const isValidLine = changedLines.some((l) => l.line === comment.line);

      if (isValidLine) {
        validComments.push(comment);
      } else {
        console.log(`Skipping comment for ${comment.path}:${comment.line} - not a changed line`);
        console.log(`  Valid lines for this file: ${changedLines.map((l) => l.line).join(', ')}`);
      }
    }

    return validComments;
  }

  private getEmptyReview(): ReviewSummary {
    return {
      overall: '리뷰할 코드 변경사항이 없습니다.',
      strengths: [],
      concerns: [],
      suggestions: [],
      comments: [],
    };
  }

  private getErrorReview(error: unknown): ReviewSummary {
    return {
      overall: `리뷰 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      strengths: [],
      concerns: ['AI 리뷰를 생성할 수 없습니다'],
      suggestions: ['나중에 다시 시도해주세요'],
      comments: [],
    };
  }
}
