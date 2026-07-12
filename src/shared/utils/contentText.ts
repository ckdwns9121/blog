import type { ContentBlockWithChildren, RichTextItem, TableCell } from "@/shared/types/content";

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractRichText(items: readonly RichTextItem[] | undefined): string {
  if (!items || items.length === 0) {
    return "";
  }

  return items.map((item) => item.plain_text).join("");
}

function extractTextWithFallback(
  richText: readonly RichTextItem[] | undefined,
  fallbackText: string | undefined,
): string {
  const text = extractRichText(richText);
  return text || fallbackText || "";
}

function extractTableCellText(cell: TableCell): string {
  return extractTextWithFallback(cell.richText, cell.fallbackText);
}

function extractBlockText(block: ContentBlockWithChildren): string[] {
  const values: string[] = [];

  switch (block.type) {
    case "text":
    case "heading":
    case "quote":
    case "list_item":
      values.push(extractTextWithFallback(block.richText, block.fallbackText));
      break;
    case "code":
      values.push(block.code || "");
      break;
    case "image":
    case "video":
    case "bookmark":
      values.push(block.caption || "");
      break;
    case "table":
      for (const row of block.rows || []) {
        values.push(...row.cells.map(extractTableCellText));
      }
      break;
    case "divider":
      break;
  }

  for (const child of block.children || []) {
    values.push(...extractBlockText(child));
  }

  return values;
}

/**
 * Flattens rendered, human-readable post content into stable search text.
 * Media URLs are deliberately excluded so signed URLs and storage metadata
 * cannot leak into the public search index.
 */
export function extractContentText(blocks: readonly ContentBlockWithChildren[]): string {
  return normalizeWhitespace(blocks.flatMap(extractBlockText).filter(Boolean).join(" "));
}
