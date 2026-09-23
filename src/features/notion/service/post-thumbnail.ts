import type { NotionBlock, NotionPost } from "../types";
import { getPostBlocks } from "./notion-client";
import { readPageBlocksCache, writePageBlocksCache } from "./notion-cache";
import { lookupPrecomputedThumbnail } from "@/shared/utils/thumbnailMap";

function firstImage(blocks: NotionBlock[]): string | undefined {
  for (const block of blocks) {
    if (block.type === "image" && typeof block.content === "object" &&
        "url" in block.content && block.content.url.trim()) {
      return block.content.url;
    }
    const nested = block.children && firstImage(block.children);
    if (nested) return nested;
  }
}

/**
 * 목록 화면의 썸네일을 Notion 호출 없이 결정한다.
 *
 * 우선순위는 커버 이미지, 빌드 때 확정한 대표 이미지 맵, 마지막으로 본문 조회 순이다.
 * 맵에 있는 글은 본문을 받아오지 않으므로, 목록 한 번을 그릴 때 글 수만큼
 * 블록 조회가 발생하던 문제가 사라진다. 맵에 없는 글은 빌드 이후 발행된 글뿐이라
 * 실제 조회는 많아야 몇 건이다.
 */
export async function getPostThumbnail(post: NotionPost): Promise<string | undefined> {
  if (post.coverImage?.trim()) return post.coverImage;

  const precomputed = lookupPrecomputedThumbnail(post.id);
  if (precomputed !== undefined) {
    // 빈 문자열은 "이미지가 없다고 확인된 글"이므로 재조회하지 않는다.
    return precomputed || undefined;
  }

  try {
    let blocks = readPageBlocksCache(post.id, post.updatedAt);
    if (!blocks) {
      blocks = await getPostBlocks(post.id);
      writePageBlocksCache(post.id, post.updatedAt, blocks);
    }
    return firstImage(blocks);
  } catch {
    // A thumbnail lookup failure must not remove the article from the list.
    console.warn(`Could not load thumbnail for post ${post.id}`);
    return undefined;
  }
}
