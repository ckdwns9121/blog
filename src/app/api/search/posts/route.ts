import { NextResponse } from "next/server";
import { getAllPosts } from "@/entities/post/api";
import "@/app/init-post-api";

export async function GET() {
  const posts = await getAllPosts();

  return NextResponse.json(posts, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
