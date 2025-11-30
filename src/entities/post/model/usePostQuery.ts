import { useQuery } from "@tanstack/react-query";
import { getPostBySlug } from "../api";
import type { BlogPost } from "./index";

/**
 * 포스트를 조회하는 useQuery 훅
 */
export function usePostQuery(slug: string, options?: { enabled?: boolean; fetchContent?: boolean }) {
  return useQuery<BlogPost>({
    queryKey: ["post", slug, options?.fetchContent ?? true],
    queryFn: () => getPostBySlug(slug, options?.fetchContent ?? true),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000, // 5분
  });
}
