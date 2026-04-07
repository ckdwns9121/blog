import fs from "fs";
import path from "path";
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
 */

const CACHE_ROOT = path.join(process.cwd(), ".cache", "notion");
const PAGES_DIR = path.join(CACHE_ROOT, "pages");

// 캐시 비활성화 환경 변수 (CI에서 강제 풀 빌드용)
const CACHE_DISABLED = process.env.NOTION_CACHE_DISABLED === "true";

interface PageBlocksCacheEntry {
  lastEditedTime: string;
  blocks: NotionBlock[];
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getPageCachePath(pageId: string): string {
  // pageId의 하이픈을 제거하여 파일명으로 사용
  const safeId = pageId.replace(/-/g, "");
  return path.join(PAGES_DIR, `${safeId}.json`);
}

/**
 * 캐시된 블록을 읽어옴.
 * lastEditedTime이 일치할 때만 반환, 그렇지 않으면 null.
 */
export function readPageBlocksCache(pageId: string, lastEditedTime: string): NotionBlock[] | null {
  if (CACHE_DISABLED) return null;

  const cachePath = getPageCachePath(pageId);
  if (!fs.existsSync(cachePath)) return null;

  try {
    const raw = fs.readFileSync(cachePath, "utf-8");
    const entry = JSON.parse(raw) as PageBlocksCacheEntry;
    if (entry.lastEditedTime === lastEditedTime) {
      return entry.blocks;
    }
    return null;
  } catch {
    // 파싱 실패 시 캐시 무효화
    return null;
  }
}

/**
 * 블록을 디스크 캐시에 저장.
 */
export function writePageBlocksCache(pageId: string, lastEditedTime: string, blocks: NotionBlock[]): void {
  if (CACHE_DISABLED) return;

  ensureDir(PAGES_DIR);
  const cachePath = getPageCachePath(pageId);
  const entry: PageBlocksCacheEntry = { lastEditedTime, blocks };
  fs.writeFileSync(cachePath, JSON.stringify(entry));
}

/**
 * 캐시 디렉터리 전체 삭제 (테스트/디버깅용).
 */
export function clearNotionCache(): void {
  if (fs.existsSync(CACHE_ROOT)) {
    fs.rmSync(CACHE_ROOT, { recursive: true, force: true });
  }
}
