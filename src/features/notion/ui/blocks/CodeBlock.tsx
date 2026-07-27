"use client";

import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

interface CodeBlockProps {
  code: string;
  language: string;
}

// Notion API의 언어 이름과 Prism이 인식하는 언어 키가 다른 경우 매핑
const PRISM_LANGUAGE_MAP: Record<string, string> = {
  "c++": "cpp",
  "c#": "csharp",
  "f#": "fsharp",
  "objective-c": "objectivec",
  "plain text": "text",
  shell: "bash",
  "vb.net": "vbnet",
};

function normalizeLanguage(language: string): string {
  const lower = language.toLowerCase();
  return PRISM_LANGUAGE_MAP[lower] ?? lower;
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
