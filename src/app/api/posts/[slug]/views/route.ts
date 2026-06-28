import { NextRequest, NextResponse } from "next/server";
import { getClientIdentifier, getPostViewedKey, getRedisClient, getPostViewsKey } from "@/shared/utils/redis";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

let hasLoggedFetchViewsError = false;
let hasLoggedIncrementViewsError = false;

function logViewsErrorOnce(message: string, error: unknown, logged: boolean): boolean {
  if (logged) {
    return true;
  }

  if (process.env.NODE_ENV === "development") {
    const details = error instanceof Error ? error.message : String(error);
    console.warn(`${message}; returning fallback views. ${details}`);
  } else {
    console.error(message, error);
  }

  return true;
}

/**
 * GET /api/posts/[slug]/views
 * 포스트의 현재 조회수를 조회합니다.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const redis = await getRedisClient();
    const viewsKey = getPostViewsKey(slug);

    // 조회수 가져오기 (없으면 0)
    const views = (await redis.get(viewsKey)) || "0";

    return NextResponse.json({ views: Number(views) });
  } catch (error) {
    hasLoggedFetchViewsError = logViewsErrorOnce("Error fetching views", error, hasLoggedFetchViewsError);

    // Redis 연결 실패 시에도 에러를 반환하지 않고 0을 반환
    // (프로덕션에서는 로깅만 하고 사용자에게는 에러를 숨김)
    return NextResponse.json({ views: 0 });
  }
}

/**
 * POST /api/posts/[slug]/views
 * 포스트 조회수를 증가시킵니다.
 * 새로고침 시마다 조회수가 증가합니다.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const redis = await getRedisClient();
    const viewsKey = getPostViewsKey(slug);
    const identifier = getClientIdentifier(request);
    const viewedKey = getPostViewedKey(slug, identifier);

    const isNewView = await redis.set(viewedKey, "1", {
      EX: 60 * 60 * 24,
      NX: true,
    });

    if (!isNewView) {
      const currentViews = (await redis.get(viewsKey)) || "0";
      return NextResponse.json({
        views: Number(currentViews),
        isNewView: false,
      });
    }

    // 조회수 증가 (원자적 연산)
    const newViews = await redis.incr(viewsKey);

    return NextResponse.json({
      views: newViews,
      isNewView: true,
    });
  } catch (error) {
    hasLoggedIncrementViewsError = logViewsErrorOnce("Error incrementing views", error, hasLoggedIncrementViewsError);

    // Redis 연결 실패 시에도 에러를 반환하지 않음
    return NextResponse.json({ views: 0, isNewView: false });
  }
}
