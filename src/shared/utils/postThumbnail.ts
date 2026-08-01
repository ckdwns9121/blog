import { POST_THUMBNAILS } from "./postThumbnails.generated";

/**
 * 포스트 본문의 첫 번째 이미지를 slug로 조회한다.
 *
 * 목록에서 쓰는 getAllPosts()는 content를 포함하지 않기 때문에, 이 값은
 * 빌드 시점(scripts/buildImages.ts)에 미리 뽑아 둔 맵에서 읽는다.
 * 아직 빌드하지 않았다면 맵이 비어 있고, 카드는 폴백 썸네일로 렌더된다.
 */
export function getPostContentThumbnail(slug: string): string | undefined {
  return POST_THUMBNAILS[slug];
}
