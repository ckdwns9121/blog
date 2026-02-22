import type { ContentBlockWithChildren } from "@/shared/types/content";

/**
 * 자식 요소를 스스로 처리하는 블록 타입들 (부모 레벨에서 중복 렌더링 방지)
 */
export const SELF_CONTAINED_BLOCK_TYPES = [
  "table",
  "table_row",
  "quote",
] as const;

/**
 * 연속된 리스트 아이템들을 그룹화하여 <ul> 또는 <ol>로 감싸는 유틸리티
 */
export function groupBlocks(blocks: ContentBlockWithChildren[]) {
  const grouped: (ContentBlockWithChildren | ContentBlockWithChildren[])[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    // 리스트 아이템인 경우 같은 타입끼리 그룹화
    if (block.type === "list_item") {
      const listType = block.listType;
      const listGroup: ContentBlockWithChildren[] = [block];

      // 연속된 같은 타입의 리스트 아이템 수집
      while (i + 1 < blocks.length) {
        const nextBlock = blocks[i + 1];
        if (nextBlock.type === "list_item" && nextBlock.listType === listType) {
          i++;
          listGroup.push(blocks[i]);
        } else {
          break;
        }
      }

      grouped.push(listGroup);
    } else {
      grouped.push(block);
    }

    i++;
  }

  return grouped;
}
