"use client";

import { Fragment } from "react";
import type { NotionBlock } from "@/features/notion";
import { NotionBlockRenderer } from "@/features/notion";

interface PostContentProps {
  blocks: NotionBlock[];
  className?: string;
}

/**
 * 포스트 콘텐츠를 렌더링하는 메인 컴포넌트
 * Notion 블록 배열을 받아서 HTML로 변환
 */
export default function PostContent({ blocks, className = "" }: PostContentProps) {
  // 헤딩 카운터 (목차 ID 생성용)
  let headingCounter = 0;

  const getHeadingId = (type: string): string | undefined => {
    if (["heading_1", "heading_2", "heading_3"].includes(type)) {
      headingCounter++;
      return `heading-${headingCounter}`;
    }
    return undefined;
  };

  const renderBlockWithChildren = (block: NotionBlock, index: number) => {
    const headingId = getHeadingId(block.type);

    return (
      <Fragment key={block.id || index}>
        <NotionBlockRenderer block={block} headingId={headingId} />
        {block.children && block.children.length > 0 && (
          <div className="ml-4 pl-2">
            {block.children.map((child, childIndex) => renderBlockWithChildren(child, childIndex))}
          </div>
        )}
      </Fragment>
    );
  };

  /**
   * 연속된 리스트 아이템들을 그룹화
   */
  const groupBlocks = (blocks: NotionBlock[]) => {
    const grouped: (NotionBlock | NotionBlock[])[] = [];
    let i = 0;

    while (i < blocks.length) {
      const block = blocks[i];

      // 리스트 아이템인 경우 같은 타입끼리 그룹화
      if (block.type === "numbered_list_item" || block.type === "bulleted_list_item") {
        const listType = block.type;
        const listGroup: NotionBlock[] = [block];

        // 연속된 같은 타입의 리스트 아이템 수집
        while (i + 1 < blocks.length && blocks[i + 1].type === listType) {
          i++;
          listGroup.push(blocks[i]);
        }

        grouped.push(listGroup);
      } else {
        grouped.push(block);
      }

      i++;
    }

    return grouped;
  };

  const renderGroupedBlocks = (grouped: (NotionBlock | NotionBlock[])[]) => {
    return grouped.map((item, index) => {
      // 단일 블록
      if (!Array.isArray(item)) {
        return renderBlockWithChildren(item, index);
      }

      // 리스트 그룹
      const listType = item[0].type;
      const ListTag = listType === "numbered_list_item" ? "ol" : "ul";
      const listClassName =
        listType === "numbered_list_item" ? "my-4 space-y-2 list-decimal pl-6" : "my-4 space-y-2 list-disc pl-6";

      return (
        <ListTag key={`list-${index}`} className={listClassName}>
          {item.map((block, blockIndex) => renderBlockWithChildren(block, blockIndex))}
        </ListTag>
      );
    });
  };

  const groupedBlocks = groupBlocks(blocks);

  return (
    <div className={`prose prose-lg max-w-none prose-img:max-w-full ${className}`}>
      {renderGroupedBlocks(groupedBlocks)}
    </div>
  );
}
