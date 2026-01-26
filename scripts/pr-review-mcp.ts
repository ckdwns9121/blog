import { GoogleGenAI, mcpToTool, FunctionCallingConfigMode } from '@google/genai';  
import { Client } from '@modelcontextprotocol/sdk/client';  
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';  
import { readFile } from 'fs/promises';  
import { join } from 'path';  
  
const PR_NUMBER = Number(process.env.PR_NUMBER!);  
const REPO_OWNER = process.env.REPO_OWNER!;  
const REPO_NAME = process.env.REPO_NAME!;  
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;  
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;  
  
async function main() {  
  console.log('[Bot] Starting PR review...');  
  
  // 환경 변수 확인  
  if (!GEMINI_API_KEY) {  
    console.error('[Error] GEMINI_API_KEY is missing. Please check your .env file or GitHub Secrets.');  
    process.exit(1);  
  }  
  
  if (!GITHUB_TOKEN) {  
    console.error('[Error] GITHUB_TOKEN is missing.');  
    process.exit(1);  
  }  
  
  // MCP 서버 설정  
  const serverParams = new StdioClientTransport({  
    command: 'npx',  
    args: ['-y', '@modelcontextprotocol/server-github'],  
    env: { ...process.env, GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_TOKEN },  
  });  
  
  // MCP 클라이언트 연결  
  const mcp = new Client({ name: 'pr-review-bot', version: '1.0.0' });  
  try {  
    await mcp.connect(serverParams);  
    console.log('[MCP] ✅ Connected');  
    const tools = await mcp.listTools();  
    console.log('----tools---')
    console.log(tools);
  } catch(e) {  
    console.error('[MCP] ❌ Connection failed:', e);  
    process.exit(1);  
  }  
  
  // 리뷰 규칙 로드  
  let reviewRules = '';  
  try {  
    reviewRules = await readFile(join(process.cwd(), 'scripts/pr-review/review-rules.toml'), 'utf-8');  
  } catch(e) {  
    console.warn('[Warning] Could not load review rules:', e);  
    reviewRules = '기본적인 코드 품질 검사를 수행하세요.';  
  }  
  
  // 시스템 명령어  
  const systemInstruction = `  
너는 PR 리뷰 전문가다. 다음 리뷰 규칙을 엄격히 준수해라.  
  
---  
[리뷰 규칙 및 프로젝트 설정]  
${reviewRules}  
---  
  
**PR #${PR_NUMBER} 단일 리뷰 워크플로우:**  
  
1. get_pull_request_files 호출 (1회만)  
2. patch 분석 → 최소 3개 라인 코멘트 작성  
3. create_pull_request_review 호출 (1회만!)  
  
**중복 호출 금지!**  
  
create_pull_request_review 인자:  
- event: "COMMENT" (반드시!)  
- body: 전체 요약  
- comments: [{path, line(숫자), body}]  
`;  
  
  // GenAI 클라이언트 초기화  
  const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });  
  
  try {  
    // PR 리뷰 요청  
    const response = await genAI.models.generateContent({  
      model: 'gemini-2.5-flash',  // 안정적인 모델로 변경  
      contents: [  
        { role: 'user', parts: [{   
          text: `Review PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME}.   
MCP 도구를 정확히 2회만 사용: 1)get_pull_request_files 2)create_pull_request_review`   
        }] }  
      ],  
      config: {  
        systemInstruction: systemInstruction,  
        tools: [mcpToTool(mcp)],  
        automaticFunctionCalling: {  
          maximumRemoteCalls: 2,  // get_pull_request_files + create_pull_request_review  
        },  
        toolConfig: {  
          functionCallingConfig: {  
            mode: FunctionCallingConfigMode.AUTO  // 자동 함수 호출  
          }  
        }  
      }  
    });  
  
    // 결과 처리  
    if (response.functionCalls && response.functionCalls.length > 0) {  
      console.log('✅ Function calls executed:', response.functionCalls.map(fc => fc.name));  
      console.log('📝 Review completed successfully');  
        
      // AFC 히스토리 출력 (디버깅용)  
      if (response.automaticFunctionCallingHistory) {  
        console.log('\n--- Function Call History ---');  
        for (const [index, content] of response.automaticFunctionCallingHistory.entries()) {  
          console.log(`[${index}] Role: ${content.role}`);  
          for (const part of (content.parts || [])) {  
            if (part.functionCall) {  
              console.log(`  Function Call: ${part.functionCall.name}`);  
            } else if (part.functionResponse) {  
              console.log(`  Function Response: ${part.functionResponse.name}`);  
            } else if (part.text) {  
              console.log(`  Text: ${part.text.substring(0, 100)}...`);  
            }  
          }  
        }  
      }  
    } else {  
      console.log('⚠️ No function calls made');  
      console.log('Response:', response.text?.substring(0, 200));  
    }  
  
    console.log(response.text);  
      
  } catch (error) {  
    console.error('[Error] Failed to generate review:', error);  
    process.exit(1);  
  } finally {  
    // MCP 연결 종료  
    await mcp.close();  
    console.log('[Bot] ✅ Review completed');  
  }  
}  
  
main().catch(console.error);