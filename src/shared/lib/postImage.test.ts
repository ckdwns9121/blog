import { resolvePostImage, toAbsoluteUrl } from "./postImage";

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
