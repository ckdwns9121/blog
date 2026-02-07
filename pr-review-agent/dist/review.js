import Anthropic from '@anthropic-ai/sdk';
import { parseDiff, formatDiffForReview } from './diff-parser.js';
/**
 * Generate PR review using Claude (한글, 심측 리뷰)
 */
export async function generateReview(diffText, prTitle, prDescription, config) {
    const anthropic = new Anthropic({
        apiKey: config.anthropicApiKey,
    });
    const parsedDiff = parseDiff(diffText);
    const formattedDiff = formatDiffForReview(parsedDiff);
    // 파일 목록 추출
    const filePaths = parsedDiff.files.map(f => f.path);
    const fileExtensions = filePaths.map(p => {
        const ext = p.split('.').pop();
        return ext ? ext.toLowerCase() : p;
    });
    // 기술 스택 추정
    const techStack = detectTechStack(fileExtensions, filePaths);
    const systemPrompt = `당신은 15년 경력의 시니어 코드 리뷰어이자 소프트웨어 아키텍트입니다. 다음 원칙을 따르세요:

# 리뷰 철학
1. **구체적이고 실질적인 피드백**: "좋습니다" 같은 일반적인 말 대신, 구체적인 행동을 제안
2. **코드 문맥 이해**: 단순한 코드 스타일이 아니라, 비즈니스 로직과 사용자 경험 고려
3. **실제 임팩도 고려**: 이론적인 완벽성보다 실제 프로덕션 환경에서의 유용성

# 분석 프레임워크
## 🔴 보안 (Security)
- 인증/인가 결함
- SQL 인젝션, XSS, CSRF 등 OWASP Top 10
- 민감 정보 처리
- API 키/시크릿 노출

## 🐛 버그 (Bugs)
- null/undefined 처리
- 에러 핸들링 누락
- 경계 케이스 (빈 문자열, 0, null, 대용량 데이터)
- 비동기 처리 레이스 컨디션
- 타입 안전성

## ⚡ 성능 (Performance)
- 불필요한 리렌더링/재계산
- 메모리 누수
- N+1 쿼리
- 인덱싱 누락
- 대용량 처리

## 📐 아키텍처 (Architecture)
- 관심사 분리 (Separation of Concerns)
- 의존성 방향
- 확장성
- 테스트 가능성

## 🎨 코드 품질 (Code Quality)
- 함수 복잡도
- 중복 코드 (DRY)
- 명명 규칙
- 주석의 필요성
- TypeScript 활용

# 출력 형식
- 모든 리뷰는 **한국어**로 작성
- 마크다운 형식 사용
- 파일:라인 형식으로 문제 위치 명시
- 중요도에 따라 이슈 분류 (치명적 / 중요 / 사소)

# Mermaid 다이어그램
변경된 파일들의 구조를 분석하여 Mermaid 다이어그램으로 시각화하세요:
- 컴포넌트/모듈 관계도
- 데이터 흐름
- 계층 구조`;
    const userMessage = `# 📋 코드 리뷰 요청

**PR 제목:** ${prTitle}

**설명:**
${prDescription || '설명 없음.'}

**감지된 기술 스택:** ${techStack.join(', ')}

**변경된 파일 (${parsedDiff.files.length}개):**
${parsedDiff.files.map(f => `- \`${f.path}\` (${f.status}: +${f.additions} -${f.deletions})`).join('\n')}

---

## 변경 사항

${formattedDiff}

---

# 리뷰 요청사항

다음 섹션으로 나누어 상세한 리뷰를 제공하세요. 각 섹션은 최소 2-3개 이상의 구체적 항목을 포함하세요:

## 1️⃣ 📋 요약 (Summary)
이 PR의 핵심 목적과 주요 변경사항을 2-3문장으로 설명하세요. 단순히 "파일을 추가했습니다"가 아니라, **왜** 이 변경이 필요한지, **어떤 문제**를 해결하는지 설명하세요.

## 2️⃣ 🔴 치명적 문제 (Critical Issues)
즉시 수정이 필요한 치명적인 버그, 보안 취약점, 또는 아키텍처적 문제를 나열하세요.
형식: \`파일경로:라인번호\` - 문제 설명 + [수정 제안]

## 3️⃣ ⚠️  우려사항 (Concerns)
향후 문제가 될 수 있는 부분이나 개선이 필요한 사항을 나열하세요.
형식: \`파일경로:라인번호\` - 우려사항 + [개선 방향]

## 4️⃣ 💡 제안사항 (Suggestions)
코드 품질, 가독성, 성능을 위한 제안을 하세요.
형식: \`파일경로:라인번호\` - 현재 상황 + [개선 제안]

## 5️⃣ ✅ 잘한 점 (Positives)
잘 구현된 부분을 칭찬하세요. 구체적으로 무엇이 좋은지 설명하세요.

## 6️⃣ 🏗️ 아키텍처 다이어그램

변경된 파일들의 구조를 Mermaid 다이어그램으로 시각화하세요. 다음 중 적절한 형식을 선택하세요:

\`\`\`mermaid
graph TD 또는 flowchart TD 또는 classDiagram
[여기에 다이어그램 코드 작성]
\`\`\`

다음 요소를 포함하세요:
- 주요 컴포넌트/모듈 (노드)
- 그들 간의 관계 (에지)
- 데이터/제어 흐름
- 외부 의존성이 있다면 표시

## 7️⃣ 📝 파일별 구체 코멘트

각 파일에서 발견된 주요 이슈에 대해 다음 JSON 형식으로 작성하세요:

\`\`\`json
{
  "fileComments": [
    {
      "path": "파일경로",
      "line": 라인번호,
      "body": "구체적인 코멘트 내용 (한국어)"
    }
  ]
}
\`\`\`

---
**중요:**
- 모든 내용은 **한국어**로 작성하세요.
- 파일별 코멘트는 실제로 의미 있는 이슈에 대해서만 작성하세요 (사소한 스타일 문제는 제외).
- 다이어그램은 실제 코드 구조를 반영해야 합니다.`;
    try {
        const response = await anthropic.messages.create({
            model: config.model || 'claude-opus-4-6',
            max_tokens: config.maxTokens || 16000,
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
        const fileComments = parseFileComments(reviewText);
        const architectureDiagram = extractMermaidDiagram(reviewText);
        return { review: parsed, fileComments, architectureDiagram };
    }
    catch (error) {
        console.error('Error calling Anthropic API:', error);
        throw error;
    }
}
/**
 * Detect tech stack from files
 */
function detectTechStack(extensions, paths) {
    const stack = new Set();
    // Language detection
    const langMap = {
        'ts': 'TypeScript',
        'tsx': 'TypeScript',
        'js': 'JavaScript',
        'jsx': 'JavaScript',
        'py': 'Python',
        'rs': 'Rust',
        'go': 'Go',
        'java': 'Java',
        'kt': 'Kotlin',
        'rb': 'Ruby',
        'php': 'PHP',
        'cs': 'C#',
        'cpp': 'C++',
        'c': 'C',
        'swift': 'Swift',
        'dart': 'Dart'
    };
    for (const ext of extensions) {
        if (langMap[ext])
            stack.add(langMap[ext]);
    }
    // Framework detection
    const pathStr = paths.join(' ');
    if (pathStr.includes('next')) {
        stack.add('Next.js');
        if (pathStr.includes('app/'))
            stack.add('App Router');
        if (pathStr.includes('pages/'))
            stack.add('Pages Router');
    }
    if (pathStr.includes('react'))
        stack.add('React');
    if (pathStr.includes('vue'))
        stack.add('Vue');
    if (pathStr.includes('src/components'))
        stack.add('Component-based');
    if (pathStr.includes('prisma'))
        stack.add('Prisma ORM');
    if (pathStr.includes('drizzle'))
        stack.add('Drizzle ORM');
    if (pathStr.includes('supabase'))
        stack.add('Supabase');
    if (pathStr.includes('tailwind'))
        stack.add('Tailwind CSS');
    if (pathStr.includes('shadcn'))
        stack.add('shadcn/ui');
    if (pathStr.includes('api/'))
        stack.add('API Routes');
    if (pathStr.includes('server/'))
        stack.add('Server-side');
    if (pathStr.includes('lib/'))
        stack.add('Library code');
    return Array.from(stack);
}
/**
 * Parse file comments from Claude's response
 */
function parseFileComments(text) {
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
    return comments;
}
/**
 * Extract Mermaid diagram from response
 */
function extractMermaidDiagram(text) {
    const mermaidMatch = text.match(/```mermaid\s*([\s\S]*?)\s*```/);
    if (mermaidMatch) {
        return mermaidMatch[1].trim();
    }
    return '';
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
    // 섹션 분리
    const sections = text.split(/^#{1,3}\s+/m);
    for (const section of sections) {
        const lines = section.split('\n');
        if (lines.length === 0)
            continue;
        const firstLine = lines[0].trim().toLowerCase();
        const content = lines.slice(1).join('\n');
        // 섹션별 파싱
        if (firstLine.includes('요약') || firstLine.includes('summary') || firstLine.includes('1️⃣')) {
            result.summary = extractBulletPoints(content).join('\n');
        }
        else if (firstLine.includes('치명적') || firstLine.includes('critical') || firstLine.includes('2️⃣')) {
            result.concerns = extractBulletPoints(content);
        }
        else if (firstLine.includes('우려') || firstLine.includes('concern') || firstLine.includes('3️⃣')) {
            const suggestions = extractBulletPoints(content);
            result.concerns.push(...suggestions);
        }
        else if (firstLine.includes('제안') || firstLine.includes('suggestion') || firstLine.includes('4️⃣')) {
            result.suggestions = extractBulletPoints(content);
        }
        else if (firstLine.includes('잘한') || firstLine.includes('positive') || firstLine.includes('5️⃣')) {
            result.positives = extractBulletPoints(content);
        }
    }
    // Fallback: 요약이 없으면 첫 번째 문단 사용
    if (!result.summary) {
        const firstParagraph = text.split('\n\n')[0];
        result.summary = firstParagraph.replace(/^#{1,3}\s+.*$/m, '').replace(/[*-]\s*/g, '').trim();
    }
    return result;
}
/**
 * Extract bullet points from text
 */
function extractBulletPoints(text) {
    const items = [];
    const lines = text.split('\n');
    let currentItem = '';
    for (const line of lines) {
        const trimmed = line.trim();
        // 불렛/별표/숫자 목록
        if (/^[-*•]\s/.test(trim) || /^\d+\.\s/.test(trim)) {
            if (currentItem) {
                items.push(currentItem.trim());
                currentItem = '';
            }
            currentItem = trimmed.replace(/^[-*•]\s*|\d+\.\s*/, '');
        }
        // 코드 블록 시작
        else if (trimmed.startsWith('```')) {
            // 코드 블록은 그대로 유지
            continue;
        }
        // 인용 블록
        else if (trimmed.startsWith('>')) {
            if (currentItem)
                items.push(currentItem.trim());
            currentItem = '';
        }
        // 빈 줄
        else if (trimmed === '') {
            if (currentItem) {
                items.push(currentItem.trim());
                currentItem = '';
            }
        }
        // 연속된 줄
        else if (trimmed) {
            currentItem += (currentItem ? ' ' : '') + trimmed;
        }
    }
    if (currentItem) {
        items.push(currentItem.trim());
    }
    return items.filter(item => item.length > 0);
}
/**
 * Format review as GitHub comment (마크다운, 한글)
 */
export function formatReviewAsComment(review, architectureDiagram) {
    let output = '';
    // 헤더
    output += '# 🤖 AI 코드 리뷰\n\n';
    output += '---\n\n';
    // 요약
    if (review.summary) {
        output += '## 📋 요약\n\n';
        output += review.summary;
        output += '\n\n---\n\n';
    }
    // 치명적 문제
    if (review.concerns && review.concerns.length > 0) {
        output += '## 🔴 치명적 문제\n\n';
        output += '> ⚠️ 즉시 수정이 필요합니다.\n\n';
        for (const concern of review.concerns) {
            output += `- ${concern}\n`;
        }
        output += '\n---\n\n';
    }
    // 우려사항
    if (review.suggestions && review.suggestions.length > 0) {
        output += '## ⚠️ 우려사항 & 제안사항\n\n';
        for (const suggestion of review.suggestions) {
            output += `- ${suggestion}\n`;
        }
        output += '\n---\n\n';
    }
    // 긍정적 측면
    if (review.positives && review.positives.length > 0) {
        output += '## ✅ 잘한 점\n\n';
        for (const positive of review.positives) {
            output += `- ${positive}\n`;
        }
        output += '\n---\n\n';
    }
    // 아키텍처 다이어그램
    if (architectureDiagram) {
        output += '## 🏗️ 아키텍처 다이어그램\n\n';
        output += '```mermaid\n';
        output += architectureDiagram;
        output += '\n```\n\n';
        output += '---\n\n';
    }
    // 푸터
    output += '\n*이 리뷰는 Claude(Opus 4.6)를 사용하여 생성되었습니다*';
    return output;
}
