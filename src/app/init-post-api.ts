/**
 * Post API 어댑터 초기화
 * 
 * 이 파일은 app 레이어에서 Post API 어댑터를 등록합니다.
 * 서버 컴포넌트에서 한 번만 호출하면 됩니다.
 */

import { setPostApiAdapter } from "@/entities/post/api";
import { notionPostAdapter } from "@/features/notion/adapter";

/**
 * Post API 어댑터를 초기화합니다.
 * 현재는 Notion 어댑터를 사용합니다.
 * 
 * 향후 다른 CMS(GitHub, MDX 등)를 지원하려면
 * 환경 변수나 설정에 따라 다른 어댑터를 등록할 수 있습니다.
 */
export function initPostApi() {
  // 중복 등록 방지
  if (typeof window === "undefined") {
    // 서버 사이드에서만 실행
    setPostApiAdapter(notionPostAdapter);
  }
}

// 앱 시작 시 자동 초기화 (서버 사이드에서만)
if (typeof window === "undefined") {
  initPostApi();
}

