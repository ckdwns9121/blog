import type { BlogPost } from "@/entities/post/model";
import {
  createSearchDocument,
  hydrateSearchDocuments,
  parseSearchDocuments,
} from "./searchDocument";

function makePost(): BlogPost {
  return {
    id: "post-1",
    title: "Searchable post",
    slug: "searchable-post",
    excerpt: "A short excerpt",
    publishedAt: new Date("2025-01-02T03:04:05.000Z"),
    updatedAt: new Date("2025-02-03T04:05:06.000Z"),
    tags: [{ name: "TypeScript", slug: "typescript", postCount: 3 }],
    coverImage: "https://example.com/cover.png",
    content: [
      {
        id: "body",
        type: "text",
        richText: [{ plain_text: "body-only phrase" }],
        fallbackText: "",
      },
    ],
    toc: [{ id: "heading", title: "Private TOC", level: 2 }],
  };
}

describe("search documents", () => {
  it("serializes only the exact public fields and converts dates and body text", () => {
    const source = Object.assign(makePost(), { privateNotionObject: { token: "secret" } });

    expect(createSearchDocument(source)).toEqual({
      id: "post-1",
      title: "Searchable post",
      slug: "searchable-post",
      excerpt: "A short excerpt",
      publishedAt: "2025-01-02T03:04:05.000Z",
      updatedAt: "2025-02-03T04:05:06.000Z",
      tags: [{ name: "TypeScript", slug: "typescript", postCount: 3 }],
      coverImage: "https://example.com/cover.png",
      searchText: "body-only phrase",
    });
  });

  it("hydrates dates and empty rendering fields without discarding search text", () => {
    const hydrated = hydrateSearchDocuments([createSearchDocument(makePost())]);

    expect(hydrated[0]).toMatchObject({
      id: "post-1",
      content: [],
      toc: [],
      searchText: "body-only phrase",
    });
    expect(hydrated[0].publishedAt).toEqual(new Date("2025-01-02T03:04:05.000Z"));
    expect(hydrated[0].updatedAt).toEqual(new Date("2025-02-03T04:05:06.000Z"));
  });

  it.each([
    ["non-array payload", { id: "post-1" }, "must be an array"],
    ["invalid date", [{ ...createSearchDocument(makePost()), publishedAt: "yesterday" }], "ISO date string"],
    ["missing field", [{ ...createSearchDocument(makePost()), searchText: undefined }], "searchText must be a string"],
    ["private field", [{ ...createSearchDocument(makePost()), content: [] }], "not a public search field"],
  ])("rejects a malformed %s", (_label, payload, expectedMessage) => {
    expect(() => parseSearchDocuments(payload)).toThrow(expectedMessage);
  });
});
