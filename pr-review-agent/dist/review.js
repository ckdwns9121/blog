import Anthropic from '@anthropic-ai/sdk';
import { parseDiff, formatDiffForReview } from './diff-parser.js';
/**
 * Generate PR review using Claude (한글)
 */
export async function generateReview(diffText, prTitle, prDescription, config) {
    const anthropic = new Anthropic({
        apiKey: config.anthropicApiKey,
    });
    const parsedDiff = parseDiff(diffText);
    const formattedDiff = formatDiffForReview(parsedDiff);
    const systemPrompt = `당신은 전문 코드 리뷰어입니다. 다음 역할을 수행하세요:
1. Pull Request 변경 사항을 철저히 분석하세요
2. 잠재적인 버그, 보안 이슈, 문제점을 식별하세요
3. 코드 품질, 가독성, 유지보수성을 위한 개선사항을 제안하세요
4. 변경 사항의 긍정적인 측면을 강조하세요
5. 피드백은 건설적이고 구체적으로 작성하세요

중점 사항:
- 코드 정확성 및 잠재적 버그
- 보안 취약점
- 성능 고려사항
- 코드 스타일 및 가독성
- 모범 사례 준수
- 처리되지 않은 엣지 케이스

**중요:** 모든 리뷰는 **한국어**로 작성하세요.`;
    const userMessage = `# 리뷰할 Pull Request

**제목:** ${prTitle}

**설명:**
${prDescription || '설명 없음.'}

## 변경 사항

${formattedDiff}

---

다음 형식으로 종합 리뷰를 제공하세요:

## 📋 요약
[이 PR이 무엇을 하는지 2-3문장으로 간략히 설명]

## 🔴 우려사항 (Concerns)
[치명적인 이슈, 버그, 보안 우려 - 파일과 라인 번호를 구체적으로 명시]

## 💡 제안사항 (Suggestions)
[코드 품질, 가독성, 모범 사례를 위한 개선사항]

## ✅ 긍정적 측면 (Positives)
[이 PR에서 잘한 점]

---

**파일별 코멘트:**

각 파일에서 발견된 주요 이슈나 개선사항에 대해 다음 **JSON 형식**으로 작성하세요:
\`\`\`json
{
  "fileComments": [
    {
      "path": "파일경로",
      "line": 라인번호,
      "body": "코멘트 내용 (한국어)"
    }
  ]
}
\`\`\`

파일별 코멘트는 실제로 중요한 이슈나 의미 있는 개선사항에 대해서만 작성하세요.`;
    try {
        const response = await anthropic.messages.create({
            model: config.model || 'claude-sonnet-4-5-20250929',
            max_tokens: config.maxTokens || 8192,
            system: systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: userMessage
                }
            ]
        });
        const reviewText = response.content[0].type === 'text' ? response.content[0].text : '';
        const parsed = parseReviewResponse(reviewText);
        const fileComments = parseFileComments(reviewText, parsedDiff);
        return { review: parsed, fileComments };
    }
    catch (error) {
        console.error('Error calling Anthropic API:', error);
        throw error;
    }
}
/**
 * Parse file comments from Claude's response
 */
function parseFileComments(text, parsedDiff) {
    const comments = [];
    // JSON 형식의 파일 코멘트 파싱
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (parsed.fileComments && Array.isArray(parsed.fileComments)) {
                for (const fc of parsed.fileComments) {
                    if (fc.path && fc.body) {
                        comments.push({
                            path: fc.path,
                            line: fc.line,
                            body: fc.body
                        });
                    }
                }
            }
        }
        catch (e) {
            console.log('JSON 파싱 실패, 텍스트에서 코멘트 추출 시도');
        }
    }
    // JSON 파싱 실패 시 텍스트에서 파일별 코멘트 추출
    if (comments.length === 0) {
        const lines = text.split('\n');
        let currentPath = '';
        for (const line of lines) {
            const pathMatch = line.match(/###\s+(.+?):?\s*$/);
            if (pathMatch) {
                currentPath = pathMatch[1].trim();
            }
            // 파일별 코멘트 패턴
            const commentMatch = line.match(/\*\*(.+?):\*\*\s*(.+)/);
            if (commentMatch && currentPath) {
                comments.push({
                    path: currentPath,
                    body: commentMatch[2].trim()
                });
            }
        }
    }
    return comments;
}
/**
 * Parse Claude's response into structured format
 */
function parseReviewResponse(text) {
    const result = {
        summary: '',
        concerns: [],
        suggestions: [],
        positives: []
    };
    const sections = text.split(/^## /m);
    let currentSection = '';
    for (const section of sections) {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0)
            continue;
        const sectionName = lines[0].toLowerCase();
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
                const item = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();
                const normalizedSection = sectionName
                    .toLowerCase()
                    .replace(/[가-힣]+/g, (match) => {
                    const koreanMap = {
                        '요약': 'summary',
                        '우려사항': 'concern',
                        '제안사항': 'suggestion',
                        '긍정적': 'positive'
                    };
                    return koreanMap[match] || match;
                });
                if (sectionName.includes('요약') || sectionName.includes('Summary')) {
                    result.summary += (result.summary ? ' ' : '') + line.replace(/^[-*]\s*/, '').trim();
                }
                else if (sectionName.includes('우려') || sectionName.includes('Concern') || sectionName.includes('🔴')) {
                    result.concerns.push(item);
                }
                else if (sectionName.includes('제안') || sectionName.includes('Suggestion') || sectionName.includes('💡')) {
                    result.suggestions.push(item);
                }
                else if (sectionName.includes('긍정') || sectionName.includes('Positive') || sectionName.includes('✅')) {
                    result.positives.push(item);
                }
            }
            else if (line && !sectionName.includes('summary') && !sectionName.includes('요약')) {
                // Non-bullet points go to the last active list
                if (sectionName.includes('우려') || sectionName.includes('Concern') || sectionName.includes('🔴')) {
                    result.concerns.push(line);
                }
                else if (sectionName.includes('제안') || sectionName.includes('Suggestion') || sectionName.includes('💡')) {
                    result.suggestions.push(line);
                }
                else if (sectionName.includes('긍정') || sectionName.includes('Positive') || sectionName.includes('✅')) {
                    result.positives.push(line);
                }
            }
        }
        // Extract summary as-is if no bullets
        if (sectionName.includes('요약') || sectionName.includes('Summary')) {
            result.summary = lines.slice(1).join('\n').trim();
        }
    }
    // Fallback: if no summary was extracted, use first paragraph
    if (!result.summary) {
        const firstParagraph = text.split('\n\n')[0];
        result.summary = firstParagraph.replace(/^##.*$/m, '').trim();
    }
    return result;
}
/**
 * Format review as GitHub comment (한글)
 */
export function formatReviewAsComment(review) {
    let comment = '## 🤖 AI 코드 리뷰\n\n';
    if (review.summary) {
        comment += `### 📋 요약\n\n${review.summary}\n\n`;
    }
    if (review.concerns.length > 0) {
        comment += `### 🔴 우려사항\n\n`;
        for (const concern of review.concerns) {
            comment += `- ${concern}\n`;
        }
        comment += '\n';
    }
    if (review.suggestions.length > 0) {
        comment += `### 💡 제안사항\n\n`;
        for (const suggestion of review.suggestions) {
            comment += `- ${suggestion}\n`;
        }
        comment += '\n';
    }
    if (review.positives.length > 0) {
        comment += `### ✅ 긍정적 측면\n\n`;
        for (const positive of review.positives) {
            comment += `- ${positive}\n`;
        }
        comment += '\n';
    }
    comment += '\n---\n*이 리뷰는 Claude를 사용하여 Anthropic SDK로 생성되었습니다*';
    return comment;
}
