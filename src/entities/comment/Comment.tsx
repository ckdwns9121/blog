"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface CommentProps {
  repo: string;
  issueTerm?: "pathname" | "url" | "title" | "og:title";
  label?: string;
}

export default function Comment({ repo, issueTerm = "pathname", label = "Comment" }: CommentProps) {
  const commentRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (!commentRef.current) return;

    const currentTheme = theme === "system" ? resolvedTheme : theme;
    const utterancesTheme = currentTheme === "dark" ? "github-dark" : "github-light";

    // iframe이 이미 있으면 테마만 변경
    const iframe = document.querySelector<HTMLIFrameElement>(".utterances-frame");
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "set-theme", theme: utterancesTheme }, "https://utteranc.es");
      return;
    }

    // iframe이 없으면 초기 로드
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
