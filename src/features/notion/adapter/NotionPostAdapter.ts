import type { PostApi } from "@/entities/post/api";
import type { BlogPost } from "@/entities/post/model";
import { getAllPosts as notionGetAllPosts, getPostBySlug as notionGetPostBySlug } from "../service/notion-client";
import type { NotionPost } from "../types";

/**
 * Notion CMS를 위한 PostApi 어댑터 구현
 *
 * Notion API를 BlogPost 엔티티로 변환합니다.
 */
export class NotionPostAdapter implements PostApi {
  /**
   * 모든 포스트 목록을 조회합니다.
   * NotionPost를 BlogPost 메타데이터로 변환합니다.
   */
  async getAllPosts(): Promise<
    Pick<BlogPost, "id" | "title" | "slug" | "publishedAt" | "updatedAt" | "excerpt" | "tags" | "coverImage" | "thumbnailImage">[]
  > {
    const notionPosts = await notionGetAllPosts();

    return notionPosts.map((post: NotionPost) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      publishedAt: new Date(post.publishedAt),
      updatedAt: new Date(post.updatedAt),
      excerpt: post.excerpt || "",
      tags: post.tags.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
        postCount: 0, // NotionPost에는 postCount가 없으므로 0으로 설정
      })),
      coverImage: post.coverImage,
      thumbnailImage: post.thumbnailImage,
    }));
  }

  /**
   * slug로 포스트를 조회합니다.
   * Notion의 getPostBySlug는 이미 BlogPost를 반환하므로 그대로 사용합니다.
   */
  async getPostBySlug(slug: string, fetchContent = true): Promise<BlogPost> {
    return notionGetPostBySlug(slug, fetchContent);
  }
}

/**
 * NotionPostAdapter의 싱글톤 인스턴스
 */
export const notionPostAdapter = new NotionPostAdapter();
