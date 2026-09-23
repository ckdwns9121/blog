import { THUMBNAIL_MAP } from "./thumbnailMap.generated";
import { normalizeThumbnailKey } from "./thumbnailKey";

/**
 * 빌드 시점에 확정된 글별 대표 이미지를 읽는다.
 * 맵 생성은 scripts/thumbnailMap.ts가 담당한다.
 */

/**
 * 반환값의 의미가 셋으로 구분된다.
 * - URL 문자열: 대표 이미지
 * - 빈 문자열: 이미지가 없다고 빌드 때 확인된 글
 * - undefined: 맵에 없는 글(빌드 이후 발행). 호출부가 직접 조회해야 한다.
 */
export function lookupPrecomputedThumbnail(pageId: string): string | undefined {
  return THUMBNAIL_MAP[normalizeThumbnailKey(pageId)];
}
