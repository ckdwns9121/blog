"use client";

import React, { useEffect, useRef, useState } from "react";
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
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizedLanguage = normalizeLanguage(language);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }

    setCopied(true);

    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex h-10 items-center justify-between border-b border-gray-200 px-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
        <span className="font-mono">{normalizedLanguage}</span>
        <button
          type="button"
          onClick={copyCode}
          className="rounded px-2 py-1 font-medium transition-colors hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label={copied ? "코드 복사 완료" : "코드 복사"}
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      <SyntaxHighlighter
        language={normalizedLanguage}
        style={isDark ? oneDark : oneLight}
        className="!m-0"
        customStyle={{ borderRadius: 0 }}
        showLineNumbers={false}
        wrapLines={true}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
