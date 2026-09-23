import { getPostThumbnail } from "./post-thumbnail";
import { getPostBlocks } from "./notion-client";
import { readPageBlocksCache, writePageBlocksCache } from "./notion-cache";
import { lookupPrecomputedThumbnail } from "../../../shared/utils/thumbnailMap";
import type { NotionBlock, NotionPost } from "../types";

jest.mock("./notion-client", () => ({ getPostBlocks: jest.fn() }));
jest.mock("./notion-cache", () => ({ readPageBlocksCache: jest.fn(), writePageBlocksCache: jest.fn() }));
jest.mock("../../../shared/utils/thumbnailMap", () => ({ lookupPrecomputedThumbnail: jest.fn() }));

const post: NotionPost = {
  id: "post", title: "Article", slug: "article", published: true,
  createdAt: "2026-09-09", publishedAt: "2026-09-09", updatedAt: "2026-09-09", tags: [], contentType: "post",
};
const image = (url: string): NotionBlock => ({ id: url, type: "image", content: { type: "image", url } });

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(readPageBlocksCache).mockReturnValue(null);
  // 기본은 "빌드 맵에 없는 글" 상태로 두고, 필요한 테스트에서만 값을 준다.
  jest.mocked(lookupPrecomputedThumbnail).mockReturnValue(undefined);
});

it("uses the thumbnail resolved at build time without loading the article body", async () => {
  jest.mocked(lookupPrecomputedThumbnail).mockReturnValue("/precomputed.webp");
  expect(await getPostThumbnail(post)).toBe("/precomputed.webp");
  expect(getPostBlocks).not.toHaveBeenCalled();
  expect(readPageBlocksCache).not.toHaveBeenCalled();
});

it("trusts the build map when it recorded that an article has no image", async () => {
  // 빈 문자열은 "확인했고 이미지가 없었다"는 뜻이므로 본문을 다시 받지 않는다.
  jest.mocked(lookupPrecomputedThumbnail).mockReturnValue("");
  expect(await getPostThumbnail(post)).toBeUndefined();
  expect(getPostBlocks).not.toHaveBeenCalled();
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
