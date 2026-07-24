import { notFound } from "next/navigation";
import { cache } from "react";

// Post API (entities 레이어)
import { getAllPosts, getPostBySlug } from "@/entities/post/api";

// Notion feature (유틸리티만 사용)
import { generateTableOfContents } from "@/features/notion";
import { getFirstImageFromContent } from "@/features/notion/utils/blockParser";
import type { ContentBlockWithChildren, RichTextItem } from "@/shared/types/content";

// 블록에서 실제 단어 수를 계산 (한/영 혼용: 공백 기준 + CJK 문자 개별 카운트)
function countWordsInBlocks(blocks: ContentBlockWithChildren[]): number {
  const extractText = (items?: RichTextItem[]): string =>
    items?.map((item) => item.plain_text).join(" ") ?? "";

  let total = 0;
  const walk = (nodes: ContentBlockWithChildren[]) => {
    for (const node of nodes) {
      const text = extractText(node.richText) || node.fallbackText || node.code || "";
      if (text) {
        const nonCjk = text.replace(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff\uac00-\ud7af]/g, " ");
        const words = nonCjk.trim().split(/\s+/).filter(Boolean).length;
        const cjk = (text.match(/[\u4e00-\u9fff\uac00-\ud7af]/g) ?? []).length;
        total += words + cjk;
      }
      if (node.children?.length) walk(node.children);
    }
  };
  walk(blocks);
  return total;
}

// Post API 어댑터 초기화
import "@/app/init-post-api";

// entities.
import PostContent from "@/entities/post/ui/PostContent";
import { Comment } from "@/entities/comment";

// features
import { PostViewCounter } from "@/features/page-views";

// widgets
import { PostNavigation } from "@/widgets/post-navigation";
import { ScrollProgress, BottomNavigation } from "@/shared/ui";
import { BASE_URL } from "@/shared/constants";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

const getAllPostsCached = cache(async () => getAllPosts());
const getPostBySlugCached = cache(async (slug: string, fetchContent = true) => getPostBySlug(slug, fetchContent));

// 프로덕션 빌드 시에는 force-static으로 변경 필요
export const dynamic = "force-static";
export const revalidate = 3600; // 1시간마다 재검증

// SSG를 위한 정적 경로 생성
export async function generateStaticParams() {
  const allPosts = await getAllPostsCached();

  return allPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    const post = await getPostBySlugCached(slug);
    const postUrl = `${BASE_URL}/posts/${slug}`;

    // 설명 생성 (excerpt가 없으면 제목 기반)
    const description = post.excerpt || `${post.title}에 대한 상세한 내용을 다룹니다. `;

    // 키워드 생성
    const keywords = [...post.tags.map((tag) => tag.name), "프론트엔드", "개발", "기술블로그", "박창준"];

    // OG Image 우선순위: 1. coverImage, 2. 포스트 내부 첫 번째 이미지, 3. 동적 생성 이미지
    let ogImageUrl: string | undefined = undefined;

    // 1. 커버 이미지 확인
    if (post.coverImage) {
      ogImageUrl = post.coverImage.startsWith("http")
        ? post.coverImage
        : `${BASE_URL}${post.coverImage.startsWith("/") ? post.coverImage : `/${post.coverImage}`}`;
    } else {
      // 2. 포스트 콘텐츠에서 첫 번째 이미지 찾기
      const firstImageUrl = getFirstImageFromContent(post.content);
      if (firstImageUrl) {
        ogImageUrl = firstImageUrl.startsWith("http")
          ? firstImageUrl
          : `${BASE_URL}${firstImageUrl.startsWith("/") ? firstImageUrl : `/${firstImageUrl}`}`;
      } else {
        // 3. 이미지가 없으면 동적 생성된 OG 이미지 사용
        ogImageUrl = `${BASE_URL}/posts/${slug}/opengraph-image`;
      }
    }

    return {
      title: `${post.title}`,
      description: description.slice(0, 160), // 검색엔진 최적 길이
      keywords: keywords.join(", "),
      authors: [{ name: "박창준", url: BASE_URL }],
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
        siteName: "박창준",
        locale: "ko_KR",
        publishedTime: post.publishedAt.toISOString(),
        modifiedTime: post.updatedAt.toISOString(),
        authors: ["박창준"],
        tags: post.tags.map((tag) => tag.name),
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },

      // Twitter Card
      twitter: {
        card: "summary_large_image",
        site: "@changjun",
        creator: "@changjun",
        title: post.title,
        description,
        images: [ogImageUrl],
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
    const post = await getPostBySlugCached(slug);
    const toc = generateTableOfContents(post.content);

    // 이전/다음 포스트 조회 (콘텐츠 블록 불필요)
    const allPosts = await getAllPostsCached();
    const currentIndex = allPosts.findIndex((p) => p.slug === slug);

    const previousPost = currentIndex > 0 ? await getPostBySlugCached(allPosts[currentIndex - 1].slug, false) : undefined;

    const nextPost =
      currentIndex < allPosts.length - 1 ? await getPostBySlugCached(allPosts[currentIndex + 1].slug, false) : undefined;

    // JSON-LD 구조화된 데이터
    // OG Image와 동일한 로직으로 이미지 선택
    let jsonLdImage: string | undefined = undefined;
    if (post.coverImage) {
      jsonLdImage = post.coverImage.startsWith("http")
        ? post.coverImage
        : `${BASE_URL}${post.coverImage.startsWith("/") ? post.coverImage : `/${post.coverImage}`}`;
    } else {
      const firstImageUrl = getFirstImageFromContent(post.content);
      if (firstImageUrl) {
        jsonLdImage = firstImageUrl.startsWith("http")
          ? firstImageUrl
          : `${BASE_URL}${firstImageUrl.startsWith("/") ? firstImageUrl : `/${firstImageUrl}`}`;
      }
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      ...(jsonLdImage && { image: jsonLdImage }),
      datePublished: post.publishedAt.toISOString(),
      dateModified: post.updatedAt.toISOString(),
      author: {
        "@type": "Person",
        name: "박창준",
        url: BASE_URL,
      },
      publisher: {
        "@type": "Person",
        name: "박창준",
        url: BASE_URL,
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `${BASE_URL}/posts/${slug}`,
      },
      keywords: [...post.tags.map((tag) => tag.name)].join(", "),
      articleSection: post.tags.map((tag) => tag.name).join(", "),
      wordCount: countWordsInBlocks(post.content),
    };

    const breadcrumbJsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "홈",
          item: BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: post.title,
          item: `${BASE_URL}/posts/${slug}`,
        },
      ],
    };

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
        <ScrollProgress />
        <div className="py-10">
          <div className="mx-auto w-full">
            <article className="mx-auto max-w-5xl">
              <header className="mx-auto mb-6 max-w-5xl">
                <h1 className="mb-6 text-3xl leading-tight font-bold tracking-tight text-gray-950 md:text-4xl dark:text-gray-50">
                  {post.title}
                </h1>

                <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <time dateTime={post.publishedAt.toISOString()}>{post.publishedAt.toLocaleDateString("ko-KR")}</time>
                  <span>·</span>
                  <PostViewCounter slug={slug} />
                  {post.tags.length > 0 && (
                    <>
                      <span>·</span>
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                          <span
                            key={tag.slug}
                            className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:border-primary-900 dark:bg-primary-950 dark:text-primary-200"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {post.excerpt && (
                  <p className="mb-8 border-l-2 border-primary-500 pl-4 text-lg leading-7 text-gray-600 dark:border-primary-400 dark:text-gray-300">
                    {post.excerpt}
                  </p>
                )}
              </header>

              <PostContent
                blocks={post.content}
                className="mx-auto max-w-5xl text-[1.0625rem] leading-[1.75] text-gray-800 dark:text-gray-200"
              />

              <footer className="mx-auto mt-16 max-w-5xl pt-8">
                <PostNavigation previousPost={previousPost} nextPost={nextPost} />

                <div className="mt-12 border-t border-gray-200 pt-8 dark:border-gray-800">
                  <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">댓글</h2>
                  <Comment key={slug} repo="ckdwns9121/blog-comment" issueTerm="pathname" label="Comment" />
                </div>
              </footer>
            </article>
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
