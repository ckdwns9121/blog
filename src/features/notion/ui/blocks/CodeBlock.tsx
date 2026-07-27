"use client";

import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

interface CodeBlockProps {
  code: string;
  language: string;
}

// Notion의 언어 문자열 중 refractor(Prism)에 별칭으로 등록되지 않은 것들을 매핑한다.
// 매핑하지 않으면 refractor.highlight가 내부적으로 실패해 하이라이팅 없이 렌더링된다.
const NOTION_LANGUAGE_TO_PRISM: Record<string, string> = {
  "c++": "cpp",
  "c#": "csharp",
  "objective-c": "objectivec",
};

function normalizeLanguage(language: string): string {
  return NOTION_LANGUAGE_TO_PRISM[language] ?? language;
}

/**
 * 코드 블록을 렌더링하는 컴포넌트
 */
export function CodeBlock({ code, language }: CodeBlockProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="my-5 overflow-hidden rounded-lg">
      <SyntaxHighlighter
        language={normalizeLanguage(language)}
        style={isDark ? oneDark : oneLight}
        className="!m-0"
        showLineNumbers={false}
        wrapLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
