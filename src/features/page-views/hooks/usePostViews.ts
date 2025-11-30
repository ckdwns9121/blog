import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usePostViewsQuery } from "@/entities/page-views/model";

/**
 * 포스트 조회수 조회 및 증가를 위한 커스텀 훅
 */
export function usePostViews(slug: string) {
  const queryClient = useQueryClient();

  // 조회수 조회 (entity의 훅 사용)
  const { data: views, isLoading } = usePostViewsQuery(slug);

  // 조회수 증가 mutation
  const incrementMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${slug}/views`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to increment views");
      }
      const data = await response.json();
      return data.views as number;
    },
    onSuccess: (newViews: number) => {
      // 조회수 증가 후 쿼리 캐시 업데이트
      queryClient.setQueryData(["postViews", slug], newViews);
    },
  });

  return {
    views,
    isLoading,
    incrementViews: incrementMutation.mutate,
  };
}
