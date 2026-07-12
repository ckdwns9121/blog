/**
 * Post API
 *
 * 포스트 조회 API는 CMS에 독립적인 인터페이스를 제공합니다.
 * 실제 구현은 features 레이어에서 어댑터 패턴으로 제공됩니다.
 *
 * 사용 예시:
 * ```ts
 * import { getAllPosts, getPostBySlug } from "@/entities/post/api";
 * const posts = await getAllPosts();
 * const post = await getPostBySlug("my-post");
 * ```
 */

// 타입 및 어댑터 관리 함수 export
export type { PostApi } from "./types";
export { setPostApiAdapter, getPostApiAdapter, isPostApiAdapterRegistered } from "./adapter";

// API 함수들 (어댑터를 통해 실제 구현 호출)
import { getPostApiAdapter } from "./adapter";
import type { BlogPost } from "../model";

/**
 * 모든 포스트 목록을 조회합니다.
 */
export async function getAllPosts(): Promise<
  Pick<BlogPost, "id" | "title" | "slug" | "publishedAt" | "updatedAt" | "excerpt" | "tags" | "coverImage">[]
> {
  const adapter = getPostApiAdapter();
  return adapter.getAllPosts();
}

/**
 * slug로 포스트를 조회합니다.
 */
export async function getPostBySlug(slug: string, fetchContent = true): Promise<BlogPost> {
  const adapter = getPostApiAdapter();
  return adapter.getPostBySlug(slug, fetchContent);
}
