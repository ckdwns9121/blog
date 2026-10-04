"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { CodeBlock } from "../CodeBlock";
import { buildSandboxSpec } from "./sandboxSpec";

interface SandpackBlockProps {
  code: string;
  language: string;
  caption?: string;
}

// Sandpack 은 수백 KB 다. 코드 블록이 화면 가까이 올 때까지는 내려받지 않는다.
// 서버에서는 그리지 않고, 정적 HTML 에는 하이라이트된 코드가 그대로 들어가므로
// 검색엔진과 JS 없는 환경은 지금과 같은 것을 본다.
const SandpackPlayground = dynamic(() => import("./SandpackPlayground"), { ssr: false });

/**
 * 캡션이 `sandbox` 인 코드 블록. 처음에는 평범한 코드 블록으로 보이다가, 화면에
 * 들어오면 편집·실행할 수 있는 플레이그라운드로 바뀐다.
 */
export function SandpackBlock({ code, language, caption }: SandpackBlockProps) {
  const spec = buildSandboxSpec(caption, language, code);
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLElement>(null);
  const [isNear, setIsNear] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || isNear) return;

    // 지원하지 않는 환경에서는 바로 불러온다.
    if (typeof IntersectionObserver === "undefined") {
      setIsNear(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNear(true);
          observer.disconnect();
        }
      },
      // 스크롤이 닿기 한 화면 전에 미리 받아 두면 보일 때쯤 준비가 끝난다.
      { rootMargin: "100% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isNear]);

  if (!spec) {
    return <CodeBlock code={code} language={language} />;
  }

  if ("error" in spec) {
    return (
      <>
        <p role="alert" className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {spec.error}
        </p>
        <CodeBlock code={code} language={language} />
      </>
    );
  }

  return (
    <section ref={containerRef} aria-label="편집하고 실행해 볼 수 있는 코드 예제" className="my-5">
      {isNear ? (
        <SandpackPlayground spec={spec} isDark={resolvedTheme === "dark"} />
      ) : (
        <CodeBlock code={code} language={language} />
      )}
    </section>
  );
}
