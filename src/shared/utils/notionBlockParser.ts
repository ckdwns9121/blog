import type { NotionBlock, CodeContent, ImageContent, TextContent, RichTextItem } from "../types/notion";

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
 * Content가 객체 타입인지 확인
 */
export function isContentObject(content: NotionBlock["content"]): content is TextContent {
  return typeof content === "object" && content !== null;
}
