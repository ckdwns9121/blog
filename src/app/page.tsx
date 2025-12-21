import { getAllPosts } from "@/entities/post/api";
import { PostList } from "../entities/post/ui/PostList";

// Post API 어댑터 초기화
import "@/app/init-post-api";
import { POSTS_PER_PAGE } from "@/shared/constants";

// 프로덕션 빌드 시에는 force-static으로 변경 필요
export const dynamic = "force-static";
export const revalidate = 3600; // 1시간마다 재검증

export default async function Home() {
  const allPosts = await getAllPosts();
  const sortedPosts = allPosts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

  return (
    <div className="text-gray-900 dark:text-white">
      <div className="py-8">
        {/* 클라이언트 컴포넌트로 전체 포스트 전달 */}
        <PostList posts={sortedPosts} postsPerPage={POSTS_PER_PAGE} />
      </div>
    </div>
  );
}

export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://changjun.dev";

  return {
    title: "박창준 블로그",
    description:
      "박창준의 기술 블로그입니다. 프론트엔드 개발자 박창준이 React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
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
    authors: [{ name: "박창준", url: baseUrl }],
    creator: "박창준",
    publisher: "박창준",
    openGraph: {
      title: "박창준 블로그",
      description:
        "박창준의 기술 블로그입니다. 프론트엔드 개발자 박창준이 React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
      type: "website",
      locale: "ko_KR",
      siteName: "박창준",
      url: baseUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: "박창준 블로그",
      description:
        "박창준의 기술 블로그입니다. 프론트엔드 개발자 박창준이 React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
      creator: "@changjun",
    },
  };
}
