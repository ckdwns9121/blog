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
          <div className="ml-4">
            {block.children.map((child, childIndex) => renderBlockWithChildren(child, childIndex))}
          </div>
        )}
      </Fragment>
    );
  };

  return (
    <div className={`prose prose-lg max-w-none prose-img:max-w-full ${className}`}>
      {blocks.map((block, index) => renderBlockWithChildren(block, index))}
    </div>
  );
}
