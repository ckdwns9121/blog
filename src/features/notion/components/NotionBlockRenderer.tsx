import React from "react";
import type { NotionBlock } from "../types";
import { parseNotionBlock } from "../utils/blockMapper";
import { RichTextRenderer } from "./RichTextRenderer";
import { CodeBlock, ImageWithModal, VideoBlock } from "./blocks";

interface NotionBlockRendererProps {
  block: NotionBlock;
  headingId?: string;
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
        return <p className="mb-2 leading-relaxed" style={{ minHeight: "1em" }}></p>;
      }
      return <p className="mb-2 leading-relaxed text-gray-700 dark:text-gray-300">{renderContent()}</p>;

    case "heading_1":
      return (
        <h1
          id={headingId}
          className="mt-12 mb-6 text-3xl font-bold text-gray-900 dark:text-white scroll-mt-20 first:mt-0"
        >
          {renderContent()}
        </h1>
      );

    case "heading_2":
      return (
        <h2
          id={headingId}
          className="mt-10 mb-5 text-2xl font-semibold text-gray-900 dark:text-white scroll-mt-20 first:mt-0"
        >
          {renderContent()}
        </h2>
      );

    case "heading_3":
      return (
        <h3
          id={headingId}
          className="mt-8 mb-4 text-xl font-medium text-gray-900 dark:text-white scroll-mt-20 first:mt-0"
        >
          {renderContent()}
        </h3>
      );

    case "bulleted_list_item":
      return <li className="text-gray-700 dark:text-gray-300">{renderContent()}</li>;

    case "numbered_list_item":
      return <li className="text-gray-700 dark:text-gray-300">{renderContent()}</li>;

    case "code":
      return <CodeBlock code={parsed.code} language={parsed.language} />;

    case "quote":
      return (
        <blockquote className="mb-4 border-l-4 border-primary-500 pl-4 italic text-gray-600 dark:text-gray-400">
          {renderContent()}
        </blockquote>
      );

    case "video":
      return <VideoBlock url={parsed.url} caption={parsed.caption} />;

    case "divider":
      return <hr className="my-8 border-gray-300 dark:border-gray-600" />;

    case "image":
      return <ImageWithModal url={parsed.url} caption={parsed.caption} />;

    case "bookmark":
      return (
        <a
          href={parsed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-4 block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 text-2xl">🔗</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">{parsed.url}</div>
              {parsed.caption && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{parsed.caption}</div>}
            </div>
            <div className="flex-shrink-0 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </div>
          </div>
        </a>
      );

    case "default":
      return <div className="mb-4 text-gray-700 dark:text-gray-300">{renderContent()}</div>;
  }
}
