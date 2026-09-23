import { buildThumbnailMap } from "./thumbnailMap";

describe("buildThumbnailMap", () => {
  it("keys posts by hyphen-free lowercase page id", () => {
    const map = buildThumbnailMap([
      { id: "3CF2ACD7-2313-805D-90D6-E4C03BAC1DA1", imageUrls: ["https://example.com/a.png"] },
    ]);

    expect(map).toEqual({ "3cf2acd72313805d90d6e4c03bac1da1": "https://example.com/a.png" });
  });

  it("keeps the first usable image so cover images win over body images", () => {
    const map = buildThumbnailMap([
      { id: "post-1", imageUrls: ["https://example.com/cover.png", "https://example.com/body.png"] },
    ]);

    expect(map.post1).toBe("https://example.com/cover.png");
  });

  it("skips blank entries instead of treating them as the thumbnail", () => {
    const map = buildThumbnailMap([
      { id: "post-1", imageUrls: ["", "   ", "https://example.com/body.png"] },
    ]);

    expect(map.post1).toBe("https://example.com/body.png");
  });

  it("records an empty string for posts confirmed to have no image", () => {
    const map = buildThumbnailMap([{ id: "post-1", imageUrls: [] }]);

    // 빈 문자열은 "조회했지만 이미지가 없었다"는 뜻이므로 런타임 재조회를 막는다.
    expect(map.post1).toBe("");
    expect("post1" in map).toBe(true);
  });

  it("trims surrounding whitespace from the stored url", () => {
    const map = buildThumbnailMap([{ id: "post-1", imageUrls: ["  https://example.com/a.png  "] }]);

    expect(map.post1).toBe("https://example.com/a.png");
  });
});
