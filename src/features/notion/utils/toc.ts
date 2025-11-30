import type { ContentBlockWithChildren } from "@/shared/types/content";
import type { TableOfContentsItem } from "@/entities/post/model";

/**
 * 공통 콘텐츠 블록에서 목차(TOC)를 생성하는 유틸리티 함수
 * CMS에 독립적으로 작동합니다.
 */
export function generateTableOfContents(blocks: ContentBlockWithChildren[]): TableOfContentsItem[] {
  const toc: TableOfContentsItem[] = [];
  let headingCounter = 0;

  const processBlocks = (blockList: ContentBlockWithChildren[]) => {
    blockList.forEach((block) => {
      if (block.type === "heading") {
        // fallbackText가 없으면 건너뛰기 (빈 헤딩은 목차에 포함하지 않음)
        if (!block.fallbackText) {
          return;
        }

        headingCounter++;
        toc.push({
          id: block.id || `heading-${headingCounter}`,
          title: block.fallbackText,
          level: block.level || 1, // level이 없으면 기본값 1 사용
        });
      }

      // 자식 블록도 재귀적으로 처리
      if (block.children && block.children.length > 0) {
        processBlocks(block.children);
      }
    });
  };

  processBlocks(blocks);
  return toc;
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
