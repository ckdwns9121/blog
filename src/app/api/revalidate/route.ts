import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
// 배럴(@/features/notion)은 UI 컴포넌트까지 끌고 오므로 서비스 모듈을 직접 가져온다.
import { getAllPosts } from "@/features/notion/service/notion-client";
import type { NotionPost } from "@/features/notion/types";
import { noteSlug } from "@/entities/note/api";
import { getRedisClient } from "@/shared/utils/redis";
import "@/app/init-post-api";

/**
 * 온디맨드 재검증 엔드포인트.
 *
 * 글 페이지는 시간 기반 재검증(ISR)을 쓰지 않는다. 재검증 시점을 트래픽에 맡기면
 * 방문자가 오는 순간마다 Notion을 호출하게 되고, 한도에 걸리면 라이브 페이지가
 * 망가진다. 대신 이 엔드포인트가 "무엇이 바뀌었는지"를 한 번 확인하고
 * 해당 경로만 무효화한다. 실제 렌더링은 다음 방문자가 올 때 일어난다.
 *
 * Next 15의 revalidatePath는 캐시를 "지우는" 방식이라, 지운 뒤 첫 방문자가 Notion
 * 호출을 포함한 렌더(2~4초)를 그대로 기다린다. 그래서 두 가지를 지킨다.
 *   1. 같은 수정을 두 번 지우지 않는다. 글마다 마지막으로 지운 updatedAt 을 Redis 에
 *      적어 두고, 값이 같으면 건너뛴다. 되돌아보는 기간(24시간) 안에 크론이 여러 번
 *      돌아도 한 번만 지운다.
 *   2. 지운 직후에는 호출한 쪽(.github/workflows/revalidate.yaml)이 그 경로를 한 번씩
 *      요청해 캐시를 다시 채운다. 응답의 revalidated 목록이 그 입력이다.
 *
 * 글과 노트는 같은 Notion 데이터베이스에 있고 type 속성으로만 갈린다. 그래서 변경 감지는
 * 노트를 걸러내지 않는 features/notion 의 getAllPosts 로 한다. (entities/post 의 getAllPosts 는
 * 노트를 빼고 돌려주므로, 그걸 쓰면 노트만 새로 썼을 때 아무것도 갱신되지 않는다.)
 * 노트가 바뀌면 그 노트와 /notes 만 지운다. 홈·피드·사이트맵에는 노트가 실리지 않는다.
 *
 * 호출 방법:
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   {}                      최근 수정된 글·노트 + 해당 목록 페이지. 지울 것이 없으면 아무것도 지우지 않는다
 *   { "slug": "..." }       특정 글 + 글 목록 페이지 (장부와 무관하게 항상 지운다)
 *   { "note": "..." }       특정 노트(주소의 slug) + /notes (장부와 무관하게 항상 지운다)
 *   { "lookbackHours": 48 } 되돌아볼 기간 조정 (기본 24시간)
 *
 * 되돌아보는 기간을 크론 주기보다 넉넉히 잡는 이유는, 실행이 한 번 걸러져도
 * 다음 회차가 놓친 구간을 덮도록 하기 위해서다. 재검증은 멱등이라 겹쳐도 안전하다.
 */

export const dynamic = "force-dynamic";

/** 글이 추가·수정되면 함께 바뀌는 목록성 경로 */
const POST_LIST_PATHS = ["/", "/tags", "/feed.xml", "/atom.xml", "/feed.json", "/sitemap.xml"] as const;

/** 노트가 추가·수정되면 함께 바뀌는 목록성 경로 */
const NOTE_LIST_PATHS = ["/notes"] as const;

const DEFAULT_LOOKBACK_HOURS = 24;
const MAX_LOOKBACK_HOURS = 24 * 30;

/** 페이지마다 마지막으로 지운 updatedAt(ISO)을 적어 두는 키. 글과 노트를 가리지 않도록 Notion 페이지 ID를 쓴다. */
const LEDGER_KEY_PREFIX = "revalidate:page:";

interface RevalidateRequestBody {
  slug?: unknown;
  note?: unknown;
  lookbackHours?: unknown;
}

/** 바뀐 Notion 페이지가 사이트의 어느 주소인지 */
function pathFor(page: NotionPost): string {
  return page.contentType === "note" ? `/notes/${noteSlug(page.title)}` : `/posts/${page.slug}`;
}

/** 바뀐 페이지들과 함께 지워야 할 목록 경로. 글이 하나라도 있으면 글 목록, 노트가 있으면 노트 목록. */
function listPathsFor(pages: NotionPost[]): string[] {
  const paths: string[] = [];
  if (pages.some((page) => page.contentType !== "note")) paths.push(...POST_LIST_PATHS);
  if (pages.some((page) => page.contentType === "note")) paths.push(...NOTE_LIST_PATHS);
  return paths;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";

  const expectedBytes = Buffer.from(secret);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length) return false;

  return timingSafeEqual(expectedBytes, providedBytes);
}

async function readBody(request: Request): Promise<RevalidateRequestBody> {
  try {
    const parsed: unknown = await request.json();
    return parsed && typeof parsed === "object" ? (parsed as RevalidateRequestBody) : {};
  } catch {
    // 본문 없이 호출하는 경우가 기본 사용법이다.
    return {};
  }
}

function resolveLookbackHours(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return DEFAULT_LOOKBACK_HOURS;
  }
  return Math.min(value, MAX_LOOKBACK_HOURS);
}

/**
 * 경로 하나를 지운다.
 *
 * 홈은 반드시 type "page"로 지운다. revalidatePath("/")는 "_N_T_/" 태그를 지우는데,
 * Vercel 에서는 이 호출 뒤 글 페이지 전부가 캐시에서 함께 삭제되는 것이 관찰됐다
 * (수정하지 않은 글이 x-vercel-cache: REVALIDATED 로 2~4초). "_N_T_/page" 는 홈에만
 * 붙는 태그라 다른 페이지를 건드리지 않는다. 나머지 경로의 태그는 다른 페이지 태그의
 * 접두사가 아니므로 그대로 둔다.
 */
function revalidateOne(path: string): void {
  if (path === "/") {
    revalidatePath("/", "page");
    return;
  }
  revalidatePath(path);
}

function revalidateAll(paths: readonly string[]): string[] {
  for (const path of paths) {
    revalidateOne(path);
  }
  return [...paths];
}

const ledgerKey = (pageId: string) => `${LEDGER_KEY_PREFIX}${pageId}`;

/**
 * 페이지별로 마지막에 지운 updatedAt 을 읽는다. 장부를 못 읽으면 null 을 돌려주고,
 * 호출한 쪽은 예전처럼 기간 안의 글을 전부 지운다. 장부는 비용을 줄이는 장치이지
 * 정확성의 조건이 아니라서, 없다고 재검증을 멈추면 안 된다.
 */
async function readLedger(pageIds: string[]): Promise<Map<string, string> | null> {
  if (pageIds.length === 0) return new Map();

  try {
    const redis = await getRedisClient();
    const values = await redis.mGet(pageIds.map(ledgerKey));
    const ledger = new Map<string, string>();
    pageIds.forEach((pageId, index) => {
      const value = values[index];
      if (typeof value === "string" && value) ledger.set(pageId, value);
    });
    return ledger;
  } catch (error) {
    console.error("Revalidation ledger unavailable; revalidating every recently edited post:", error);
    return null;
  }
}

async function writeLedger(entries: Array<readonly [pageId: string, updatedAt: string]>): Promise<void> {
  if (entries.length === 0) return;

  try {
    const redis = await getRedisClient();
    await Promise.all(entries.map(([pageId, updatedAt]) => redis.set(ledgerKey(pageId), updatedAt)));
  } catch (error) {
    // 기록에 실패하면 다음 회차가 같은 글을 한 번 더 지울 뿐이다. 응답은 실패시키지 않는다.
    console.error("Failed to record revalidated posts:", error);
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readBody(request);

  // 특정 글만 갱신하는 경로. 목록 조회 없이 끝나므로 Notion을 부르지 않는다.
  if (typeof body.slug === "string" && body.slug.trim()) {
    const slug = body.slug.trim();
    const revalidated = revalidateAll([`/posts/${slug}`, ...POST_LIST_PATHS]);
    return NextResponse.json({ revalidated, posts: 1, reason: "slug" });
  }

  // 특정 노트만 갱신하는 경로. 주소에 쓰인 slug 를 그대로 받는다.
  if (typeof body.note === "string" && body.note.trim()) {
    const slug = body.note.trim();
    const revalidated = revalidateAll([`/notes/${slug}`, ...NOTE_LIST_PATHS]);
    return NextResponse.json({ revalidated, posts: 1, reason: "note" });
  }

  const lookbackHours = resolveLookbackHours(body.lookbackHours);

  let pages: NotionPost[];
  try {
    pages = await getAllPosts();
  } catch (error) {
    // 목록을 못 받으면 무엇이 바뀌었는지 알 수 없다. 이때 경로를 무효화하면
    // 다음 방문자가 실패하는 렌더링을 떠안게 되므로, 아무것도 건드리지 않고
    // 실패를 알린다. 호출한 크론이 실패로 기록한다.
    console.error("Revalidation aborted because the post list could not be loaded:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 502 });
  }

  const threshold = Date.now() - lookbackHours * 60 * 60 * 1000;
  const recentPages = pages.filter((page) => new Date(page.updatedAt).getTime() >= threshold);

  // 이미 같은 수정으로 지운 페이지는 건너뛴다. 장부가 없으면 전부 지운다.
  const ledger = await readLedger(recentPages.map((page) => page.id));
  const changedPages = ledger ? recentPages.filter((page) => ledger.get(page.id) !== page.updatedAt) : recentPages;
  const skipped = recentPages.length - changedPages.length;

  // 지울 것이 없으면 목록도 지우지 않는다. 지우면 다음 방문자가 다시 렌더를 기다린다.
  // 삭제·비공개 전환은 updatedAt으로 잡히지 않으니 slug 나 note 를 지정해 수동으로 실행한다.
  if (changedPages.length === 0) {
    return NextResponse.json({ revalidated: [], posts: 0, skipped, lookbackHours, reason: "recent" });
  }

  const revalidated = revalidateAll([...changedPages.map(pathFor), ...listPathsFor(changedPages)]);

  if (ledger) {
    await writeLedger(changedPages.map((page) => [page.id, page.updatedAt] as const));
  }

  return NextResponse.json({
    revalidated,
    posts: changedPages.length,
    skipped,
    lookbackHours,
    reason: "recent",
  });
}
