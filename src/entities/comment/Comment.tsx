"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface CommentProps {
  repo: string;
  issueTerm?: "pathname" | "url" | "title" | "og:title";
  label?: string;
  theme?: string;
}

export default function Comment({ repo, issueTerm = "pathname", label = "Comment" }: CommentProps) {
  const commentRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (!commentRef.current) return;

    // 기존 스크립트 제거
    const existingScript = commentRef.current.querySelector("script");
    if (existingScript) {
      commentRef.current.removeChild(existingScript);
    }

    // utterances 테마 결정
    const currentTheme = theme === "system" ? resolvedTheme : theme;
    const utterancesTheme = currentTheme === "dark" ? "github-dark" : "github-light";

    // 새 스크립트 생성
    const script = document.createElement("script");
    script.src = "https://utteranc.es/client.js";
    script.setAttribute("repo", repo);
    script.setAttribute("issue-term", issueTerm);
    script.setAttribute("label", label);
    script.setAttribute("theme", utterancesTheme);
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    commentRef.current.appendChild(script);
  }, [repo, issueTerm, label, theme, resolvedTheme]);

  return <div ref={commentRef} className="mt-8" />;
}
