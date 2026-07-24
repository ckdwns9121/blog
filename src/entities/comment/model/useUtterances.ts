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
  const hasInitializedRef = useRef(false);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const currentTheme = theme === "system" ? resolvedTheme : theme;
    const utterancesTheme = getUtterancesTheme(currentTheme);

    // 테마 변경은 기존 위젯에만 전달한다. 스크립트가 iframe을 만들기 전에도
    // 초기화 여부를 기억해 중복 요청을 만들지 않는다.
    if (hasInitializedRef.current) {
      updateUtterancesTheme(containerRef.current, utterancesTheme);
      return;
    }

    // 서버 렌더링이나 이전 실행으로 이 컨테이너에 iframe이 있으면 재사용한다.
    if (isUtterancesLoaded(containerRef.current)) {
      hasInitializedRef.current = true;
      updateUtterancesTheme(containerRef.current, utterancesTheme);
      return;
    }

    // 컨테이너별로 한 번만 초기 로드
    loadUtterancesScript(containerRef.current, {
      repo: config.repo,
      issueTerm: config.issueTerm || "pathname",
      label: config.label || "Comment",
      theme: utterancesTheme,
    });
    hasInitializedRef.current = true;
  }, [config.repo, config.issueTerm, config.label, theme, resolvedTheme]);

  return containerRef;
}
