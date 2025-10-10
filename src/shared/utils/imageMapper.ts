import { IMAGE_MAPPING } from "./imageMapping.generated";

/**
 * Notion 이미지 URL을 로컬 WebP 경로로 변환
 * 빌드 시점에 생성된 매핑 정보를 사용
 */
export function getOptimizedImageUrl(notionUrl: string): string {
  // 매핑에 있으면 로컬 WebP 경로 반환
  if (notionUrl in IMAGE_MAPPING) {
    return IMAGE_MAPPING[notionUrl];
  }

  // 매핑에 없으면 원본 URL 반환 (fallback)
  return notionUrl;
}

/**
 * 여러 이미지 URL을 한 번에 변환
 */
export function getOptimizedImageUrls(notionUrls: string[]): string[] {
  return notionUrls.map(getOptimizedImageUrl);
}
