import type { ContentBlockWithChildren } from "@/shared/types/content";

/**
 * 블로그 포스트 엔티티
 *
 * CMS에 독립적인 구조로, Notion, MDX, GitHub 등 다양한 소스에서 변환 가능
 */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: ContentBlockWithChildren[];
  excerpt: string;
  publishedAt: Date;
  updatedAt: Date;
  tags: Tag[];
  coverImage?: string;
  thumbnailImage?: string;
  toc: TableOfContentsItem[];
}

/**
 * 태그 엔티티
 */
export interface Tag {
  name: string;
  slug: string;
  postCount: number;
}

/**
 * 목차 아이템 엔티티
 */
export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

// Hooks
export { usePostQuery } from "./usePostQuery";
export { usePostsQuery, type PostMetadata } from "./usePostsQuery";
