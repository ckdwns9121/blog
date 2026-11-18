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
 *
 * Notion이 주는 커버 이미지 주소는 `https://www.notion.so/image/...` 프록시이고,
 * 그 주소는 만료되거나 느려질 수 있다. 빌드 때 `build:images`가 내려받아 만든
 * 로컬 WebP가 매핑에 있으면 그 경로로 바꿔 내보낸다.
 */

import { getOptimizedImageData } from "@/shared/utils/imageMapper";

export type PostImageSource = "cover" | "content" | "generated";

/**
 * 동적 생성 OG 이미지의 크기. 라우트(`opengraph-image.tsx`)와 메타데이터가 같은 값을 봐야
 * `og:image:width/height`가 실제 이미지와 어긋나지 않는다.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

export interface ResolvedPostImage {
  /** 사이트 루트 기준 경로이거나 외부 절대 URL */
  src: string;
  source: PostImageSource;
  /** 빌드 매핑에 크기가 남아 있을 때만 채워진다 */
  width?: number;
  height?: number;
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

/** 동적 생성 OG 이미지의 사이트 내 경로 */
export function generatedOgImagePath(slug: string): string {
  return `/posts/${slug}/opengraph-image`;
}

/** 빌드 매핑을 거쳐 사이트가 직접 서빙할 수 있는 주소인지 */
function isSelfHosted(src: string): boolean {
  return !/^https?:\/\//i.test(src);
}

function toResolved(source: "cover" | "content", url: string): ResolvedPostImage {
  const { src, width, height } = getOptimizedImageData(url);

  return {
    src,
    source,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  };
}

export function resolvePostImage({ coverImage, contentImage, slug }: ResolvePostImageInput): ResolvedPostImage {
  if (hasValue(coverImage)) {
    return toResolved("cover", coverImage.trim());
  }

  if (hasValue(contentImage)) {
    return toResolved("content", contentImage.trim());
  }

  return { src: generatedOgImagePath(slug), source: "generated" };
}

/**
 * OG 메타데이터·JSON-LD에 넣을 이미지.
 *
 * 빌드 매핑에 없는(그래서 아직 우리 사이트에 없는) 외부 이미지는 쓰지 않는다.
 * 크롤러가 Notion 프록시를 직접 때리면 응답이 느리거나 만료된 URL을 받을 수 있고,
 * 그 실패가 곧 공유 카드의 빈 이미지이기 때문이다. 대신 같은 제목으로 우리가
 * 생성하는 OG 이미지로 떨어진다.
 */
export function resolveOgImage({ coverImage, contentImage, slug }: ResolvePostImageInput): ResolvedPostImage {
  const image = resolvePostImage({ coverImage, contentImage, slug });

  if (image.source === "generated" || isSelfHosted(image.src)) {
    return image;
  }

  return { src: generatedOgImagePath(slug), source: "generated" };
}

/**
 * 상대 경로를 절대 URL로 변환한다. 이미 절대 URL이면 그대로 둔다.
 * OG 메타데이터와 JSON-LD는 절대 URL을 요구한다.
 *
 * BASE_URL이 하위 경로를 포함하는 경우(예: `https://example.com/blog`)를 위해,
 * 이미 그 경로로 시작하는 상대 경로에는 접두사를 다시 붙이지 않는다.
 */
export function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const normalizedPath = url.startsWith("/") ? url : `/${url}`;
  const basePath = getPathname(normalizedBase);

  if (basePath && (normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`))) {
    return `${normalizedBase}${normalizedPath.slice(basePath.length)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

/** 절대 URL의 경로 부분. 해석할 수 없으면 빈 문자열. */
function getPathname(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/+$/, "");
  } catch {
    return "";
  }
}
