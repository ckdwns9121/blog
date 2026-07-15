import { getAllPosts } from "@/entities/post/api";
import { PostList } from "../entities/post/ui/PostList";

// Post API 어댑터 초기화
import "@/app/init-post-api";
import { BASE_URL, POSTS_PER_PAGE } from "@/shared/constants";

// 프로덕션 빌드 시에는 force-static으로 변경 필요
export const dynamic = "force-static";
export const revalidate = 3600; // 1시간마다 재검증

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "박창준 블로그",
  url: BASE_URL,
  description: "개발자 박창준 블로그입니다.",
  inLanguage: "ko-KR",
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
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default async function Home() {
  const allPosts = await getAllPosts();
  const sortedPosts = allPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return (
    <div className="text-gray-900 dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      <h1 className="sr-only">박창준 블로그 글 목록</h1>
      <div className="pt-3 pb-8 sm:pt-4">
        {/* 클라이언트 컴포넌트로 전체 포스트 전달 */}
        <PostList posts={sortedPosts} postsPerPage={POSTS_PER_PAGE} />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "박창준 블로그",
    description: "개발자 박창준 블로그입니다.",
    keywords: [
      "박창준",
      "프론트엔드",
      "개발자",
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "웹 개발",
      "기술 블로그",
    ],
    authors: [{ name: "박창준", url: BASE_URL }],
    creator: "박창준",
    publisher: "박창준",
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: "박창준 블로그",
      description: "개발자 박창준 블로그입니다.",
      type: "website",
      locale: "ko_KR",
      siteName: "박창준",
      url: BASE_URL,
      images: [
        {
          url: `${BASE_URL}/logo.png`,
          width: 1200,
          height: 630,
          alt: "박창준 블로그",
        },
      ],
    },
  };
}
