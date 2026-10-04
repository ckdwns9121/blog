import type { SandpackThemeProp } from "@codesandbox/sandpack-react";

/**
 * Sandpack 테마. 기본 light/dark 테마는 탭(#808080, 3.9:1), 줄 번호(#c5c5c5, 1.7:1),
 * 일부 구문 색(#85a600, 2.8:1)이 WCAG AA 에 못 미친다. 블로그 팔레트에 맞춘 색으로
 * 바꾸되 모든 글자색이 배경(surface1) 대비 4.5:1 을 넘기게 한다. 수치는
 * sandpackTheme.test.ts 가 지킨다.
 *
 * surface1 만 넘겨도 Sandpack 이 밝기를 보고 light/dark 기본값을 채워 주므로,
 * 여기서는 바꿔야 할 토큰만 적는다.
 */
export const lightSandpackTheme = {
  colors: {
    surface1: "#ffffff",
    surface2: "#f6f7f6",
    surface3: "#eef0ef",
    base: "#16181a",
    clickable: "#5b6360",
    hover: "#16181a",
    disabled: "#687069",
    accent: "#1d4ed8",
  },
  syntax: {
    plain: "#16181a",
    comment: { color: "#6b7280", fontStyle: "italic" },
    keyword: "#7c3aed",
    tag: "#c2410c",
    punctuation: "#4b5563",
    definition: "#3f6212",
    property: "#0f766e",
    static: "#b91c1c",
    string: "#15803d",
  },
} satisfies SandpackThemeProp;

export const darkSandpackTheme = {
  colors: {
    surface1: "#0f1419",
    surface2: "#161c23",
    surface3: "#1f262e",
    base: "#e5e5e5",
    clickable: "#a3a3a3",
    hover: "#ffffff",
    disabled: "#8a8a8a",
    accent: "#60a5fa",
  },
  syntax: {
    plain: "#e8eaed",
    comment: { color: "#9ca3af", fontStyle: "italic" },
    keyword: "#c4b5fd",
    tag: "#fdba74",
    punctuation: "#d4d4d4",
    definition: "#a3e635",
    property: "#5eead4",
    static: "#f87171",
    string: "#86efac",
  },
} satisfies SandpackThemeProp;
