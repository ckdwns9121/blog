import { useQuery } from "@tanstack/react-query";
import { getAllPosts } from "../api";
import type { BlogPost } from "./index";

/**
 * 포스트 메타데이터 타입 (목록 조회 시 사용)
 * BlogPost의 일부 필드만 포함합니다.
 */
export type PostMetadata = Pick<
  BlogPost,
  "id" | "title" | "slug" | "publishedAt" | "updatedAt" | "excerpt" | "tags" | "coverImage" | "thumbnailImage"
>;

/**
 * 모든 포스트 목록을 조회하는 useQuery 훅
 */
export function usePostsQuery() {
  return useQuery<PostMetadata[]>({
    queryKey: ["posts"],
    queryFn: () => getAllPosts(),
    staleTime: 10 * 60 * 1000, // 10분
  });
}
