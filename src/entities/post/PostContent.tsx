"use client";

import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import type { NotionBlock, CodeContent, ImageContent, TextContent, RichTextItem } from "../../types/notion";

interface PostContentProps {
  blocks: NotionBlock[];
  className?: string;
}

export default function PostContent({ blocks, className = "" }: PostContentProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const renderBlock = (block: NotionBlock): React.ReactNode => {
    const { type, content } = block;

    switch (type) {
      case "paragraph":
        return <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300">{extractText(content)}</p>;

      case "heading_1":
        return <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">{extractText(content)}</h1>;

      case "heading_2":
        return <h2 className="mb-5 text-2xl font-semibold text-gray-900 dark:text-white">{extractText(content)}</h2>;

      case "heading_3":
        return <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">{extractText(content)}</h3>;

      case "bulleted_list_item":
        return <li className="mb-2 ml-4 list-disc text-gray-700 dark:text-gray-300">{extractText(content)}</li>;

      case "numbered_list_item":
        return <li className="mb-2 ml-4 list-decimal text-gray-700 dark:text-gray-300">{extractText(content)}</li>;

      case "code":
        const codeContent = extractText(content);
        const language =
          typeof content === "object" && content !== null && "language" in content
            ? (content as CodeContent).language || "text"
            : "text";
        return (
          <div className="mb-6 overflow-hidden rounded-lg">
            <SyntaxHighlighter
              language={language}
              style={isDark ? oneDark : oneLight}
              className="!m-0"
              showLineNumbers={false}
              wrapLines={true}
            >
              {codeContent}
            </SyntaxHighlighter>
          </div>
        );

      case "quote":
        return (
          <blockquote className="mb-4 border-l-4 border-blue-500 pl-4 italic text-gray-600 dark:text-gray-400">
            {extractText(content)}
          </blockquote>
        );

      case "divider":
        return <hr className="my-8 border-gray-300 dark:border-gray-600" />;

      case "image":
        const imageContent =
          typeof content === "object" && content !== null && "url" in content ? (content as ImageContent) : null;
        const imageUrl = imageContent?.url;
        const imageCaption = imageContent?.caption;
        return (
          <figure className="mb-6">
            {imageUrl && <img src={imageUrl} alt={imageCaption || ""} className="w-full rounded-lg" />}
            {imageCaption && (
              <figcaption className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                {imageCaption}
              </figcaption>
            )}
          </figure>
        );

      default:
        return <div className="mb-4 text-gray-700 dark:text-gray-300">{extractText(content)}</div>;
    }
  };

  const extractText = (content: NotionBlock["content"]): string => {
    if (typeof content === "string") {
      return content;
    }
    if (typeof content === "object" && content !== null) {
      const textContent = content as TextContent;
      if ("text" in textContent && textContent.text) {
        return textContent.text;
      }
      if ("rich_text" in textContent && textContent.rich_text) {
        return textContent.rich_text.map((item: RichTextItem) => item.plain_text || "").join("");
      }
      if ("title" in textContent && textContent.title) {
        return textContent.title.map((item: RichTextItem) => item.plain_text || "").join("");
      }
    }
    return "";
  };

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {blocks.map((block, index) => (
        <div key={block.id || index}>
          {renderBlock(block)}
          {block.children && block.children.length > 0 && (
            <div className="ml-4">
              {block.children.map((child, childIndex) => (
                <div key={child.id || childIndex}>{renderBlock(child)}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
