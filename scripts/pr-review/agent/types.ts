import type { GitHubClient } from '../github';
export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  thought?: string;  // AI의 사고 과정
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  output: unknown;
  error?: string;
}

export interface ToolProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: ToolProperty;
}

export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolProperty>;
    required: string[];
  };
  handler: (params: Record<string, unknown>, context: AgentContext) => Promise<unknown>;
}

export interface AgentContext {
  owner: string;
  repo: string;
  prNumber: number;
  baseSha: string;
  headSha: string;
  github: GitHubClient; // GitHubClient
  maxIterations?: number;
}

export interface AgentState {
  messages: AgentMessage[];
  iteration: number;
  completed: boolean;
  finalAnswer?: string;
}

export interface ToolCallResult {
  result: unknown;
  thought?: string;
}

/**
 * Agent의 사고 과정을 추적하는 로그
 */
export interface ThoughtLog {
  timestamp: string;
  type: 'planning' | 'tool_use' | 'analysis' | 'conclusion';
  content: string;
  details?: Record<string, unknown>;
}
