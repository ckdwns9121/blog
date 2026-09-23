import type { ContentBlockWithChildren } from "@/shared/types/content";

/**
 * 노트 엔티티.
 *
 * 저장소는 글과 같은 Notion 데이터베이스이고 `type` 속성으로만 갈린다.
 * 본문은 글과 똑같은 공통 블록 배열이라 코드 블록이나 이미지도 그대로 렌더링된다.
 * 다른 건 화면뿐이다. 태그와 썸네일을 보여주지 않아 기술 글 목록과 분위기를 구분한다.
 */
export interface NoteSummary {
  /** Notion 페이지 ID */
  id: string;
  title: string;
  /** 제목에서 파생한 주소. 글과 달리 페이지 ID를 붙이지 않아 짧다. */
  slug: string;
  excerpt: string;
  writtenAt: Date;
}

export interface Note extends NoteSummary {
  content: ContentBlockWithChildren[];
}
