import Anthropic from '@anthropic-ai/sdk';
import { ReviewConfig } from './config.js';
import { parseDiff, formatDiffForReview } from './diff-parser.js';

export interface ReviewResult {
  summary: string;
  concerns: string[];
  suggestions: string[];
  positives: string[];
}

/**
 * Generate PR review using Claude
 */
export async function generateReview(
  diffText: string,
  prTitle: string,
  prDescription: string,
  config: ReviewConfig
): Promise<ReviewResult> {
  const anthropic = new Anthropic({
    apiKey: config.anthropicApiKey,
  });

  const parsedDiff = parseDiff(diffText);
  const formattedDiff = formatDiffForReview(parsedDiff);

  const systemPrompt = `You are an expert code reviewer. Your role is to:
1. Analyze the pull request changes thoroughly
2. Identify potential bugs, security issues, or problems
3. Suggest improvements for code quality, readability, and maintainability
4. Highlight positive aspects of the changes
5. Be constructive and specific in your feedback

Focus on:
- Code correctness and potential bugs
- Security vulnerabilities
- Performance considerations
- Code style and readability
- Best practices adherence
- Edge cases that might not be handled`;

  const userMessage = `# Pull Request to Review

**Title:** ${prTitle}

**Description:**
${prDescription || 'No description provided.'}

## Changes to Review

${formattedDiff}

---

Please provide a comprehensive review in the following format:

## Summary
[Brief 2-3 sentence summary of what this PR does]

## 🔴 Concerns
[Critical issues, bugs, or security concerns - be specific about file and line]

## 💡 Suggestions
[Improvements for code quality, readability, or best practices]

## ✅ Positives
[What was done well in this PR]`;

  try {
    const response = await anthropic.messages.create({
      model: config.model || 'claude-3-5-sonnet-20241022',
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
    return parseReviewResponse(reviewText);
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
}

/**
 * Parse Claude's response into structured format
 */
function parseReviewResponse(text: string): ReviewResult {
  const result: ReviewResult = {
    summary: '',
    concerns: [],
    suggestions: [],
    positives: []
  };

  const sections = text.split(/^## /m);
  let currentSection = '';

  for (const section of sections) {
    const lines = section.split('\n').filter(line => line.trim());
    if (lines.length === 0) continue;

    const sectionName = lines[0].toLowerCase();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
        const item = line.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '').trim();

        if (sectionName.includes('summary')) {
          result.summary += (result.summary ? ' ' : '') + line.replace(/^[-*]\s*/, '').trim();
        } else if (sectionName.includes('concern') || sectionName.includes('🔴')) {
          result.concerns.push(item);
        } else if (sectionName.includes('suggestion') || sectionName.includes('💡')) {
          result.suggestions.push(item);
        } else if (sectionName.includes('positive') || sectionName.includes('✅')) {
          result.positives.push(item);
        }
      } else if (line && !sectionName.includes('summary')) {
        // Non-bullet points go to the last active list
        if (sectionName.includes('concern') || sectionName.includes('🔴')) {
          result.concerns.push(line);
        } else if (sectionName.includes('suggestion') || sectionName.includes('💡')) {
          result.suggestions.push(line);
        } else if (sectionName.includes('positive') || sectionName.includes('✅')) {
          result.positives.push(line);
        }
      }
    }

    // Extract summary as-is if no bullets
    if (sectionName.includes('summary')) {
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
 * Format review as GitHub comment
 */
export function formatReviewAsComment(review: ReviewResult): string {
  let comment = '## 🤖 AI Code Review\n\n';

  if (review.summary) {
    comment += `### Summary\n\n${review.summary}\n\n`;
  }

  if (review.concerns.length > 0) {
    comment += `### 🔴 Concerns\n\n`;
    for (const concern of review.concerns) {
      comment += `- ${concern}\n`;
    }
    comment += '\n';
  }

  if (review.suggestions.length > 0) {
    comment += `### 💡 Suggestions\n\n`;
    for (const suggestion of review.suggestions) {
      comment += `- ${suggestion}\n`;
    }
    comment += '\n';
  }

  if (review.positives.length > 0) {
    comment += `### ✅ Positives\n\n`;
    for (const positive of review.positives) {
      comment += `- ${positive}\n`;
    }
    comment += '\n';
  }

  comment += '\n---\n*This review was generated by Claude using the Anthropic SDK*';

  return comment;
}
