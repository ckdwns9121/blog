/**
 * Notion 코드 블록을 실행 가능한 플레이그라운드(Sandpack)로 바꾸는 지시어 해석.
 *
 * 글쓴이는 Notion 에서 코드 블록 아래 캡션에 `sandbox` 라고만 적으면 된다.
 * 언어에 맞는 템플릿이 자동으로 골라지고, 코드 본문이 그 템플릿의 진입 파일이 된다.
 *
 *   sandbox              언어로 템플릿 추정 (tsx → react-ts, html → static ...)
 *   sandbox:react        템플릿 지정. react, react-ts, vanilla, vanilla-ts, static
 *
 * 파일 여러 개가 필요하면 코드 본문 안에서 `// @file /Button.tsx` 같은 줄로 나눈다.
 * 첫 번째 표식 앞의 내용은 진입 파일이다. `#`, `<!-- -->`, `/* *\/` 주석 형태도 받는다.
 */

export const SANDBOX_TEMPLATES = ["react", "react-ts", "vanilla", "vanilla-ts", "static"] as const;
export type SandboxTemplate = (typeof SANDBOX_TEMPLATES)[number];

export interface SandboxSpec {
  template: SandboxTemplate;
  /** 경로 → 내용. 경로는 항상 "/" 로 시작한다. */
  files: Record<string, string>;
  /** 에디터가 처음에 보여 줄 파일 */
  activeFile: string;
}

const ENTRY_FILE: Record<SandboxTemplate, string> = {
  react: "/App.js",
  "react-ts": "/App.tsx",
  vanilla: "/index.js",
  "vanilla-ts": "/index.ts",
  static: "/index.html",
};

const CAPTION_PATTERN = /^sandbox(?::([a-z-]+))?$/i;

/** 캡션이 플레이그라운드 지시어인지 본다. 아니면 null. 잘못된 템플릿 이름이면 에러 메시지를 돌려준다. */
export function parseSandboxCaption(
  caption: string | undefined,
): { template?: SandboxTemplate } | { error: string } | null {
  const match = caption?.trim().match(CAPTION_PATTERN);
  if (!match) return null;

  const template = match[1]?.toLowerCase();
  if (!template) return {};
  if ((SANDBOX_TEMPLATES as readonly string[]).includes(template)) {
    return { template: template as SandboxTemplate };
  }
  return { error: `알 수 없는 샌드박스 템플릿 "${template}". 쓸 수 있는 값: ${SANDBOX_TEMPLATES.join(", ")}` };
}

/** Notion 언어 이름으로 템플릿을 고른다. 모르면 react-ts. */
export function inferTemplate(language: string): SandboxTemplate {
  switch (language.toLowerCase()) {
    case "javascript":
    case "jsx":
      return "react";
    case "html":
      return "static";
    case "typescript":
    case "tsx":
    default:
      return "react-ts";
  }
}

const FILE_MARKER = /^\s*(?:\/\/|#|\/\*|<!--)\s*@file\s+(\S+)\s*(?:\*\/|-->)?\s*$/;

/** `@file` 표식으로 코드 본문을 파일들로 나눈다. 표식이 없으면 전체가 진입 파일이다. */
export function splitFiles(code: string, entryFile: string): Record<string, string> {
  const files: Record<string, string[]> = {};
  let current = entryFile;
  files[current] = [];

  for (const line of code.split("\n")) {
    const marker = line.match(FILE_MARKER);
    if (marker) {
      current = normalizePath(marker[1]);
      files[current] ??= [];
      continue;
    }
    files[current].push(line);
  }

  const result: Record<string, string> = {};
  for (const [path, lines] of Object.entries(files)) {
    const content = lines.join("\n").trim();
    // 진입 파일은 비어 있어도 남긴다. 템플릿이 그 파일을 기대하기 때문이다.
    if (content || path === entryFile) result[path] = content + (content ? "\n" : "");
  }
  return result;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

/** 캡션과 코드 본문으로 Sandpack 에 넘길 명세를 만든다. 지시어가 아니면 null. */
export function buildSandboxSpec(
  caption: string | undefined,
  language: string,
  code: string,
): SandboxSpec | { error: string } | null {
  const parsed = parseSandboxCaption(caption);
  if (!parsed) return null;
  if ("error" in parsed) return parsed;

  const template = parsed.template ?? inferTemplate(language);
  const entryFile = ENTRY_FILE[template];
  return { template, files: splitFiles(code, entryFile), activeFile: entryFile };
}
