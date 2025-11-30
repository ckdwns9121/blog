import type { BlogPost } from "../model";

/**
 * 포스트 조회 API 인터페이스
 *
 * 이 인터페이스는 CMS에 독립적인 포스트 조회 API를 정의합니다.
 * 실제 구현은 features 레이어에서 제공됩니다.
 */
export interface PostApi {
  /**
   * 모든 포스트 목록을 조회합니다.
   * @returns 포스트 목록 (메타데이터만 포함)
   */
  getAllPosts(): Promise<
    Pick<BlogPost, "id" | "title" | "slug" | "publishedAt" | "updatedAt" | "excerpt" | "tags" | "coverImage">[]
  >;

  /**
   * slug로 포스트를 조회합니다.
   * @param slug - 포스트 slug
   * @param fetchContent - 콘텐츠 블록을 포함할지 여부 (기본값: true)
   * @returns 포스트 상세 정보
   */
  getPostBySlug(slug: string, fetchContent?: boolean): Promise<BlogPost>;
}
