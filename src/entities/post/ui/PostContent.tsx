"use client";

import { Fragment } from "react";
import type { ContentBlockWithChildren } from "@/shared/types/content";
import { ContentBlockRenderer } from "@/features/notion/ui/ContentBlockRenderer";
import { SELF_CONTAINED_BLOCK_TYPES } from "@/shared/utils/blockGrouping";

interface PostContentProps {
  blocks: ContentBlockWithChildren[];
  className?: string;
}

const WIDE_BLOCK_TYPES = new Set<ContentBlockWithChildren["type"]>([
  "code",
  "image",
  "table",
  "video",
]);

function getContentWidthClass(block: ContentBlockWithChildren) {
  return WIDE_BLOCK_TYPES.has(block.type) ? "max-w-5xl" : "max-w-3xl";
}

/**
 * 포스트 콘텐츠를 렌더링하는 메인 컴포넌트
 * CMS에 독립적인 공통 블록 배열을 받아서 HTML로 변환
 */
export default function PostContent({
  blocks,
  className = "",
}: PostContentProps) {
  // 헤딩 카운터 (목차 ID 생성용)
  let headingCounter = 0;

  const getHeadingId = (
    block: ContentBlockWithChildren,
  ): string | undefined => {
    if (block.type === "heading") {
      headingCounter++;
      return block.id || `heading-${headingCounter}`;
    }
    return undefined;
  };

  const renderBlockWithChildren = (
    block: ContentBlockWithChildren,
    index: number,
  ) => {
    const headingId = getHeadingId(block);

    const isSelfContained = (SELF_CONTAINED_BLOCK_TYPES as readonly string[]).includes(block.type);

    return (
      <Fragment key={block.id || index}>
        <ContentBlockRenderer block={block} headingId={headingId} />
        {!isSelfContained && block.children && block.children.length > 0 && (
          <div className="ml-2 pl-2">
            {block.children.map((child, childIndex) =>
              renderBlockWithChildren(child, childIndex),
            )}
          </div>
        )}
      </Fragment>
    );
  };

  /**
   * 연속된 리스트 아이템들을 그룹화
   */
  const groupBlocks = (blocks: ContentBlockWithChildren[]) => {
    const grouped: (ContentBlockWithChildren | ContentBlockWithChildren[])[] =
      [];
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
          if (
            nextBlock.type === "list_item" &&
            nextBlock.listType === listType
          ) {
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
  };

  const renderGroupedBlocks = (
    grouped: (ContentBlockWithChildren | ContentBlockWithChildren[])[],
  ) => {
    return grouped.map((item, index) => {
      // 단일 블록
      if (!Array.isArray(item)) {
        return (
          <div
            key={item.id || index}
            className={`mx-auto w-full ${getContentWidthClass(item)} ${index === 0 ? "[&>*:first-child]:mt-0" : ""}`}
          >
            {renderBlockWithChildren(item, index)}
          </div>
        );
      }

      // 리스트 그룹
      const firstItem = item[0];
      const listType =
        firstItem.type === "list_item" ? firstItem.listType : "bulleted";
      const ListTag = listType === "numbered" ? "ol" : "ul";
      const listClassName =
        listType === "numbered"
          ? "my-3 space-y-1 list-decimal pl-6"
          : "my-3 space-y-1 list-disc pl-6";

      return (
        <ListTag
          key={`list-${index}`}
          className={`mx-auto max-w-3xl ${listClassName} ${index === 0 ? "mt-0" : ""}`}
        >
          {item.map((block, blockIndex) =>
            renderBlockWithChildren(block, blockIndex),
          )}
        </ListTag>
      );
    });
  };

  const groupedBlocks = groupBlocks(blocks);

  return (
    <div className={className}>{renderGroupedBlocks(groupedBlocks)}</div>
  );
}
