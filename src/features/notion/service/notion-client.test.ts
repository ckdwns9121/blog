import { Client } from "@notionhq/client";
import { adaptNotionBlocksToContentBlocks } from "../utils/blockAdapter";
import { getPostBlocks, tagSlug } from "./notion-client";

jest.mock("@notionhq/client", () => ({
  Client: jest.fn(),
}));

const mockClient = jest.mocked(Client);

describe("tagSlug", () => {
  it.each([
    ["개발", "개발"],
    ["Frontend Fundamentals", "frontend-fundamentals"],
    [" React & 상태 관리 ", "react-상태-관리"],
  ])("preserves URL-safe Unicode characters in %s", (value, expected) => {
    expect(tagSlug(value)).toBe(expected);
  });
});

describe("getPostBlocks", () => {
  const originalApiKey = process.env.NOTION_API_KEY;
  const listBlocks = jest.fn();

  beforeAll(() => {
    process.env.NOTION_API_KEY = "test-api-key";
    mockClient.mockImplementation(
      () =>
        ({
          blocks: {
            children: {
              list: listBlocks,
            },
          },
        }) as unknown as Client,
    );
  });

  afterAll(() => {
    if (originalApiKey === undefined) {
      delete process.env.NOTION_API_KEY;
    } else {
      process.env.NOTION_API_KEY = originalApiKey;
    }
  });

  it("preserves heading four text and adapts link previews as bookmarks", async () => {
    listBlocks.mockResolvedValueOnce({
      results: [
        {
          object: "block",
          id: "heading-4",
          type: "heading_4",
          created_time: "2026-07-17T00:00:00.000Z",
          last_edited_time: "2026-07-17T00:00:00.000Z",
          has_children: false,
          heading_4: {
            rich_text: [{ plain_text: "Fourth-level heading", href: null }],
          },
        },
        {
          object: "block",
          id: "link-preview",
          type: "link_preview",
          created_time: "2026-07-17T00:00:00.000Z",
          last_edited_time: "2026-07-17T00:00:00.000Z",
          has_children: false,
          link_preview: {
            url: "https://github.com/cssinjs/jss/issues/665",
          },
        },
      ],
      has_more: false,
      next_cursor: null,
    });

    const contentBlocks = adaptNotionBlocksToContentBlocks(await getPostBlocks("page-id"));

    expect(contentBlocks).toEqual([
      expect.objectContaining({
        id: "heading-4",
        type: "heading",
        level: 4,
        fallbackText: "Fourth-level heading",
      }),
      expect.objectContaining({
        id: "link-preview",
        type: "bookmark",
        url: "https://github.com/cssinjs/jss/issues/665",
      }),
    ]);
  });
});
