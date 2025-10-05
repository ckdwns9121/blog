import { NextResponse } from "next/server";
import { notionClient } from "@/lib/notion";

export async function GET() {
  try {
    const posts = await notionClient.getAllPosts();
    const postsWithSlugs = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: post.category || "기타",
      published: post.published,
    }));

    return NextResponse.json({
      posts: postsWithSlugs,
      total: postsWithSlugs.length,
      apiStatus: notionClient.getApiStatus(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        posts: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
