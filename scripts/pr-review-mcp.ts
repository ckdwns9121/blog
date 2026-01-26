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
  
  // 개선된 시스템 명령어 (diff 파싱 포함)  
  const systemInstruction = `  
너는 PR 리뷰 전문가다. 다음 리뷰 규칙을 엄격히 준수해라.  
  
---  
[리뷰 규칙 및 프로젝트 설정]  
${reviewRules}  
---  
  
**PR #${PR_NUMBER} diff 분석 및 리뷰 워크플로우:**  
  
1. get_pull_request_files 호출하여 diff 정보 가져오기  
2. 각 파일의 patch에서 다음 정보 추출:  
   - @@ 시작,끝 라인 @@ 형식의 변경 라인 번호  
   - + (추가된 라인) 및 - (삭제된 라인) 식별  
   - 실제 코드 변경 내용 파악  
3. diff 기반으로 최소 3개 구체적인 라인 코멘트 작성:  
   - 반드시 patch의 라인 번호 사용 (예: @@ -45,7 +45,8 @@에서 45번 라인)  
   - 추가된 코드(+)에 대한 개선 제안  
   - 삭제된 코드(-)에 대한 대안 제시  
4. create_pull_request_review 호출  
  
**diff 파싱 규칙:**  
- @@ -old,old +new,new @@: 변경된 라인 범위  
- +로 시작: 새로 추가된 코드  
- -로 시작: 삭제된 코드  
- 공백으로 시작: 변경 없는 컨텍스트 라인  
  
**중요:** 라인 코멘트 시 반드시 실제 변경된 라인 번호를 사용해야 함  
  
create_pull_request_review 인자:  
- event: "COMMENT" (반드시!)  
- body: 전체 diff 요약 및 주요 개선점  
- comments: [{path, line(실제 변경 라인 번호), body}]  
`;  
  
  // GenAI 클라이언트 초기화  
  const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });  
  
  try {  
    // PR 리뷰 요청  
    const response = await genAI.models.generateContent({  
      model: 'gemini-2.5-flash',  // 안정적인 모델  
      contents: [  
        { role: 'user', parts: [{   
          text: `Review PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME}.   
MCP 도구를 정확히 2회만 사용: 1)get_pull_request_files 2)create_pull_request_review  
diff 정보를 정확히 파싱하여 라인 단위 리뷰를 작성해주세요.`   
        }] }  
      ],  
      config: {  
        systemInstruction: systemInstruction,  
        tools: [mcpToTool(mcp)],  
        automaticFunctionCalling: {  
          maximumRemoteCalls: 2  // get_pull_request_files + create_pull_request_review  
        },  
        toolConfig: {  
          functionCallingConfig: {  
            mode: FunctionCallingConfigMode.ANY  // 함수 호출 강제  
          }  
        }  
      }  
    });  
  
    // 함수 호출 결과 확인  
    if (response.functionCalls && response.functionCalls.length > 0) {  
      console.log('✅ Function calls executed:', response.functionCalls.map(fc => fc.name));  
        
      // 디버깅을 위한 상세 로그  
      for (const fc of response.functionCalls) {  
        if (fc.name === 'get_pull_request_files') {  
          console.log('[Debug] Files retrieved:', fc.args);  
        } else if (fc.name === 'create_pull_request_review') {  
          console.log('[Debug] Review created:', fc.args);  
        }  
      }  
        
      console.log('📝 Review completed successfully');  
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