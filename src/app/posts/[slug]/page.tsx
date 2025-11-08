import { notFound } from "next/navigation";

// Notion feature
import { getAllPosts, getPostBySlug, generateTableOfContents } from "@/features/notion";

// entities.
import PostContent from "@/entities/post/PostContent";
import TableOfContents from "@/entities/post/TableOfContents";
import PostNavigation from "@/entities/post/PostNavigation";
import { Comment } from "@/entities/comment";
import { ScrollProgress } from "@/shared/components/ScrollProgress";
import BottomNavigation from "@/shared/components/BottomNavigation";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

// 프로덕션 빌드 시에는 force-static으로 변경 필요
export const dynamic = 'force-static';
export const revalidate = 3600; // 1시간마다 재검증

// SSG를 위한 정적 경로 생성
export async function generateStaticParams() {
  const allPosts = await getAllPosts();

  return allPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const post = await getPostBySlug(slug);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blog.changjun.dev";
    const postUrl = `${baseUrl}/posts/${slug}`;

    // 설명 생성 (excerpt가 없으면 제목 기반)
    const description = post.excerpt || `${post.title}에 대한 상세한 내용을 다룹니다. `;

    // 키워드 생성
    const keywords = [...post.tags.map((tag) => tag.name), "프론트엔드", "개발", "기술블로그", "박창준"];

    return {
      title: `${post.title} | 프론트엔드 개발자 박창준 블로그`,
      description: description.slice(0, 160), // 검색엔진 최적 길이
      keywords: keywords.join(", "),
      authors: [{ name: "박창준", url: baseUrl }],
      creator: "박창준",
      publisher: "박창준",

      // Canonical URL
      alternates: {
        canonical: postUrl,
      },

      // Robots 설정
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },

      // Open Graph
      openGraph: {
        type: "article",
        url: postUrl,
        title: post.title,
        description,
        siteName: "프론트엔드 개발자 박창준 블로그",
        locale: "ko_KR",
        publishedTime: post.publishedAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: ["박창준"],
        tags: post.tags.map((tag) => tag.name),
        ...(post.coverImage && {
          images: [
            {
              url: post.coverImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ],
        }),
      },

      // Twitter Card
      twitter: {
        card: "summary_large_image",
        site: "@changjun",
        creator: "@changjun",
        title: post.title,
        description,
        ...(post.coverImage && {
          images: [post.coverImage],
        }),
      },

      // Article 메타데이터
      other: {
        "article:published_time": post.publishedAt.toISOString(),
        "article:modified_time": post.updatedAt.toISOString(),
        "article:author": "박창준",
        "article:section": post.tags.map((tag) => tag.name).join(", "),
        "article:tag": post.tags.map((tag) => tag.name).join(", "),
      },
    };
  } catch {
    return {
      title: "포스트를 찾을 수 없습니다 | 박창준 블로그",
      description: "요청하신 포스트를 찾을 수 없습니다.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const post = await getPostBySlug(slug);
    const toc = generateTableOfContents(post.content);

    // 이전/다음 포스트 조회 (콘텐츠 블록 불필요)
    const allPosts = await getAllPosts();
    const currentIndex = allPosts.findIndex((p) => p.slug === slug);

    const previousPost = currentIndex > 0 ? await getPostBySlug(allPosts[currentIndex - 1].slug, false) : undefined;

    const nextPost =
      currentIndex < allPosts.length - 1 ? await getPostBySlug(allPosts[currentIndex + 1].slug, false) : undefined;

    // JSON-LD 구조화된 데이터
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blog.changjun.dev";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      image: post.coverImage,
      datePublished: post.publishedAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: {
        "@type": "Person",
        name: "박창준",
        url: baseUrl,
      },
      publisher: {
        "@type": "Person",
        name: "박창준",
        url: baseUrl,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${baseUrl}/posts/${slug}`,
      },
      keywords: [...post.tags.map((tag) => tag.name)].join(", "),
      articleSection: post.tags.map((tag) => tag.name).join(", "),
      wordCount: post.content.length * 100, // 대략적인 단어 수
    };

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
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

              {/* 사이드바 - 목차 (데스크톱만) */}
              <div className="hidden lg:block lg:col-span-1">
                <div className="sticky top-16">
                  <TableOfContents items={toc} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 모바일 하단 네비게이션 */}
        <BottomNavigation tocItems={toc} />
      </>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}
