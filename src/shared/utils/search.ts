import Fuse, { type FuseResultMatch, type IFuseOptions } from "fuse.js";
import type { NotionPost } from "@/features/notion/types";

export interface SearchResult {
  item: NotionPost;
  score: number;
  matches?: readonly FuseResultMatch[];
}

/**
 * Fuzzy 검색을 위한 Fuse 인스턴스 생성
 */
export function createSearchIndex(posts: NotionPost[]): Fuse<NotionPost> {
  const options: IFuseOptions<NotionPost> = {
    keys: [
      {
        name: "title",
        weight: 0.7, // 제목에 더 높은 가중치
      },
      {
        name: "excerpt",
        weight: 0.3, // 요약에 낮은 가중치
      },
      {
        name: "tags",
        weight: 0.2, // 태그에 낮은 가중치
        getFn: (post: NotionPost) => post.tags.map((tag) => tag.name).join(" "),
      },
    ],
    threshold: 0.6, // 0.0 = 완전 일치, 1.0 = 모든 결과 (0.6으로 완화하여 한국어 검색 개선)
    includeMatches: true, // 매칭된 부분 정보 포함
    minMatchCharLength: 1, // 최소 1글자 이상 검색 (한국어 단어 검색 개선)
    ignoreLocation: true, // 텍스트 위치 무시 (더 유연한 검색)
    findAllMatches: true, // 모든 매칭 결과 찾기
    shouldSort: true, // 점수 기준 정렬
  };

  return new Fuse(posts, options);
}

/**
 * 포스트 목록에서 검색 수행
 */
export function searchPosts(posts: NotionPost[], query: string): SearchResult[] {
  if (!query.trim()) {
    return [];
  }

  const fuse = createSearchIndex(posts);
  const results = fuse.search(query);

  return results.map((result) => ({
    item: result.item,
    score: result.score || 0,
    matches: result.matches,
  }));
}

