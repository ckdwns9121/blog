import React from "react";
import type { NotionBlock } from "@/shared/types/notion";
import { parseNotionBlock } from "@/shared/utils/notionBlockMapper";
import { RichTextRenderer } from "./RichTextRenderer";
import { CodeBlock, ImageBlock, VideoBlock } from "./blocks";

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

  switch (parsed.type) {
    case "paragraph":
      return <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{renderContent()}</p>;

    case "heading_1":
      return (
        <h1 id={headingId} className="mb-6 text-3xl font-bold text-gray-900 dark:text-white scroll-mt-20">
          {renderContent()}
        </h1>
      );

    case "heading_2":
      return (
        <h2 id={headingId} className="mb-5 text-2xl font-semibold text-gray-900 dark:text-white scroll-mt-20">
          {renderContent()}
        </h2>
      );

    case "heading_3":
      return (
        <h3 id={headingId} className="mb-4 text-xl font-medium text-gray-900 dark:text-white scroll-mt-20">
          {renderContent()}
        </h3>
      );

    case "bulleted_list_item":
      return <li className="mb-2 ml-4 list-disc text-gray-700 dark:text-gray-300">{renderContent()}</li>;

    case "numbered_list_item":
      return <li className="mb-2 ml-4 list-decimal text-gray-700 dark:text-gray-300">{renderContent()}</li>;

    case "code":
      return <CodeBlock code={parsed.code} language={parsed.language} />;

    case "quote":
      return (
        <blockquote className="mb-4 border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">
          {renderContent()}
        </blockquote>
      );

    case "video":
      return <VideoBlock url={parsed.url} caption={parsed.caption} />;

    case "divider":
      return <hr className="my-8 border-gray-300 dark:border-gray-600" />;

    case "image":
      return <ImageBlock url={parsed.url} caption={parsed.caption} />;

    case "default":
      return <div className="mb-4 text-gray-700 dark:text-gray-300">{renderContent()}</div>;
  }
}
