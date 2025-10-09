import { notFound } from "next/navigation";

// Notion feature
import { notionClient, generateTableOfContents } from "@/features/notion";

// entities
import PostContent from "@/entities/post/PostContent";
import TableOfContents from "@/entities/post/TableOfContents";
import PostNavigation from "@/entities/post/PostNavigation";
import { Comment } from "@/entities/comment";
import { ScrollProgress } from "@/shared/components/ScrollProgress";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// 이 페이지를 정적으로 생성하도록 강제
export const dynamic = "force-static";
export const revalidate = 3600; // 1시간마다 재검증

// SSG를 위한 정적 경로 생성
export async function generateStaticParams() {
  const allPosts = await notionClient.getAllPosts();

  return allPosts.map((post) => ({
    slug: post.slug,
  }));
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
      <>
        <ScrollProgress />
        <div className="bg-white dark:bg-dark-bg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                                className="px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full text-xs"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {post.excerpt && (
                      <div className="mt-6 p-4 bg-primary-50 dark:bg-primary-950 border-l-4 border-primary-600 dark:border-primary-400 rounded-r-lg">
                        <div className="flex items-center gap-3 justify-center">
                          <span className="text-sm font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
                            TL;DR
                          </span>
                          <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                            {post.excerpt}
                          </p>
                        </div>
                      </div>
                    )}
                  </header>

                  {/* 포스트 콘텐츠 */}
                  <PostContent blocks={post.content} />

                  {/* 포스트 푸터 */}
                  <footer className="mt-12 pt-8">
                    <PostNavigation previousPost={previousPost} nextPost={nextPost} />

                    {/* 댓글 섹션 */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">댓글</h2>
                      <Comment repo="ckdwns9121/blog-comment" issueTerm="pathname" label="Comment" />
                    </div>
                  </footer>
                </article>
              </div>

              {/* 사이드바 - 목차 */}
              <div className="lg:col-span-1">
                <div className="sticky top-16">
                  <TableOfContents items={toc} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}
