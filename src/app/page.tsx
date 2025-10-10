import { notionClient } from "@/features/notion";
import { PostList } from "../entities/post/PostList";
import Image from "next/image";
import Link from "next/link";
import { CodeBracketIcon } from "@heroicons/react/24/outline";
import { POSTS_PER_PAGE } from "@/shared/constants";

// 이 페이지를 정적으로 생성하도록 강제
export const dynamic = "force-static";
export const revalidate = 3600; // 1시간마다 재검증

export default async function Home() {
  const allPosts = await notionClient.getAllPosts();
  const sortedPosts = allPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="bg-white dark:bg-dark-bg text-gray-900 dark:text-white min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 mb-8 mt-8">
          {/* 프로필 이미지 */}
          <div className="flex justify-center md:justify-start">
            <Image src="/logo.png" alt="프로필 로고" width={160} height={160} />
          </div>

          {/* 텍스트 및 링크 영역 */}
          <div className="flex flex-col flex-1 justify-center md:justify-start">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 word-break-keep-all">
                프론트엔드 엔지니어 박창준입니다.
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                기술 블로그를 운영하며 개발 경험과 기술 트렌드를 기록하고 있습니다.
              </p>
            </div>

            <div className="flex gap-4 mt-6 md:mt-auto justify-center md:justify-start">
              <Link
                href="https://github.com/ckdwns9121"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-label="GitHub 프로필"
              >
                <CodeBracketIcon className="h-5 w-5" />
                <span className="text-sm font-medium">GitHub</span>
              </Link>
              <Link
                href="https://linkedin.com/in/devchangjun"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                aria-label="LinkedIn 프로필"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 클라이언트 컴포넌트로 전체 포스트 전달 */}
        <PostList posts={sortedPosts} postsPerPage={POSTS_PER_PAGE} />
      </main>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "프론트엔드 개발자 박창준",
    description:
      "프론트엔드 개발자 박창준의 블로그입니다. React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
    keywords: ["프론트엔드", "개발자", "박창준", "React", "Next.js", "TypeScript", "JavaScript", "웹 개발"],
    authors: [{ name: "박창준" }],
    creator: "박창준",
    openGraph: {
      title: "프론트엔드 개발자 박창준",
      description:
        "프론트엔드 개발자 박창준의 블로그입니다. React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
      type: "website",
      locale: "ko_KR",
      siteName: "박창준 블로그",
    },
    twitter: {
      card: "summary_large_image",
      title: "프론트엔드 개발자 박창준",
      description: "프론트엔드 개발자 박창준의 블로그입니다.",
      creator: "@changjun",
    },
  };
}
