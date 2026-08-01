/**
 * 포스트 대표 이미지 결정 로직.
 *
 * 우선순위는 한 곳에서만 정의한다:
 *   1. 커버 이미지
 *   2. 본문 첫 번째 이미지
 *   3. 동적 생성 OG 이미지 (/posts/[slug]/opengraph-image)
 *
 * OG 메타데이터, JSON-LD, 목록 카드 썸네일이 모두 이 함수를 거치므로
 * 세 곳의 이미지가 항상 일치한다.
 */

export type PostImageSource = "cover" | "content" | "generated";

export interface ResolvedPostImage {
  /** 사이트 루트 기준 경로이거나 외부 절대 URL */
  src: string;
  source: PostImageSource;
}

export interface ResolvePostImageInput {
  /** 포스트 메타데이터의 커버 이미지 */
  coverImage?: string;
  /**
   * 본문 첫 번째 이미지.
   * 상세 페이지는 content에서 직접 뽑고, 목록 카드는 빌드 시 생성된 맵에서 읽는다.
   */
  contentImage?: string;
  slug: string;
}

/** 값이 있는 문자열인지 확인 (Notion에서 빈 문자열이 넘어오는 경우가 있다) */
function hasValue(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function resolvePostImage({ coverImage, contentImage, slug }: ResolvePostImageInput): ResolvedPostImage {
  if (hasValue(coverImage)) {
    return { src: coverImage, source: "cover" };
  }

  if (hasValue(contentImage)) {
    return { src: contentImage, source: "content" };
  }

  return { src: `/posts/${slug}/opengraph-image`, source: "generated" };
}

/**
 * 상대 경로를 절대 URL로 변환한다. 이미 절대 URL이면 그대로 둔다.
 * OG 메타데이터와 JSON-LD는 절대 URL을 요구한다.
 */
export function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;

  return `${normalizedBase}${normalizedPath}`;
}
