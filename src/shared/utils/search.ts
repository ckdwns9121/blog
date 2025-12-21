import Fuse, { type FuseResult, type FuseOptionKey } from "fuse.js";
import type { BlogPost } from "@/entities/post/model";

export type { FuseResult };
export type { FuseOptionKey };

export interface SearchOptions {
  includeContent?: boolean;
  includeTags?: boolean;
  threshold?: number;
  keys?: FuseOptionKey<BlogPost>[];
}

export interface SearchResult {
  post: BlogPost;
  score: number;
  matches?: FuseResult<BlogPost>["matches"];
}

const defaultSearchOptions: Required<SearchOptions> = {
  includeContent: true,
  includeTags: true,
  threshold: 0.3,
  keys: [
    {
      name: "title",
      weight: 0.4,
    },
    {
      name: "excerpt",
      weight: 0.2,
    },
    {
      name: "tags.name",
      weight: 0.2,
    },
    {
      name: "content",
      weight: 0.2,
      getFn: (post) => {
        // Extract text content from content blocks
        return extractTextFromContent(post.content);
      },
    },
  ],
};

function extractTextFromContent(content: unknown[]): string {
  if (!Array.isArray(content)) return "";

  return content
    .map((block) => {
      if (typeof block !== 'object' || !block) return "";

      const blockObj = block as Record<string, unknown>;

      if (blockObj.type === "paragraph" || blockObj.type === "heading") {
        if (blockObj.content && typeof blockObj.content === 'object' && 'rich_text' in blockObj.content) {
          const richText = blockObj.content.rich_text as unknown[];
          return richText
            .map((text) => {
              if (typeof text === 'object' && text && 'plain_text' in text) {
                return (text as { plain_text?: string }).plain_text || "";
              }
              return "";
            })
            .join("");
        }
      } else if (blockObj.type === "text") {
        return (blockObj as { text?: string }).text || "";
      } else if (blockObj.children && Array.isArray(blockObj.children) && blockObj.children.length > 0) {
        return extractTextFromContent(blockObj.children);
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

export class BlogSearch {
  private fuse: Fuse<BlogPost>;
  private posts: BlogPost[];

  constructor(posts: BlogPost[], options: SearchOptions = {}) {
    this.posts = posts;
    const searchOptions = { ...defaultSearchOptions, ...options };

    this.fuse = new Fuse(posts, {
      keys: searchOptions.keys,
      threshold: searchOptions.threshold,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      ignoreLocation: true,
    });
  }

  search(query: string): SearchResult[] {
    if (!query.trim()) {
      return this.posts.map((post) => ({
        post,
        score: 0,
      }));
    }

    const results = this.fuse.search(query);

    return results.map((result) => ({
      post: result.item,
      score: result.score || 0,
      matches: result.matches,
    }));
  }

  updatePosts(posts: BlogPost[]): void {
    this.posts = posts;
    this.fuse.setCollection(posts);
  }

  getPostById(id: string): BlogPost | undefined {
    return this.posts.find((post) => post.id === id);
  }
}

export function createSearchInstance(posts: BlogPost[], options?: SearchOptions): BlogSearch {
  return new BlogSearch(posts, options);
}

export function highlightMatchedText(text: string, matches: FuseResult<BlogPost>["matches"]): string {
  if (!matches || !text) return text;

  let highlightedText = text;

  for (const match of matches) {
    if (match.indices) {
      const indices = [...match.indices].sort((a, b) => b[0] - a[0]); // Sort in reverse order

      for (const [start, end] of indices) {
        const before = highlightedText.slice(0, start);
        const matched = highlightedText.slice(start, end + 1);
        const after = highlightedText.slice(end + 1);
        highlightedText = `${before}<mark>${matched}</mark>${after}`;
      }
    }
  }

  return highlightedText;
}
