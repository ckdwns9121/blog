import type { NotionBlock, RichTextItem } from "../types";
import { extractText, extractLanguage, extractImageData, extractRichTextArray } from "./blockParser";

/**
 * Notion 블록을 렌더링에 필요한 Props로 매핑
 */

export interface ParsedParagraphBlock {
  type: "paragraph";
  richText: RichTextItem[];
  fallbackText: string;
}

export interface ParsedHeadingBlock {
  type: "heading_1" | "heading_2" | "heading_3";
  richText: RichTextItem[];
  fallbackText: string;
  level: 1 | 2 | 3;
}

export interface ParsedListBlock {
  type: "bulleted_list_item" | "numbered_list_item";
  richText: RichTextItem[];
  fallbackText: string;
}

export interface ParsedCodeBlock {
  type: "code";
  code: string;
  language: string;
}

export interface ParsedQuoteBlock {
  type: "quote";
  richText: RichTextItem[];
  fallbackText: string;
}

export interface ParsedImageBlock {
  type: "image";
  url?: string;
  caption?: string;
}

export interface ParsedVideoBlock {
  type: "video";
  url?: string;
  caption?: string;
}

export interface ParsedDividerBlock {
  type: "divider";
}

export interface ParsedBookmarkBlock {
  type: "bookmark";
  url: string;
  caption?: string;
}

export interface ParsedDefaultBlock {
  type: "default";
  originalType: string;
  richText: RichTextItem[];
  fallbackText: string;
}

export type ParsedBlock =
  | ParsedParagraphBlock
  | ParsedHeadingBlock
  | ParsedListBlock
  | ParsedCodeBlock
  | ParsedQuoteBlock
  | ParsedImageBlock
  | ParsedVideoBlock
  | ParsedDividerBlock
  | ParsedBookmarkBlock
  | ParsedDefaultBlock;

/**
 * Notion 블록을 렌더링 가능한 형태로 파싱
 */
export function parseNotionBlock(block: NotionBlock): ParsedBlock {
  const { type, content } = block;
  const richText = extractRichTextArray(content);
  const fallbackText = extractText(content);

  switch (type) {
    case "paragraph":
      return {
        type: "paragraph",
        richText,
        fallbackText,
      };

    case "heading_1":
    case "heading_2":
    case "heading_3":
      return {
        type,
        richText,
        fallbackText,
        level: parseInt(type.split("_")[1]) as 1 | 2 | 3,
      };

    case "bulleted_list_item":
    case "numbered_list_item":
      return {
        type,
        richText,
        fallbackText,
      };

    case "code":
      return {
        type: "code",
        code: fallbackText,
        language: extractLanguage(content),
      };

    case "quote":
      return {
        type: "quote",
        richText,
        fallbackText,
      };

    case "image":
      const { url, caption } = extractImageData(content);
      return {
        type: "image",
        url,
        caption,
      };

    case "video":
      const videoData = extractImageData(content);
      return {
        type: "video",
        url: videoData.url,
        caption: videoData.caption,
      };

    case "divider":
      return {
        type: "divider",
      };

    case "bookmark": {
      const bookmarkData = extractImageData(content);
      return {
        type: "bookmark",
        url: bookmarkData.url || "",
        caption: bookmarkData.caption,
      };
    }

    default:
      return {
        type: "default",
        originalType: type,
        richText,
        fallbackText,
      };
  }
}
