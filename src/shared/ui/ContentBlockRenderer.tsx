"use client";

import { createElement } from "react";
import type { ContentBlockWithChildren } from "@/shared/types/content";
import { RichTextRenderer } from "@/features/notion/ui/RichTextRenderer";
import { CodeBlock } from "@/features/notion/ui/blocks/CodeBlock";
import { ImageBlock } from "@/features/notion/ui/blocks/ImageBlock";
import { VideoBlock } from "@/features/notion/ui/blocks/VideoBlock";

interface ContentBlockRendererProps {
  block: ContentBlockWithChildren;
  headingId?: string;
}

/**
 * 공통 콘텐츠 블록을 렌더링하는 컴포넌트
 * CMS에 독립적으로 작동하며, 다양한 소스의 블록을 렌더링할 수 있습니다.
 */
export function ContentBlockRenderer({ block, headingId }: ContentBlockRendererProps) {
  switch (block.type) {
    case "text":
      return (
        <p className="my-4">
          {block.richText && block.richText.length > 0 ? (
            <RichTextRenderer items={block.richText} />
          ) : (
            <span>{block.fallbackText || ""}</span>
          )}
        </p>
      );

    case "heading": {
      const level = block.level || 1;
      const HeadingTag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      return createElement(
        HeadingTag,
        {
          id: headingId,
          className: `my-6 font-bold ${getHeadingClassName(level)}`,
        },
        block.richText && block.richText.length > 0 ? (
          <RichTextRenderer items={block.richText} />
        ) : (
          <span>{block.fallbackText || ""}</span>
        )
      );
    }

    case "code":
      return <CodeBlock code={block.code || ""} language={block.language || "text"} />;

    case "image":
      return <ImageBlock url={block.url || ""} caption={block.caption} />;

    case "video":
      return <VideoBlock url={block.url || ""} caption={block.caption} />;

    case "quote":
      return (
        <blockquote className="my-4 pl-4 border-l-4 border-gray-300 dark:border-gray-600 italic">
          {block.richText && block.richText.length > 0 ? (
            <RichTextRenderer items={block.richText} />
          ) : (
            <span>{block.fallbackText || ""}</span>
          )}
        </blockquote>
      );

    case "list_item":
      return (
        <li className="my-1">
          {block.richText && block.richText.length > 0 ? (
            <RichTextRenderer items={block.richText} />
          ) : (
            <span>{block.fallbackText || ""}</span>
          )}
        </li>
      );

    case "divider":
      return <hr className="my-8 border-gray-300 dark:border-gray-600" />;

    case "bookmark":
      return (
        <div className="my-4">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">{block.url}</div>
            {block.caption && <div className="mt-2 text-sm">{block.caption}</div>}
          </a>
        </div>
      );

    default:
      // 타입 안전성을 위한 exhaustive check
      // ContentBlockWithChildren의 모든 타입이 처리되었는지 확인
      console.warn("Unknown block type:", block);
      return null;
  }
}

function getHeadingClassName(level: number): string {
  const classMap: Record<number, string> = {
    1: "text-4xl",
    2: "text-3xl",
    3: "text-2xl",
    4: "text-xl",
    5: "text-lg",
    6: "text-base",
  };
  return classMap[level] || "text-2xl";
}
