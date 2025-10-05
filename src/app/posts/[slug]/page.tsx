import React from "react";
import { notFound } from "next/navigation";
import { notionClient } from "@/lib/notion";
import { generateTableOfContents } from "@/lib/toc";
import PostContent from "@/components/PostContent";
import TableOfContents from "@/components/TableOfContents";
import PostNavigation from "@/components/PostNavigation";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const post = await notionClient.getPostBySlug(slug);

    return {
      title: `${post.title} | 블로그`,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        type: "article",
        publishedTime: post.publishedAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: ["블로그 작성자"],
        tags: post.tags.map((tag) => tag.name),
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt,
      },
    };
  } catch {
    return {
      title: "포스트를 찾을 수 없습니다 | 블로그",
      description: "요청하신 포스트를 찾을 수 없습니다.",
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const post = await notionClient.getPostBySlug(slug);
    console.log("----------post----------");
    console.log(post);
    const toc = generateTableOfContents(post.content);

    // 이전/다음 포스트 조회
    const allPosts = await notionClient.getAllPosts();
    const currentIndex = allPosts.findIndex((p) => p.slug === slug);

    const previousPost =
      currentIndex > 0 ? await notionClient.getPostBySlug(allPosts[currentIndex - 1].slug) : undefined;

    const nextPost =
      currentIndex < allPosts.length - 1
        ? await notionClient.getPostBySlug(allPosts[currentIndex + 1].slug)
        : undefined;

    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 메인 콘텐츠 */}
            <div className="lg:col-span-3">
              <article className="prose prose-lg max-w-none">
                {/* 포스트 헤더 */}
                <header className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <time dateTime={post.publishedAt.toISOString()}>
                      {post.publishedAt.toLocaleDateString("ko-KR")}
                    </time>
                    <span>•</span>
                    <span>{post.readingTime}분 읽기</span>
                    <span>•</span>
                    <span>{post.category.name}</span>
                    {post.tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex gap-2">
                          {post.tags.map((tag) => (
                            <span
                              key={tag.slug}
                              className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {post.excerpt && <p className="text-lg text-gray-700 dark:text-gray-300 italic">{post.excerpt}</p>}
                </header>

                {/* 포스트 콘텐츠 */}
                <PostContent blocks={post.content} />

                {/* 포스트 푸터 */}
                <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    <p>최종 수정: {post.updatedAt.toLocaleDateString("ko-KR")}</p>
                  </div>

                  <PostNavigation previousPost={previousPost} nextPost={nextPost} />
                </footer>
              </article>
            </div>

            {/* 사이드바 - 목차 */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <TableOfContents items={toc} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}
