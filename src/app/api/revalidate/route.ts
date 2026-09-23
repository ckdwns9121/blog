import { timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAllPosts } from "@/entities/post/api";
import "@/app/init-post-api";

/**
 * 온디맨드 재검증 엔드포인트.
 *
 * 글 페이지는 시간 기반 재검증(ISR)을 쓰지 않는다. 재검증 시점을 트래픽에 맡기면
 * 방문자가 오는 순간마다 Notion을 호출하게 되고, 한도에 걸리면 라이브 페이지가
 * 망가진다. 대신 이 엔드포인트가 "무엇이 바뀌었는지"를 한 번 확인하고
 * 해당 경로만 무효화한다. 실제 렌더링은 다음 방문자가 올 때 일어난다.
 *
 * 호출 방법:
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   {}                      최근 수정된 글 + 목록 페이지
 *   { "slug": "..." }       특정 글 + 목록 페이지
 *   { "lookbackHours": 48 } 되돌아볼 기간 조정 (기본 24시간)
 *
 * 되돌아보는 기간을 크론 주기보다 넉넉히 잡는 이유는, 실행이 한 번 걸러져도
 * 다음 회차가 놓친 구간을 덮도록 하기 위해서다. 재검증은 멱등이라 겹쳐도 안전하다.
 */

export const dynamic = "force-dynamic";

/** 글이 추가·수정되면 함께 바뀌는 목록성 경로 */
const LIST_PATHS = ["/", "/tags", "/feed.xml", "/atom.xml", "/feed.json", "/sitemap.xml"] as const;

const DEFAULT_LOOKBACK_HOURS = 24;
const MAX_LOOKBACK_HOURS = 24 * 30;

interface RevalidateRequestBody {
  slug?: unknown;
  lookbackHours?: unknown;
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

function revalidateAll(paths: readonly string[]): string[] {
  for (const path of paths) {
    revalidatePath(path);
  }
  return [...paths];
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await readBody(request);

  // 특정 글만 갱신하는 경로. 목록 조회 없이 끝나므로 Notion을 부르지 않는다.
  if (typeof body.slug === "string" && body.slug.trim()) {
    const slug = body.slug.trim();
    const revalidated = revalidateAll([`/posts/${slug}`, ...LIST_PATHS]);
    return NextResponse.json({ revalidated, posts: 1, reason: "slug" });
  }

  const lookbackHours = resolveLookbackHours(body.lookbackHours);

  let posts;
  try {
    posts = await getAllPosts();
  } catch (error) {
    // 목록을 못 받으면 무엇이 바뀌었는지 알 수 없다. 이때 경로를 무효화하면
    // 다음 방문자가 실패하는 렌더링을 떠안게 되므로, 아무것도 건드리지 않고
    // 실패를 알린다. 호출한 크론이 실패로 기록한다.
    console.error("Revalidation aborted because the post list could not be loaded:", error);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 502 });
  }

  const threshold = Date.now() - lookbackHours * 60 * 60 * 1000;
  const changedPaths = posts
    .filter((post) => post.updatedAt.getTime() >= threshold)
    .map((post) => `/posts/${post.slug}`);

  const revalidated = revalidateAll([...changedPaths, ...LIST_PATHS]);

  return NextResponse.json({
    revalidated,
    posts: changedPaths.length,
    lookbackHours,
    reason: "recent",
  });
}
