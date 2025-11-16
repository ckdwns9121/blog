import { NextResponse } from "next/server";
import { getAllPosts } from "@/features/notion";
import { searchPosts } from "@/shared/utils/search";

// API 라우트는 동적으로 실행되어야 함
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const posts = await getCachedAllPosts();
    
    if (posts.length === 0) {
      console.warn("No posts found for search");
      return NextResponse.json({ results: [] });
    }

    const results = searchPosts(posts, query);

    return NextResponse.json({
      results: results.map((result) => ({
        ...result.item,
        score: result.score,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "검색 중 오류가 발생했습니다." }, { status: 500 });
  }
}

