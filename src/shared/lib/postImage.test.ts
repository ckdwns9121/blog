import { getOptimizedImageData } from "@/shared/utils/imageMapper";
import { resolveOgImage, resolvePostImage, toAbsoluteUrl } from "./postImage";

jest.mock("@/shared/utils/imageMapper", () => ({
  getOptimizedImageData: jest.fn((url: string) => ({ src: url })),
}));

const mockGetOptimizedImageData = jest.mocked(getOptimizedImageData);

beforeEach(() => {
  mockGetOptimizedImageData.mockImplementation((url: string) => ({ src: url }));
});

describe("resolvePostImage", () => {
  it("prefers the cover image when present", () => {
    expect(
      resolvePostImage({ coverImage: "/images/a/cover.webp", contentImage: "/images/a/1.webp", slug: "a" }),
    ).toEqual({ src: "/images/a/cover.webp", source: "cover" });
  });

  it("falls back to the first content image when there is no cover", () => {
    expect(resolvePostImage({ contentImage: "/images/a/1.webp", slug: "a" })).toEqual({
      src: "/images/a/1.webp",
      source: "content",
    });
  });

  it("falls back to the generated OG image when the post has no image at all", () => {
    expect(resolvePostImage({ slug: "my-post" })).toEqual({
      src: "/posts/my-post/opengraph-image",
      source: "generated",
    });
  });

  it("treats blank strings as missing", () => {
    expect(resolvePostImage({ coverImage: "   ", contentImage: "", slug: "a" }).source).toBe("generated");
  });

  it("exchanges a Notion proxy url for the locally built image", () => {
    const notionUrl = "https://www.notion.so/image/https%3A%2F%2Fexample.com%2Fa.png?table=block";
    mockGetOptimizedImageData.mockReturnValue({ src: "/images/a/1.webp", width: 1200, height: 630 });

    expect(resolvePostImage({ coverImage: notionUrl, slug: "a" })).toEqual({
      src: "/images/a/1.webp",
      source: "cover",
      width: 1200,
      height: 630,
    });
  });
});

describe("resolveOgImage", () => {
  it("keeps an image the site serves itself", () => {
    expect(resolveOgImage({ coverImage: "/images/a/cover.webp", slug: "a" }).src).toBe("/images/a/cover.webp");
  });

  it("does not hand social crawlers a Notion proxy url that the build did not copy", () => {
    const notionUrl = "https://www.notion.so/image/https%3A%2F%2Fexample.com%2Fa.png?table=block";

    expect(resolveOgImage({ coverImage: notionUrl, slug: "a" })).toEqual({
      src: "/posts/a/opengraph-image",
      source: "generated",
    });
  });

  it("keeps the generated image when there is nothing else", () => {
    expect(resolveOgImage({ slug: "a" }).src).toBe("/posts/a/opengraph-image");
  });
});

describe("toAbsoluteUrl", () => {
  it("leaves absolute urls untouched", () => {
    expect(toAbsoluteUrl("https://cdn.example.com/a.png", "https://blog.test")).toBe("https://cdn.example.com/a.png");
  });

  it("prefixes root-relative paths with the base url", () => {
    expect(toAbsoluteUrl("/images/a.webp", "https://blog.test")).toBe("https://blog.test/images/a.webp");
  });

  it("normalises missing and duplicated slashes", () => {
    expect(toAbsoluteUrl("images/a.webp", "https://blog.test/")).toBe("https://blog.test/images/a.webp");
  });
});
