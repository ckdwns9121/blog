"use client";

import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";

interface CodeBlockProps {
  code: string;
  language: string;
}

/**
 * 코드 블록을 렌더링하는 컴포넌트
 */
export function CodeBlock({ code, language }: CodeBlockProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="mb-6 overflow-hidden rounded-lg">
      <SyntaxHighlighter
        language={language}
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
