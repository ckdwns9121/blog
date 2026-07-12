import { getAllPosts as notionGetAllPosts } from "../service/notion-client";
import type { NotionPost } from "../types";
import { NotionPostAdapter } from "./NotionPostAdapter";

jest.mock("../service/notion-client", () => ({
  getAllPosts: jest.fn(),
  getPostBySlug: jest.fn(),
}));

describe("NotionPostAdapter", () => {
  it("forwards coverImage unchanged and returns only supported metadata", async () => {
    const notionPost: NotionPost = {
      id: "post-1",
      title: "Cover post",
      slug: "cover-post",
      published: true,
      createdAt: "2025-01-01T00:00:00.000Z",
      publishedAt: "2025-01-02T00:00:00.000Z",
      updatedAt: "2025-01-03T00:00:00.000Z",
      tags: [{ name: "cover", slug: "cover" }],
      excerpt: "Cover excerpt",
      coverImage: "https://example.com/cover.png",
    };
    jest.mocked(notionGetAllPosts).mockResolvedValue([notionPost]);

    const [post] = await new NotionPostAdapter().getAllPosts();

    expect(post.coverImage).toBe(notionPost.coverImage);
    expect(Object.keys(post)).toEqual([
      "id",
      "title",
      "slug",
      "publishedAt",
      "updatedAt",
      "excerpt",
      "tags",
      "coverImage",
    ]);
  });
});
