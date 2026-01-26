/**
 * Agent의 사고 과정을 추적하는 로그
 */
export interface ThoughtLog {
  timestamp: string;
  type: 'planning' | 'tool_use' | 'analysis' | 'conclusion';
  content: string;
  details?: Record<string, unknown>;
}
