import { notionClient } from "@/features/notion";
import { PostList } from "../entities/post/PostList";

// 이 페이지를 정적으로 생성하도록 강제
export const dynamic = "force-static";
export const revalidate = 3600; // 1시간마다 재검증

export default async function Home() {
  const allPosts = await notionClient.getAllPosts();
  const sortedPosts = allPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  return (
    <div className="bg-white dark:bg-black text-gray-900 dark:text-white min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-black mb-8 mt-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">프론트엔드 엔지니어 박창준입니다.</h1>
          <p>기술 블로그를 운영하며 개발 경험과 기술 트렌드를 기록하고 있습니다.</p>
        </div>
        {/* 클라이언트 컴포넌트로 전체 포스트 전달 */}
        <PostList posts={sortedPosts} postsPerPage={10} />
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
