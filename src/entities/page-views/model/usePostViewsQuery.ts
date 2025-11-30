import { useQuery } from "@tanstack/react-query";
import { getPostViews } from "../api";

/**
 * 포스트 조회수를 조회하는 useQuery 훅
 */
export function usePostViewsQuery(slug: string) {
  return useQuery({
    queryKey: ["postViews", slug],
    queryFn: () => getPostViews(slug),
    staleTime: 60 * 1000, // 1분
    refetchOnWindowFocus: false,
  });
}
