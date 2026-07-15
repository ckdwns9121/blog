import { IMAGE_MAPPING } from "./imageMapping.generated";

export interface OptimizedImageData {
  src: string;
  width?: number;
  height?: number;
}

type ImageMappingValue = string | OptimizedImageData;

function normalizeImageData(image: ImageMappingValue): OptimizedImageData {
  return typeof image === "string" ? { src: image } : image;
}

/**
 * Notion 이미지 URL을 로컬 WebP 경로로 변환
 * 빌드 시점에 생성된 매핑 정보를 사용
 */
export function getOptimizedImageUrl(notionUrl: string): string {
  return getOptimizedImageData(notionUrl).src;
}

/**
 * Notion 이미지 URL에 대응하는 로컬 경로와 intrinsic size를 반환한다.
 */
export function getOptimizedImageData(notionUrl: string): OptimizedImageData {
  const image = (IMAGE_MAPPING as Record<string, ImageMappingValue>)[notionUrl];
  return image ? normalizeImageData(image) : { src: notionUrl };
}

/**
 * 여러 이미지 URL을 한 번에 변환
 */
export function getOptimizedImageUrls(notionUrls: string[]): string[] {
  return notionUrls.map(getOptimizedImageUrl);
}
