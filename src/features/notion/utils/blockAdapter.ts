import type { NotionBlock } from "../types";
import type { ContentBlockWithChildren, RichTextItem, TableRow } from "@/shared/types/content";
import { extractText, extractLanguage, extractImageData, extractRichTextArray, extractTableData } from "./blockParser";

/**
 * NotionBlock을 공통 ContentBlock으로 변환하는 어댑터
 * 
 * 이 함수는 Notion-specific 타입을 CMS-agnostic 타입으로 변환합니다.
 * 다른 CMS (MDX, GitHub 등)도 동일한 ContentBlock 타입으로 변환하면
 * BlogPost 엔티티는 변경 없이 사용할 수 있습니다.
 */
export function adaptNotionBlockToContentBlock(block: NotionBlock): ContentBlockWithChildren {
  const { id, type, content, children } = block;
  const richText = extractRichTextArray(content);
  const fallbackText = extractText(content);

  // RichTextItem 타입 변환
  const adaptedRichText: RichTextItem[] = richText.map((item) => ({
    plain_text: item.plain_text,
    href: item.href,
    annotations: item.annotations,
  }));

  // 블록 타입에 따라 변환
  let contentBlock: ContentBlockWithChildren;

  switch (type) {
    case "paragraph":
      contentBlock = {
        id,
        type: "text",
        richText: adaptedRichText,
        fallbackText,
      };
      break;

    case "heading_1":
    case "heading_2":
    case "heading_3":
    case "heading_4":
    case "heading_5":
    case "heading_6": {
      const level = parseInt(type.split("_")[1]) as 1 | 2 | 3 | 4 | 5 | 6;
      contentBlock = {
        id,
        type: "heading",
        level,
        richText: adaptedRichText,
        fallbackText,
      };
      break;
    }

    case "code": {
      const language = extractLanguage(content);
      contentBlock = {
        id,
        type: "code",
        code: fallbackText,
        language: language || "text",
      };
      break;
    }

    case "image": {
      const { url, caption } = extractImageData(content);
      contentBlock = {
        id,
        type: "image",
        url: url || "",
        caption,
      };
      break;
    }

    case "video": {
      const { url, caption } = extractImageData(content);
      contentBlock = {
        id,
        type: "video",
        url: url || "",
        caption,
      };
      break;
    }

    case "quote":
      contentBlock = {
        id,
        type: "quote",
        richText: adaptedRichText,
        fallbackText,
      };
      break;

    case "bulleted_list_item":
      contentBlock = {
        id,
        type: "list_item",
        listType: "bulleted",
        richText: adaptedRichText,
        fallbackText,
      };
      break;

    case "numbered_list_item":
      contentBlock = {
        id,
        type: "list_item",
        listType: "numbered",
        richText: adaptedRichText,
        fallbackText,
      };
      break;

    case "divider":
      contentBlock = {
        id,
        type: "divider",
      };
      break;

    case "bookmark":
    case "link_preview": {
      const { url, caption } = extractImageData(content);
      contentBlock = {
        id,
        type: "bookmark",
        url: url || "",
        caption,
      };
      break;
    }

    case "table": {
      const tableData = extractTableData(content);
      // Process children blocks to extract table rows
      const rows: TableRow[] = [];
      if (children) {
        for (const child of children) {
          if (child.type === "table_row") {
            // child.content is now TableRowContent with cells property
            const rowContent = child.content as { type: string; cells: Array<Array<{ rich_text: RichTextItem[] }>> };
            if (rowContent.cells) {
              const cells = rowContent.cells.map((cell) => {
                // cell is an array of objects with rich_text property
                const richText = cell.flatMap((c) => c.rich_text || []);
                return {
                  richText,
                  fallbackText: richText.map((item) => item.plain_text || "").join(""),
                };
              });
              rows.push({
                type: "table_row",
                cells,
              });
            }
          }
        }
      }
      contentBlock = {
        id,
        type: "table",
        rows,
        hasColumnHeader: tableData.hasColumnHeader,
        hasRowHeader: tableData.hasRowHeader,
      };
      break;
    }

    case "table_row": {
      // table_row is handled within the table case above
      // This is a fallback for orphaned table rows
      contentBlock = {
        id,
        type: "text",
        richText: adaptedRichText,
        fallbackText: fallbackText || `[Unknown block type: ${type}]`,
      };
      break;
    }

    default:
      // 알 수 없는 타입은 텍스트 블록으로 처리
      contentBlock = {
        id,
        type: "text",
        richText: adaptedRichText,
        fallbackText: fallbackText || `[Unknown block type: ${type}]`,
      };
  }

  // 자식 블록이 있으면 재귀적으로 변환 (단, table은 제외 - 이미 rows로 처리함)
  if (children && children.length > 0 && type !== "table" && type !== "table_row") {
    contentBlock.children = children.map(adaptNotionBlockToContentBlock);
  }

  return contentBlock;
}

/**
 * NotionBlock 배열을 ContentBlockWithChildren 배열로 변환
 */
export function adaptNotionBlocksToContentBlocks(blocks: NotionBlock[]): ContentBlockWithChildren[] {
  return blocks.map(adaptNotionBlockToContentBlock);
}
