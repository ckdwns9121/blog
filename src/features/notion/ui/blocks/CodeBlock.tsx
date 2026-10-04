"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "next-themes";
import { withAccessibleContrast } from "./accessibleTheme";

// oneLight 는 함수·문자열·주석 색이 WCAG AA(4.5:1)에 못 미친다. 색상은 두고 명도만 보정한 사본을 쓴다.
const accessibleOneLight = withAccessibleContrast(oneLight);
const accessibleOneDark = withAccessibleContrast(oneDark);

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
  // theme 은 "system" 일 수 있다. 실제로 적용된 값은 resolvedTheme 이다.
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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

  // 긴 코드는 가로로 스크롤된다. 스크롤 영역은 키보드로도 초점을 받을 수 있어야
  // 마우스 없이 좌우로 움직일 수 있다 (axe: scrollable-region-focusable).
  // 컴포넌트 정의를 렌더마다 새로 만들면 React 가 <pre> 를 매번 다시 마운트해서
  // 복사 버튼을 누르거나 테마가 바뀔 때 초점과 가로 스크롤 위치가 날아간다.
  // 언어가 바뀔 때만 새로 만든다.
  const preLabel = `${normalizedLanguage} 코드`;
  const FocusablePre = useMemo(
    () =>
      function FocusablePre(props: ComponentPropsWithoutRef<"pre">) {
        return <pre {...props} tabIndex={0} role="group" aria-label={preLabel} />;
      },
    [preLabel],
  );

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
        style={isDark ? accessibleOneDark : accessibleOneLight}
        className="!m-0"
        customStyle={{ borderRadius: 0 }}
        showLineNumbers={false}
        wrapLines={true}
        PreTag={FocusablePre}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
