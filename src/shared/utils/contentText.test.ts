import type { ContentBlockWithChildren } from "@/shared/types/content";
import { extractContentText } from "./contentText";

describe("extractContentText", () => {
  it("joins rich text and uses fallback text only when rich text is absent", () => {
    const blocks: ContentBlockWithChildren[] = [
      {
        id: "rich",
        type: "text",
        richText: [{ plain_text: "hello " }, { plain_text: "world" }],
        fallbackText: "must not be duplicated",
      },
      { id: "fallback", type: "heading", level: 2, richText: [], fallbackText: "fallback heading" },
    ];

    expect(extractContentText(blocks)).toBe("hello world fallback heading");
  });

  it("includes code, media captions, bookmark captions, and every table cell", () => {
    const blocks: ContentBlockWithChildren[] = [
      { id: "code", type: "code", code: "const answer = 42;", language: "typescript" },
      { id: "image", type: "image", url: "https://cdn.example/image.png?signature=secret", caption: "diagram" },
      { id: "video", type: "video", url: "https://cdn.example/video.mp4?token=secret", caption: "demo video" },
      { id: "bookmark", type: "bookmark", url: "https://example.com/page?private=yes#section", caption: "reference" },
      {
        id: "table",
        type: "table",
        rows: [
          {
            type: "table_row",
            cells: [
              { richText: [{ plain_text: "left" }], fallbackText: "ignored" },
              { richText: [], fallbackText: "right" },
            ],
          },
        ],
        hasColumnHeader: false,
        hasRowHeader: false,
      },
    ];

    const result = extractContentText(blocks);

    expect(result).toBe("const answer = 42; diagram demo video reference left right");
    expect(result).not.toContain("https://");
    expect(result).not.toContain("signature");
    expect(result).not.toContain("token");
  });

  it("walks nested children once, drops empty values, and normalizes whitespace", () => {
    const blocks: ContentBlockWithChildren[] = [
      {
        id: "parent",
        type: "list_item",
        listType: "bulleted",
        richText: [{ plain_text: " parent\ntext " }],
        fallbackText: "",
        children: [
          {
            id: "child",
            type: "quote",
            richText: [],
            fallbackText: " nested\tvalue ",
            children: [{ id: "empty", type: "divider" }],
          },
        ],
      },
    ];

    const result = extractContentText(blocks);

    expect(result).toBe("parent text nested value");
    expect(result.match(/nested/g)).toHaveLength(1);
  });
});
