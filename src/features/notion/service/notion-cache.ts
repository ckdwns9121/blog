import type { NotionBlock } from "../types";

/**
 * Notion API 응답을 디스크에 캐싱하는 레이어.
 *
 * 핵심 아이디어:
 * - 페이지의 `last_edited_time`을 캐시 키로 사용
 * - 캐시된 값과 일치하면 API를 호출하지 않고 디스크에서 읽음
 * - 로컬/CI 빌드 시간을 극적으로 단축
 *
 * 캐시 구조:
 *   .cache/notion/
 *   └── pages/{pageId}.json   { lastEditedTime, blocks }
 *
 * 주의: Edge Runtime(opengraph-image 등)에서는 fs/path를 사용할 수 없으므로
 * Node 런타임에서만 동작하고, Edge에서는 자동으로 no-op가 됩니다.
 */

interface PageBlocksCacheEntry {
  lastEditedTime: string;
  blocks: NotionBlock[];
}

// Node 런타임에서만 fs/path 모듈 로드 (eval로 webpack 정적 분석 회피)
function getNodeModules(): { fs: typeof import("fs"); path: typeof import("path") } | null {
  if (typeof process === "undefined" || !process.versions?.node) return null;
  // @ts-expect-error - EdgeRuntime은 Edge 환경에서만 정의됨
  if (typeof EdgeRuntime !== "undefined") return null;
  try {
    // eval을 사용해 webpack이 fs/path를 번들에 포함하지 않도록 함
    const req = eval("require") as NodeRequire;
    return { fs: req("fs"), path: req("path") };
  } catch {
    return null;
  }
}

const CACHE_DISABLED = typeof process !== "undefined" && process.env.NOTION_CACHE_DISABLED === "true";

function getCachePaths() {
  const mods = getNodeModules();
  if (!mods) return null;
  const root = mods.path.join(process.cwd(), ".cache", "notion");
  return {
    fs: mods.fs,
    path: mods.path,
    root,
    pagesDir: mods.path.join(root, "pages"),
  };
}

function getPageCachePath(pageId: string): string | null {
  const ctx = getCachePaths();
  if (!ctx) return null;
  const safeId = pageId.replace(/-/g, "");
  return ctx.path.join(ctx.pagesDir, `${safeId}.json`);
}

/**
 * 캐시된 블록을 읽어옴.
 * lastEditedTime이 일치할 때만 반환, 그렇지 않으면 null.
 */
export function readPageBlocksCache(pageId: string, lastEditedTime: string): NotionBlock[] | null {
  if (CACHE_DISABLED) return null;
  const ctx = getCachePaths();
  if (!ctx) return null;

  const cachePath = getPageCachePath(pageId);
  if (!cachePath || !ctx.fs.existsSync(cachePath)) return null;

  try {
    const raw = ctx.fs.readFileSync(cachePath, "utf-8");
    const entry = JSON.parse(raw) as PageBlocksCacheEntry;
    if (entry.lastEditedTime === lastEditedTime) {
      return entry.blocks;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 블록을 디스크 캐시에 저장.
 */
export function writePageBlocksCache(pageId: string, lastEditedTime: string, blocks: NotionBlock[]): void {
  if (CACHE_DISABLED) return;
  const ctx = getCachePaths();
  if (!ctx) return;

  try {
    if (!ctx.fs.existsSync(ctx.pagesDir)) {
      ctx.fs.mkdirSync(ctx.pagesDir, { recursive: true });
    }
    const cachePath = getPageCachePath(pageId);
    if (!cachePath) return;

    const entry: PageBlocksCacheEntry = { lastEditedTime, blocks };
    ctx.fs.writeFileSync(cachePath, JSON.stringify(entry));
  } catch {
    // Vercel 서버리스 등 읽기 전용 파일시스템에서는 조용히 무시
  }
}

/**
 * 캐시 디렉터리 전체 삭제 (테스트/디버깅용).
 */
export function clearNotionCache(): void {
  const ctx = getCachePaths();
  if (!ctx) return;
  if (ctx.fs.existsSync(ctx.root)) {
    ctx.fs.rmSync(ctx.root, { recursive: true, force: true });
  }
}
