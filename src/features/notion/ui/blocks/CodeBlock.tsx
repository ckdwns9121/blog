"use client";

import React, { useEffect, useRef, useState } from "react";
import { supportsHighlighting, tokenizeCode, type CodeToken } from "../../wasm/tokenizeCode";

interface CodeBlockProps {
  code: string;
  language: string;
}

export const TOKEN_COLORS: Record<CodeToken["type"], string> = {
  text: "",
  comment: "text-[#6b7280] dark:text-[#9ca3af]",
  string: "text-[#15803d] dark:text-[#86efac]",
  keyword: "text-[#7e22ce] dark:text-[#d8b4fe]",
  number: "text-[#b45309] dark:text-[#fcd34d]",
  literal: "text-[#b45309] dark:text-[#fcd34d]",
  function: "text-[#1d4ed8] dark:text-[#93c5fd]",
  type: "text-[#0e7490] dark:text-[#67e8f9]",
  tag: "text-[#be123c] dark:text-[#fda4af]",
  attr: "text-[#b45309] dark:text-[#fcd34d]",
};

/**
 * 코드 블록을 렌더링하는 컴포넌트
 */
export function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const normalizedLanguage = language.trim().toLowerCase();
  const [highlighted, setHighlighted] = useState<{ code: string; language: string; tokens: CodeToken[] }>();

  useEffect(() => {
    if (!supportsHighlighting(normalizedLanguage)) return;
    let active = true;
    void tokenizeCode(code, normalizedLanguage).then((tokens) => {
      if (active) setHighlighted({ code, language: normalizedLanguage, tokens });
    }).catch(() => {
      // Loading failures leave the original readable, copyable code in place.
    });
    return () => { active = false; };
  }, [code, normalizedLanguage]);

  const tokens = highlighted?.code === code && highlighted.language === normalizedLanguage
    ? highlighted.tokens
    : [{ type: "text" as const, value: code }];

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
      <div className="flex h-10 items-center justify-between border-b border-gray-200 px-3 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-400">
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
      <pre
        tabIndex={0}
        role="group"
        aria-label={`${normalizedLanguage} 코드`}
        className="m-0 overflow-x-auto p-4 text-sm leading-relaxed text-gray-800 dark:text-gray-200"
      >
        <code className="font-mono whitespace-pre">
          {tokens.map((token, index) => (
            <span key={index} className={TOKEN_COLORS[token.type] || undefined}>
              {token.value}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
