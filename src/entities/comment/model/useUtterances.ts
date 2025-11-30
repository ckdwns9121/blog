import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { loadUtterancesScript, updateUtterancesTheme, isUtterancesLoaded } from "../api";

export interface UtterancesConfig {
  repo: string;
  issueTerm?: "pathname" | "url" | "title" | "og:title";
  label?: string;
}

/**
 * 테마를 Utterances 테마 형식으로 변환
 */
function getUtterancesTheme(theme: string | undefined): string {
  return theme === "dark" ? "github-dark" : "github-light";
}

/**
 * Utterances 댓글 시스템을 초기화하고 테마를 관리하는 훅
 */
export function useUtterances(config: UtterancesConfig) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const currentTheme = theme === "system" ? resolvedTheme : theme;
    const utterancesTheme = getUtterancesTheme(currentTheme);

    // iframe이 이미 있으면 테마만 변경
    if (isUtterancesLoaded()) {
      updateUtterancesTheme(utterancesTheme);
      return;
    }

    // iframe이 없으면 초기 로드
    loadUtterancesScript(containerRef.current, {
      repo: config.repo,
      issueTerm: config.issueTerm || "pathname",
      label: config.label || "Comment",
      theme: utterancesTheme,
    });
  }, [config.repo, config.issueTerm, config.label, theme, resolvedTheme]);

  return containerRef;
}
