import type { NotionBlock, TableOfContentsItem, TextContent } from "../types/notion";

/**
 * Notion 블록에서 목차(TOC)를 생성하는 유틸리티 함수
 */
export function generateTableOfContents(blocks: NotionBlock[]): TableOfContentsItem[] {
  const toc: TableOfContentsItem[] = [];
  let headingCounter = 0;

  blocks.forEach((block) => {
    if (isHeadingBlock(block)) {
      headingCounter++;
      const level = getHeadingLevel(block.type);
      const title = extractHeadingText(block);

      if (title) {
        toc.push({
          id: `heading-${headingCounter}`,
          title,
          level,
        });
      }
    }
  });

  return toc;
}

/**
 * 블록이 헤딩 블록인지 확인
 */
function isHeadingBlock(block: NotionBlock): boolean {
  return ["heading_1", "heading_2", "heading_3", "heading_4", "heading_5", "heading_6"].includes(block.type);
}

/**
 * 헤딩 레벨 추출
 */
function getHeadingLevel(blockType: string): number {
  const levelMap: Record<string, number> = {
    heading_1: 1,
    heading_2: 2,
    heading_3: 3,
    heading_4: 4,
    heading_5: 5,
    heading_6: 6,
  };

  return levelMap[blockType] || 1;
}

/**
 * 헤딩 블록에서 텍스트 추출
 */
function extractHeadingText(block: NotionBlock): string {
  if (typeof block.content === "object" && block.content !== null) {
    const content = block.content as TextContent;
    if ("text" in content && content.text) {
      return content.text;
    }
  }
  return "";
}

/**
 * 목차를 계층 구조로 정리하는 함수
 */
export function organizeTocHierarchy(toc: TableOfContentsItem[]): TableOfContentsItem[] {
  const organized: TableOfContentsItem[] = [];
  const stack: TableOfContentsItem[] = [];

  toc.forEach((item) => {
    // 현재 아이템보다 높은 레벨의 아이템들을 스택에서 제거
    while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
      stack.pop();
    }

    // 현재 아이템을 스택에 추가
    stack.push(item);
    organized.push(item);
  });

  return organized;
}

/**
 * 목차에서 특정 레벨의 아이템들만 필터링
 */
export function filterTocByLevel(toc: TableOfContentsItem[], maxLevel: number): TableOfContentsItem[] {
  return toc.filter((item) => item.level <= maxLevel);
}
