import { IMAGE_MAPPING } from "./imageMapping.generated";
import { BASE_URL } from "@/shared/constants";

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
  if (image) return normalizeImageData(image);
  return { src: toLocalPathIfSameOrigin(notionUrl) };
}

/**
 * 우리 도메인을 가리키는 절대 URL은 경로만 남긴다.
 *
 * Notion은 외부 이미지 주소를 절대 URL로만 저장한다. 그런데 그 주소가 이 사이트를
 * 가리키면 next/image가 원격 이미지로 보고 remotePatterns를 검사해 막아버린다.
 * 같은 출처면 로컬 파일이므로 경로로 바꿔 최적화를 그대로 받게 한다.
 */
function toLocalPathIfSameOrigin(url: string): string {
  if (!url.startsWith("http")) return url;

  try {
    const parsed = new URL(url);
    const base = new URL(BASE_URL);
    // www 유무만 다른 경우도 같은 사이트로 본다
    const strip = (host: string) => host.replace(/^www\./, "");
    if (strip(parsed.hostname) !== strip(base.hostname)) return url;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

/**
 * 여러 이미지 URL을 한 번에 변환
 */
export function getOptimizedImageUrls(notionUrls: string[]): string[] {
  return notionUrls.map(getOptimizedImageUrl);
}
