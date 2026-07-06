"use client";

import { createElement } from "react";
import type { ContentBlockWithChildren } from "@/shared/types/content";
import type { TableCell } from "@/shared/types/content";
import { RichTextRenderer } from "@/features/notion/ui/RichTextRenderer";
import { CodeBlock } from "@/features/notion/ui/blocks/CodeBlock";
import { ImageBlock } from "@/features/notion/ui/blocks/ImageBlock";
import { VideoBlock } from "@/features/notion/ui/blocks/VideoBlock";

interface ContentBlockRendererProps {
  block: ContentBlockWithChildren;
  headingId?: string;
}

/**
 * 콘텐츠 블록을 렌더링하는 컴포넌트
 * Notion 블록 데이터를 받아 적절한 UI로 변환합니다.
 */
export function ContentBlockRenderer({
  block,
  headingId,
}: ContentBlockRendererProps) {
  switch (block.type) {
    case "text":
      return (
        <p className="my-5 leading-[1.75]">
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
          className: getHeadingClassName(level),
        },
        block.richText && block.richText.length > 0 ? (
          <RichTextRenderer items={block.richText} />
        ) : (
          <span>{block.fallbackText || ""}</span>
        ),
      );
    }

    case "code":
      return (
        <CodeBlock
          code={block.code || ""}
          language={block.language || "text"}
        />
      );

    case "image":
      return <ImageBlock url={block.url || ""} caption={block.caption} />;

    case "video":
      return <VideoBlock url={block.url || ""} caption={block.caption} />;

    case "quote":
      return (
        <blockquote className="my-5 border-l-2 border-gray-300 bg-gray-50 px-6 py-3 leading-[1.75] italic text-gray-700 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300">
          {block.richText && block.richText.length > 0 ? (
            <RichTextRenderer items={block.richText} />
          ) : (
            <span>{block.fallbackText || ""}</span>
          )}
          {block.children && block.children.length > 0 && (
            <div className="mt-3">
              {block.children.map((child, childIndex) => (
                <ContentBlockRenderer
                  key={child.id || childIndex}
                  block={child}
                />
              ))}
            </div>
          )}{" "}
        </blockquote>
      );

    case "list_item":
      return (
        <li className="my-5 leading-[1.75]">
          {block.richText && block.richText.length > 0 ? (
            <RichTextRenderer items={block.richText} />
          ) : (
            <span>{block.fallbackText || ""}</span>
          )}
        </li>
      );

    case "divider":
      return <hr className="my-6 border-gray-300 dark:border-gray-600" />;

    case "bookmark":
      return (
        <div className="my-4">
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {block.url}
            </div>
            {block.caption && (
              <div className="mt-2 text-sm">{block.caption}</div>
            )}
          </a>
        </div>
      );

    case "table": {
      const rows = block.rows || [];
      const hasColumnHeader = block.hasColumnHeader || false;
      if (rows.length === 0) {
        return null;
      }
      return (
        <div className="my-5 overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">
            <tbody>
              {rows.map((row, rowIndex) => {
                const isHeaderRow = hasColumnHeader && rowIndex === 0;
                return (
                  <tr
                    key={rowIndex}
                    className={
                      isHeaderRow
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "border-t border-gray-300 dark:border-gray-600"
                    }
                  >
                    {row.cells.map((cell: TableCell, cellIndex: number) => {
                      const CellTag = isHeaderRow ? "th" : "td";
                      return (
                        <CellTag
                          key={cellIndex}
                          className={`px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 ${
                            isHeaderRow ? "font-semibold" : ""
                          }`}
                        >
                          {cell.richText && cell.richText.length > 0 ? (
                            <RichTextRenderer items={cell.richText} />
                          ) : (
                            <span>{cell.fallbackText || ""}</span>
                          )}
                        </CellTag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      // 타입 안전성을 위한 exhaustive check
      // ContentBlockWithChildren의 모든 타입이 처리되었는지 확인
      console.warn("Unknown block type:", block);
      return null;
  }
}

function getHeadingClassName(level: number): string {
  const classMap: Record<number, string> = {
    1: "mt-10 mb-3 text-3xl font-bold",
    2: "mt-8 mb-3 text-2xl font-bold",
    3: "mt-6 mb-2 text-xl font-semibold",
    4: "mt-5 mb-2 text-lg font-semibold",
    5: "mt-4 mb-2 text-base font-semibold",
    6: "mt-4 mb-2 text-base font-semibold",
  };
  return classMap[level] || classMap[3];
}
