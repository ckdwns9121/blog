import Fuse, { type FuseOptionKey, type FuseResult } from "fuse.js";
import type { SearchablePost } from "@/features/search/model/searchDocument";

export type { FuseOptionKey, FuseResult };

export interface SearchOptions {
  includeContent?: boolean;
  includeTags?: boolean;
  threshold?: number;
  keys?: FuseOptionKey<SearchablePost>[];
}

export interface SearchResult {
  post: SearchablePost;
  score: number;
  matches?: FuseResult<SearchablePost>["matches"];
}

const metadataKeys: FuseOptionKey<SearchablePost>[] = [
  {
    name: "title",
    weight: 0.4,
  },
  {
    name: "excerpt",
    weight: 0.2,
  },
];

function getSearchKeys(options: SearchOptions): FuseOptionKey<SearchablePost>[] {
  if (options.keys) {
    return options.keys;
  }

  return [
    ...metadataKeys,
    ...(options.includeTags === false
      ? []
      : [
          {
            name: "tags.name" as const,
            weight: 0.2,
          },
        ]),
    ...(options.includeContent === false
      ? []
      : [
          {
            name: "searchText" as const,
            weight: 0.2,
          },
        ]),
  ];
}

export class BlogSearch {
  private readonly fuse: Fuse<SearchablePost>;
  private posts: SearchablePost[];

  constructor(posts: SearchablePost[], options: SearchOptions = {}) {
    this.posts = posts;
    this.fuse = new Fuse(posts, {
      keys: getSearchKeys(options),
      threshold: options.threshold ?? 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 1,
      ignoreLocation: true,
    });
  }

  search(query: string): SearchResult[] {
    if (!query.trim()) {
      return this.posts.map((post) => ({ post, score: 0 }));
    }

    return this.fuse.search(query.trim()).map((result) => ({
      post: result.item,
      score: result.score ?? 0,
      matches: result.matches,
    }));
  }

  updatePosts(posts: SearchablePost[]): void {
    this.posts = posts;
    this.fuse.setCollection(posts);
  }

  getPostById(id: string): SearchablePost | undefined {
    return this.posts.find((post) => post.id === id);
  }
}

export function createSearchInstance(
  posts: SearchablePost[],
  options?: SearchOptions,
): BlogSearch {
  return new BlogSearch(posts, options);
}

export function highlightMatchedText(
  text: string,
  matches: FuseResult<SearchablePost>["matches"],
): string {
  if (!matches || !text) return text;

  let highlightedText = text;

  for (const match of matches) {
    if (!match.indices) continue;

    const indices = [...match.indices].sort((a, b) => b[0] - a[0]);
    for (const [start, end] of indices) {
      const before = highlightedText.slice(0, start);
      const matched = highlightedText.slice(start, end + 1);
      const after = highlightedText.slice(end + 1);
      highlightedText = `${before}<mark>${matched}</mark>${after}`;
    }
  }

  return highlightedText;
}
