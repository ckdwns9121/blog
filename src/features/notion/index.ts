/**
 * Notion Feature - Public API
 *
 * 이 파일은 Notion feature의 외부 인터페이스를 정의합니다.
 * 다른 모듈에서는 이 파일을 통해서만 Notion 기능에 접근해야 합니다.
 */

// API Client Functions
export { getAllPosts, getPostBySlug, getPostByPageId, getPostBlocks, getPostsByTag } from "./api/client";

// Types
export type {
  // Notion API 타입
  NotionPost,
  NotionBlock,
  NotionBlockType,
  NotionRichText,
  RichTextItem,
  BlockContent,
  TextContent,
  CodeContent,
  ImageContent,

  // Application 타입
  BlogPost,
  Tag,
  TableOfContentsItem,
} from "./types";

// Components
export { NotionBlockRenderer } from "./components/NotionBlockRenderer";
export { RichTextRenderer } from "./components/RichTextRenderer";
export { CodeBlock, ImageBlock, VideoBlock } from "./components/blocks";

// Utils
export { parseNotionBlock } from "./utils/blockMapper";
export type { ParsedBlock } from "./utils/blockMapper";
export { extractText, extractLanguage, extractImageData, extractRichTextArray } from "./utils/blockParser";
export { generateTableOfContents, organizeTocHierarchy, filterTocByLevel } from "./utils/toc";
