/**
 * 대표 이미지 맵의 키 정규화.
 *
 * 생성 스크립트와 조회 코드가 같은 규칙을 쓰도록 한 곳에 둔다.
 * 생성된 맵 파일을 import하지 않으므로, 맵이 아직 없는 최초 빌드에서도 안전하다.
 */
export function normalizeThumbnailKey(pageId: string): string {
  return pageId.replace(/-/g, "").toLowerCase();
}
