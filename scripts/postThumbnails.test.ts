import { collectPostThumbnails } from "./postThumbnails";
import type { PostBuildData } from "./postBuildData";
import type { OptimizedImage } from "./convertImages";
import type { BlogPost } from "../src/entities/post/model";

function makePost(slug: string, coverImage?: string): BlogPost {
  return {
    id: slug,
    title: slug,
    slug,
    excerpt: "",
    publishedAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    tags: [],
    coverImage,
    content: [],
  } as unknown as BlogPost;
}

function buildData(slug: string, imageUrls: string[], coverImage?: string): PostBuildData {
  return { post: makePost(slug, coverImage), imageUrls };
}

describe("collectPostThumbnails", () => {
  it("maps the first content image to its optimized local path", () => {
    const mapping = new Map<string, OptimizedImage>([["https://notion.so/a.png", { src: "/images/a/1.webp" }]]);

    expect(collectPostThumbnails([buildData("a", ["https://notion.so/a.png"])], mapping)).toEqual({
      a: "/images/a/1.webp",
    });
  });

  it("skips the cover image so only the content image is recorded", () => {
    const cover = "https://notion.so/cover.png";
    const mapping = new Map<string, OptimizedImage>([
      [cover, { src: "/images/a/cover.webp" }],
      ["https://notion.so/body.png", { src: "/images/a/1.webp" }],
    ]);

    expect(collectPostThumbnails([buildData("a", [cover, "https://notion.so/body.png"], cover)], mapping)).toEqual({
      a: "/images/a/1.webp",
    });
  });

  it("omits posts that have no images", () => {
    expect(collectPostThumbnails([buildData("empty", [])], new Map())).toEqual({});
  });

  it("omits posts whose only image is the cover", () => {
    const cover = "https://notion.so/cover.png";
    expect(collectPostThumbnails([buildData("a", [cover], cover)], new Map())).toEqual({});
  });

  it("falls back to the original url when conversion produced no local file", () => {
    expect(collectPostThumbnails([buildData("a", ["https://notion.so/a.png"])], new Map())).toEqual({
      a: "https://notion.so/a.png",
    });
  });
});
