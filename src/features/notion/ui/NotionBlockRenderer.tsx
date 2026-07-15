import React from "react";
import type { NotionBlock } from "../types";
import { parseNotionBlock } from "../utils/blockMapper";
import { RichTextRenderer } from "./RichTextRenderer";
import { CodeBlock, ImageWithModal, VideoBlock } from "./blocks";
import type { TableCell } from "@/shared/types/content";

interface NotionBlockRendererProps {
  block: NotionBlock;
  headingId?: string;
}

/**
 * 테이블 셀 렌더링 헬퍼 함수
 */
function renderTableCell(cell: TableCell): React.ReactNode {
  if (cell.richText.length > 0) {
    return <RichTextRenderer items={cell.richText} />;
  }
  return cell.fallbackText;
}

/**
 * 단일 Notion 블록을 렌더링하는 컴포넌트
 * Parser에서 변환된 데이터를 받아서 UI로 렌더링만 담당
 */
export function NotionBlockRenderer({ block, headingId }: NotionBlockRendererProps) {
  const parsed = parseNotionBlock(block);

  const renderContent = () => {
    if ("richText" in parsed && parsed.richText.length > 0) {
      return <RichTextRenderer items={parsed.richText} />;
    }
    if ("fallbackText" in parsed) {
      return parsed.fallbackText;
    }
    return null;
  };

  // 빈 paragraph 블록인 경우 체크
  const isEmpty = "richText" in parsed && parsed.richText.length === 0;

  switch (parsed.type) {
    case "paragraph":
      // 빈 줄바꿈 블록도 공간을 차지하도록 처리 (Notion과 동일하게 min-height 적용)
      if (isEmpty) {
        return <p className="mb-3 leading-relaxed" style={{ minHeight: "1em" }}></p>;
      }
      return <p className="mb-3 leading-relaxed text-gray-700 dark:text-gray-300">{renderContent()}</p>;

    case "heading_1":
      return (
        <h1
          id={headingId}
          className="mt-14 mb-7 text-3xl font-bold text-gray-900 dark:text-white scroll-mt-20 first:mt-0"
        >
          {renderContent()}
        </h1>
      );

    case "heading_2":
      return (
        <h2
          id={headingId}
          className="mt-11 mb-6 text-2xl font-semibold text-gray-900 dark:text-white scroll-mt-20 first:mt-0"
        >
          {renderContent()}
        </h2>
      );

    case "heading_3":
      return (
        <h3
          id={headingId}
          className="mt-9 mb-5 text-xl font-medium text-gray-900 dark:text-white scroll-mt-20 first:mt-0"
        >
          {renderContent()}
        </h3>
      );

    case "bulleted_list_item":
      return <li className="mb-1 text-gray-700 dark:text-gray-300">{renderContent()}</li>;

    case "numbered_list_item":
      return <li className="mb-1 text-gray-700 dark:text-gray-300">{renderContent()}</li>;

    case "code":
      return (
        <div className="my-4">
          <CodeBlock code={parsed.code} language={parsed.language} />
        </div>
      );

    case "quote":
      return (
        <blockquote className="my-5 border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400">
          {renderContent()}
          {block.children && block.children.map((child) => (
            <NotionBlockRenderer key={child.id} block={child} />
          ))}
        </blockquote>
      );

    case "video":
      return (
        <div className="my-4">
          <VideoBlock url={parsed.url} caption={parsed.caption} />
        </div>
      );

    case "divider":
      return <hr className="my-9 border-gray-300 dark:border-gray-600" />;

    case "image":
      return (
        <div className="my-4">
          <ImageWithModal url={parsed.url} caption={parsed.caption} />
        </div>
      );

    case "bookmark":
      return (
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-5 block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div aria-hidden="true" className="flex-shrink-0 text-2xl">🔗</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">{parsed.url}</div>
              {parsed.caption && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{parsed.caption}</div>}
            </div>
            <div className="flex-shrink-0 text-gray-400">
              <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </div>
          <span className="sr-only"> (새 탭에서 열림)</span>
        </a>
      );

    case "table": {
      const { rows, hasColumnHeader } = parsed;
      if (!rows || rows.length === 0) {
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
                    className={isHeaderRow ? "bg-gray-100 dark:bg-gray-800" : "border-t border-gray-300 dark:border-gray-600"}
                  >
                    {row.cells.map((cell, cellIndex) => {
                      const CellTag = isHeaderRow ? "th" : "td";
                      return (
                        <CellTag
                          key={cellIndex}
                          className={`px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 ${
                            isHeaderRow ? "font-semibold" : ""
                          }`}
                        >
                          {renderTableCell(cell)}
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

    case "default":
      return <div className="mb-4 text-gray-700 dark:text-gray-300">{renderContent()}</div>;
  }
}
