import { getPostThumbnail } from "./post-thumbnail";
import { getPostBlocks } from "./notion-client";
import { readPageBlocksCache, writePageBlocksCache } from "./notion-cache";
import type { NotionBlock, NotionPost } from "../types";

jest.mock("./notion-client", () => ({ getPostBlocks: jest.fn() }));
jest.mock("./notion-cache", () => ({ readPageBlocksCache: jest.fn(), writePageBlocksCache: jest.fn() }));

const post: NotionPost = {
  id: "post", title: "Article", slug: "article", published: true,
  createdAt: "2026-09-09", publishedAt: "2026-09-09", updatedAt: "2026-09-09", tags: [],
};
const image = (url: string): NotionBlock => ({ id: url, type: "image", content: { type: "image", url } });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(readPageBlocksCache).mockReturnValue(null);
});

it("uses the cover without loading the article body", async () => {
  expect(await getPostThumbnail({ ...post, coverImage: "/cover.webp" })).toBe("/cover.webp");
  expect(getPostBlocks).not.toHaveBeenCalled();
});

it("uses the first body image in reading order, including nested blocks", async () => {
  const blocks: NotionBlock[] = [
    { id: "column", type: "column", content: "", children: [image("/first.webp")] },
    image("/second.webp"),
  ];
  jest.mocked(getPostBlocks).mockResolvedValue(blocks);
  expect(await getPostThumbnail(post)).toBe("/first.webp");
  expect(writePageBlocksCache).toHaveBeenCalledWith(post.id, post.updatedAt, blocks);
});

it("reuses body blocks cached for this article revision", async () => {
  jest.mocked(readPageBlocksCache).mockReturnValue([image("/cached.webp")]);
  expect(await getPostThumbnail(post)).toBe("/cached.webp");
  expect(readPageBlocksCache).toHaveBeenCalledWith(post.id, post.updatedAt);
  expect(getPostBlocks).not.toHaveBeenCalled();
});

it("omits the thumbnail when neither source contains an image", async () => {
  jest.mocked(getPostBlocks).mockResolvedValue([]);
  expect(await getPostThumbnail(post)).toBeUndefined();
});

it("keeps the article available when loading its body fails", async () => {
  jest.mocked(getPostBlocks).mockRejectedValue(new Error("unavailable"));
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
  expect(await getPostThumbnail(post)).toBeUndefined();
  warning.mockRestore();
});
