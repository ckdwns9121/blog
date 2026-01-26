import { Type } from '@google/genai';
import type { Tool, AgentContext, ThoughtLog } from './types';

/**
 * PR 리뷰를 위한 도구 정의
 * AI가 이 도구들을 호출하여 정보를 수집하고 리뷰를 진행합니다
 */

export const PR_REVIEW_TOOLS: Tool[] = [
  {
    name: 'get_pr_details',
    description: 'Pull Request의 기본 정보를 가져옵니다. 제목, 설명, 작성자, 상태 등을 확인할 때 사용하세요.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler: async (_params, context) => {
      const prDetails = await context.github.getPRDetails();
      return {
        title: prDetails.title,
        description: prDetails.description,
        prNumber: prDetails.prNumber,
      };
    },
  },

  {
    name: 'get_file_diff',
    description: 'PR에서 변경된 파일 목록과 각 파일의 diff를 가져옵니다. 어떤 파일이 변경되었는지 확인할 때 먼저 호출하세요.',
    parameters: {
      type: 'object',
      properties: {
        max_files: {
          type: 'number',
          description: '가져올 최대 파일 수 (기본값: 20)',
        },
      },
      required: [],
    },
    handler: async (params, context) => {
      const maxFiles = (params.max_files as number) || 20;
      const diffs = await context.github.getDiff();

      const relevantDiffs = diffs
        .filter((d) => d.status !== 'deleted')
        .slice(0, maxFiles);

      return {
        total_files: diffs.length,
        reviewed_files: relevantDiffs.length,
        files: relevantDiffs.map((d) => ({
          path: d.path,
          status: d.status,
          additions: d.additions,
          deletions: d.deletions,
          // patch가 너무 길면 자름
          patch: d.patch && d.patch.length > 5000
            ? d.patch.substring(0, 5000) + '\n... (truncated)'
            : d.patch || null,
        })),
      };
    },
  },

  {
    name: 'get_file_content',
    description: '특정 파일의 전체 내용을 가져옵니다. diff만으로는 부족하여 전체 컨텍스트가 필요할 때 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: '가져올 파일 경로 (예: src/app/page.tsx)',
        },
        ref: {
          type: 'string',
          description: '참조할 커밋 SHA (기본값: PR의 head SHA)',
        },
      },
      required: ['path'],
    },
    handler: async (params, context) => {
      const path = params.path as string;
      const ref = params.ref as string || context.headSha;
      const content = await context.github.getFileContent(path, ref);
      return {
        path,
        ref,
        content: content || '',
        size: content?.length || 0,
      };
    },
  },

  {
    name: 'analyze_security',
    description: '변경사항에서 보안 문제를 분석합니다. SQL 인젝션, XSS, 인증 문제 등을 확인할 때 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        patterns: {
          type: 'array',
          items: { type: 'string' },
          description: '검사할 보안 패턴 목록 (예: ["eval", "innerHTML", "dangerouslySetInnerHTML"])',
        },
      },
      required: [],
    },
    handler: async (_params, _context) => {
      // 이 도구는 AI가 diff를 분석한 후 호출하여 보안 검사를 수행합니다
      return {
        message: '보안 분석을 위해 diff를 검토합니다. 다음 패턴을 확인하세요:',
        check_list: [
          'SQL Injection: 사용자 입력이 그대로 쿼리에 사용되는지',
          'XSS: 사용자 입력이 DOM에 삽입되는지',
          '인증: 민감한 엔드포인트에 인증이 있는지',
          'API 키 노출: 하드코딩된 시크릿이 없는지',
          '권한 체크: 적절한 권한 확인이 있는지',
        ],
      };
    },
  },

  {
    name: 'log_thought',
    description: '리뷰 과정에서의 사고를 기록합니다. 추론 과정을 명시적으로 남길 때 사용하세요.',
    parameters: {
      type: 'object',
      properties: {
        thought: {
          type: 'string',
          description: '기록할 사고 내용',
        },
        type: {
          type: 'string',
          enum: ['planning', 'analysis', 'concern', 'conclusion'],
          description: '사고 유형',
        },
      },
      required: ['thought', 'type'],
    },
    handler: async (params, _context) => {
      const log: ThoughtLog = {
        timestamp: new Date().toISOString(),
        type: params.type as ThoughtLog['type'],
        content: params.thought as string,
      };
      console.log(`[${log.type.toUpperCase()}] ${log.content}`);
      return { logged: true, ...log };
    },
  },
];

/**
 * Google Gen AI SDK에 전달할 Function Declaration 형식으로 변환
 */
export function toFunctionDeclarations(tools: Tool[]) {
  const mapType = (type: string): Type => {
    switch (type) {
      case 'string': return Type.STRING;
      case 'number': return Type.NUMBER;
      case 'boolean': return Type.BOOLEAN;
      case 'array': return Type.ARRAY;
      case 'object': return Type.OBJECT;
      default: return Type.STRING;
    }
  };

  const mapProperty = (prop: any): any => {
    const schema: any = {
      type: mapType(prop.type),
      description: prop.description,
    };
    
    if (prop.enum) {
      schema.enum = prop.enum;
    }
    
    if (prop.items) {
      schema.items = mapProperty(prop.items);
    }
    
    return schema;
  };

  return tools.map((tool) => {
    const properties: Record<string, any> = {};
    for (const [key, prop] of Object.entries(tool.parameters.properties)) {
      properties[key] = mapProperty(prop);
    }

    return {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: Type.OBJECT,
        properties: properties,
        required: tool.parameters.required,
      },
    };
  });
}
