import type { BlogPost } from "../src/entities/post/model";
import {
  collectPostBuildData,
  type FullPostFetcher,
  type PostBuildMetadata,
} from "./postBuildData";

function makePost(id: string): BlogPost {
  return {
    id,
    title: `Title ${id}`,
    slug: `post-${id}`,
    excerpt: `Excerpt ${id}`,
    publishedAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: new Date("2025-01-02T00:00:00.000Z"),
    tags: [{ name: "tag", slug: "tag", postCount: 0 }],
    coverImage: `https://example.com/${id}-cover.png`,
    content: [
      { id: `${id}-image`, type: "image", url: `https://example.com/${id}-body.png` },
      {
        id: `${id}-parent`,
        type: "text",
        richText: [],
        fallbackText: "parent",
        children: [{ id: `${id}-nested`, type: "image", url: `https://example.com/${id}-nested.png` }],
      },
    ],
    toc: [],
  };
}

function toMetadata(post: BlogPost): PostBuildMetadata {
  const { id, title, slug, excerpt, publishedAt, updatedAt, tags, coverImage } = post;
  return { id, title, slug, excerpt, publishedAt, updatedAt, tags, coverImage };
}

describe("collectPostBuildData", () => {
  it("fetches every full post exactly once and preserves order, count, IDs, and images", async () => {
    const fullPosts = [makePost("one"), makePost("two")];
    const metadataPosts = fullPosts.map(toMetadata);
    const fetchFullPost = jest.fn<ReturnType<FullPostFetcher>, Parameters<FullPostFetcher>>(async (id) => {
      const post = fullPosts.find((candidate) => candidate.id === id);
      if (!post) throw new Error(`Unexpected ID ${id}`);
      return post;
    });

    const result = await collectPostBuildData(metadataPosts, fetchFullPost);

    expect(fetchFullPost.mock.calls).toEqual([
      ["one", true],
      ["two", true],
    ]);
    expect(result.map(({ post }) => post.id)).toEqual(["one", "two"]);
    expect(result).toHaveLength(metadataPosts.length);
    expect(result[0].imageUrls).toEqual([
      "https://example.com/one-cover.png",
      "https://example.com/one-body.png",
      "https://example.com/one-nested.png",
    ]);
  });

  it("rejects zero metadata posts without calling the fetcher", async () => {
    const fetchFullPost = jest.fn<ReturnType<FullPostFetcher>, Parameters<FullPostFetcher>>();

    await expect(collectPostBuildData([], fetchFullPost)).rejects.toThrow("no published posts");
    expect(fetchFullPost).not.toHaveBeenCalled();
  });

  it("rejects the whole collection when any full-post fetch fails", async () => {
    const posts = [makePost("one"), makePost("two")];
    const fetchFullPost = jest.fn<ReturnType<FullPostFetcher>, Parameters<FullPostFetcher>>(async (id) => {
      if (id === "two") throw new Error("Notion content fetch failed");
      return posts[0];
    });

    await expect(collectPostBuildData(posts.map(toMetadata), fetchFullPost)).rejects.toThrow(
      "Notion content fetch failed",
    );
    expect(fetchFullPost).toHaveBeenCalledTimes(posts.length);
  });
});
