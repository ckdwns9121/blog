import type { NotionBlock, CodeContent, TextContent, RichTextItem, ImageContent } from "../types";
import type { ContentBlockWithChildren } from "@/shared/types/content";

/**
 * Notion 블록의 content에서 순수 텍스트를 추출
 */
export function extractText(content: NotionBlock["content"]): string {
  if (typeof content === "string") {
    return content;
  }

  if (typeof content === "object" && content !== null) {
    const textContent = content as TextContent;

    if ("text" in textContent && textContent.text) {
      return textContent.text;
    }

    if ("rich_text" in textContent && textContent.rich_text) {
      return textContent.rich_text.map((item: RichTextItem) => item.plain_text || "").join("");
    }

    if ("title" in textContent && textContent.title) {
      return textContent.title.map((item: RichTextItem) => item.plain_text || "").join("");
    }
  }

  return "";
}

/**
 * Code 블록의 언어 추출
 */
export function extractLanguage(content: NotionBlock["content"]): string {
  if (typeof content === "object" && content !== null && "language" in content) {
    return (content as CodeContent).language || "text";
  }
  return "text";
}

/**
 * Image/Video 블록의 URL과 caption 추출
 */
export function extractImageData(content: NotionBlock["content"]): { url?: string; caption?: string } {
  if (typeof content === "object" && content !== null) {
    const block = content as Record<string, unknown>;

    // 직접 url 속성이 있는 경우
    if ("url" in block && typeof block.url === "string") {
      return {
        url: block.url,
        caption: block.caption as string,
      };
    }

    // Notion API 구조: { type: 'external', external: { url } } 또는 { type: 'file', file: { url } }
    let url: string | undefined;
    if (block.external && typeof block.external === "object") {
      const external = block.external as { url?: string };
      url = external.url;
    } else if (block.file && typeof block.file === "object") {
      const file = block.file as { url?: string };
      url = file.url;
    }

    // caption 추출
    let caption: string | undefined;
    if (block.caption && Array.isArray(block.caption)) {
      caption = block.caption.map((item: { plain_text?: string }) => item.plain_text || "").join("");
    }

    return { url, caption };
  }
  return {};
}

/**
 * Rich text 배열 추출
 */
export function extractRichTextArray(content: NotionBlock["content"]): RichTextItem[] {
  if (typeof content === "object" && content !== null) {
    const textContent = content as TextContent;

    if ("rich_text" in textContent && textContent.rich_text) {
      return textContent.rich_text;
    }

    if ("title" in textContent && textContent.title) {
      return textContent.title;
    }
  }

  return [];
}

/**
 * Content가 단순 텍스트인지 확인
 */
export function isSimpleText(content: NotionBlock["content"]): content is string {
  return typeof content === "string";
}

/**
 * Table 블록 데이터 추출
 */
export function extractTableData(content: NotionBlock["content"]): {
  width?: number;
  hasColumnHeader: boolean;
  hasRowHeader: boolean;
  rows?: Array<{
    type: "table_row";
    cells: Array<Array<{ plain_text: string; href?: string | null; annotations?: Record<string, unknown> }>>;
  }>;
} {
  if (typeof content === "object" && content !== null) {
    const block = content as Record<string, unknown>;

    if ("type" in block && block.type === "table") {
      return {
        width: block.width as number | undefined,
        hasColumnHeader: (block.has_column_header as boolean) ?? false,
        hasRowHeader: (block.has_row_header as boolean) ?? false,
        rows: block.rows as
          | Array<{
              type: "table_row";
              cells: Array<Array<{ plain_text: string; href?: string | null; annotations?: Record<string, unknown> }>>;
            }>
          | undefined,
      };
    }
  }
  return {
    hasColumnHeader: false,
    hasRowHeader: false,
  };
}

/**
 * Content가 객체 타입인지 확인
 */
export function isContentObject(content: NotionBlock["content"]): content is TextContent {
  return typeof content === "object" && content !== null;
}

/**
 * 타입 가드: ContentBlockWithChildren인지 확인
 */
function isContentBlock(block: NotionBlock | ContentBlockWithChildren): block is ContentBlockWithChildren {
  return "type" in block && typeof block.type === "string" && !("content" in block);
}

/**
 * 포스트 콘텐츠에서 첫 번째 이미지 URL 추출
 * NotionBlock과 ContentBlockWithChildren 모두 지원
 */
export function getFirstImageFromContent(blocks: NotionBlock[] | ContentBlockWithChildren[]): string | undefined {
  for (const block of blocks) {
    // 재귀적으로 자식 블록도 확인
    if (block.children) {
      const childImage = getFirstImageFromContent(block.children);
      if (childImage) {
        return childImage;
      }
    }

    // ContentBlockWithChildren 타입인 경우 (공통 타입)
    if (isContentBlock(block) && block.type === "image") {
      if (block.url) {
        return block.url;
      }
    }

    // NotionBlock 타입인 경우 (레거시 지원)
    if (!isContentBlock(block)) {
      const notionBlock = block as NotionBlock;
      if (
        typeof notionBlock.content === "object" &&
        notionBlock.content !== null &&
        "type" in notionBlock.content &&
        notionBlock.content.type === "image"
      ) {
        // ImageContent 타입인 경우 직접 url 속성 사용
        const imageContent = notionBlock.content as ImageContent;
        if (imageContent.url) {
          return imageContent.url;
        }

        // fallback: extractImageData 사용 (레거시 지원)
        const imageData = extractImageData(notionBlock.content);
        if (imageData.url) {
          return imageData.url;
        }
      }
    }
  }
  return undefined;
}
