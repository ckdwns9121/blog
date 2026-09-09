import type { NotionBlock, NotionPost } from "../types";
import { getPostBlocks } from "./notion-client";
import { readPageBlocksCache, writePageBlocksCache } from "./notion-cache";

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

/** Resolve list thumbnails without fetching content when a cover is available. */
export async function getPostThumbnail(post: NotionPost): Promise<string | undefined> {
  if (post.coverImage?.trim()) return post.coverImage;

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
