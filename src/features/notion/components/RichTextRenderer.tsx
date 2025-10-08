import React from "react";
import type { RichTextItem } from "../types";

interface RichTextRendererProps {
  items: RichTextItem[];
}

/**
 * Notion의 Rich Text 아이템을 렌더링하는 컴포넌트
 * 볼드, 이탤릭, 링크 등의 스타일을 처리
 */
export function RichTextRenderer({ items }: RichTextRendererProps) {
  return (
    <>
      {items.map((item, index) => (
        <RichTextItem key={index} item={item} />
      ))}
    </>
  );
}

interface RichTextItemProps {
  item: RichTextItem;
}

function RichTextItem({ item }: RichTextItemProps) {
  let text: React.ReactNode = item.plain_text || "";
  const annotations = item.annotations;

  // 텍스트 스타일 적용
  if (annotations) {
    if (annotations.bold) {
      text = <strong>{text}</strong>;
    }
    if (annotations.italic) {
      text = <em>{text}</em>;
    }
    if (annotations.strikethrough) {
      text = <s>{text}</s>;
    }
    if (annotations.underline) {
      text = <u>{text}</u>;
    }
    if (annotations.code) {
      text = (
        <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-red-600 dark:text-red-400">
          {text}
        </code>
      );
    }
  }

  // 하이퍼링크가 있는 경우
  if (item.href) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
      >
        {text}
      </a>
    );
  }

  return <span>{text}</span>;
}
