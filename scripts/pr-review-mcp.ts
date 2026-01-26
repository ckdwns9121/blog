import { GoogleGenAI, mcpToTool, FunctionCallingConfigMode, ThinkingLevel } from '@google/genai';  
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
  
  // 프로젝트 특화 시스템 명령어  
  const systemInstruction = `  
너는 Next.js 15 + Notion CMS 기반 블로그 프로젝트의 PR 리뷰 전문가다.   
다음 프로젝트 특화 규칙을 엄격히 준수하여 리뷰를 수행해라.  
  
---  
[프로젝트 리뷰 규칙]  
${reviewRules}  
---  
  
**리뷰 심각도 레벨 정의:**  
  
🔴 **CRITICAL (치명적)**  
- FSD 아키텍처 위반 (순환 의존성, 레이어 위반)  
- 보안 취약점 (XSS, 시크릿 하드코딩)  
- Notion API 잘못된 사용 (이미지 만료, 레이트 리밋)  
- TypeScript any 타입 사용  
- 프로덕션 장애 유발 코드  
  
🟡 **MEDIUM (중간)**  
- Server Component/Client Component 분리 위반  
- 성능 문제 (이미지 최적화, 병렬 요청)  
- 에러 처리 부족  
- 코드 스타일 위반  
- React Hooks 규칙 위반  
  
🟢 **LOW (낮음)**  
- 네이밍 개선 제안  
- 주석 추가 필요  
- 미미한 리팩토링 제안  
- import 최적화  
  
**PR #${PR_NUMBER} 프로젝트 특화 리뷰 워크플로우:**  
  
1. get_pull_request_files 호출하여 diff 정보 가져오기  
2. 각 파일의 patch에서 다음 정보 추출:  
   - @@ 시작,끝 라인 @@ 형식의 변경 라인 번호  
   - + (추가된 라인) 및 - (삭제된 라인) 식별  
   - 실제 코드 변경 내용 파악  
3. **프로젝트 규칙 기반 심각도별 분석:**  
   - 🔴 CRITICAL: FSD/보안/타입 안전성 위반 (즉시 수정 필요)  
   - 🟡 MEDIUM: React/성능/스타일 위반 (최소 2개 이상)  
   - 🟢 LOW: 코드 품질 개선 제안 (최소 1개 이상)  
4. create_pull_request_review 호출  
  
**핵심 검증 항목:**  
- **아키텍처**: entities/에 Notion 의존성 없는지 확인  
- **타입**: any 대신 unknown + 타입 가드 사용  
- **React**: Server Component 우선, Client Component 최소화  
- **성능**: next/image 사용, Promise.all 병렬 요청  
- **보안**: dangerouslySetInnerHTML sanitize, 환경변수만 사용  
- **Notion**: 이미지 URL 만료 처리, 페이지네이션 준수  
  
**diff 파싱 규칙:**  
- @@ -old,old +new,new @@: 변경된 라인 범위  
- +로 시작: 새로 추가된 코드  
- -로 시작: 삭제된 코드  
- 공백으로 시작: 변경 없는 컨텍스트 라인  
  
**리뷰 코멘트 형식:**  
각 라인 코멘트는 다음 형식을 따라야 함:  
\`\`\`  
[심각도] 제목  
  
설명: 구체적인 문제점 설명  
영향: 프로젝트/코드에 미치는 영향  
제안: 개선 방안 구체적 제시  
관련 규칙: 해당 TOML 규칙 섹션  
\`\`\`  
  
**중요:**   
- 반드시 실제 변경된 라인 번호를 사용해야 함  
- 프로젝트 특화 규칙을 우선적으로 적용해야 함  
- CRITICAL 이슈가 있다면 가장 먼저 언급해야 함  
  
create_pull_request_review 인자:  
- event: "COMMENT" (반드시!)  
- body: 전체 요약 (프로젝트 규칙 준수 여부 포함)  
- comments: [{path, line(실제 변경 라인 번호), body}]  
`;  
  
  // GenAI 클라이언트 초기화  
  const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });  
  
  try {  
    // PR 리뷰 요청  
    const response = await genAI.models.generateContent({  
      model: 'gemini-3-pro-preview',  
      contents: [  
        { role: 'user', parts: [{   
          text: `Review PR #${PR_NUMBER} in ${REPO_OWNER}/${REPO_NAME}.   
이 프로젝트는 Next.js 15 + Notion CMS 블로그입니다.  
MCP 도구를 정확히 2회만 사용: 1)get_pull_request_files 2)create_pull_request_review  
프로젝트 특화 규칙(FSD, TypeScript, React, 성능, 보안)을 엄격히 준수하여 리뷰해주세요.`   
        }] }  
      ],  
      config: {  
        systemInstruction: systemInstruction,  
        tools: [mcpToTool(mcp)],  
        automaticFunctionCalling: {  
          maximumRemoteCalls: 2  
        },  
        thinkingConfig: {  
          includeThoughts: true,        // 생각 과정 포함  
          thinkingLevel: ThinkingLevel.MEDIUM // 균형 잡힌 추론  
        },  
        toolConfig: {  
          functionCallingConfig: {  
            mode: FunctionCallingConfigMode.ANY  
          }  
        }  
      }  
    });  

       // Thinking 과정 확인  
    const part = response.candidates?.[0]?.content?.parts?.[0];  
    if (part?.thought) {  
      console.log('\n🧠 Thinking Process:');  
      console.log(part.text);  
    }  
  
    // 함수 호출 결과 확인  
    if (response.functionCalls && response.functionCalls.length > 0) {  
      console.log('✅ Function calls executed:', response.functionCalls.map(fc => fc.name));  
        
      // 프로젝트 특화 리뷰 통계  
      for (const fc of response.functionCalls) {  
        if (fc.name === 'create_pull_request_review') {  
          const comments = (fc.args?.comments as any[]) || [];  
          const critical = comments.filter((c: any) => c.body.includes('[CRITICAL]')).length;  
          const medium = comments.filter((c: any) => c.body.includes('[MEDIUM]')).length;  
          const low = comments.filter((c: any) => c.body.includes('[LOW]')).length;  
            
          console.log(`📊 Blog Project Review Summary:`);  
          console.log(`  🔴 CRITICAL: ${critical}개 (FSD/보안/타입)`);  
          console.log(`  🟡 MEDIUM: ${medium}개 (React/성능/스타일)`);  
          console.log(`  🟢 LOW: ${low}개 (코드 품질)`);  
          console.log(`  총계: ${comments.length}개`);  
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