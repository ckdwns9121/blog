import { notionClient } from "../service/notion";
import { PostList } from "../components/PostList";

// 이 페이지를 정적으로 생성하도록 강제
export const dynamic = "force-static";
export const revalidate = 3600; // 1시간마다 재검증

export default async function Home() {
  const allPosts = await notionClient.getAllPosts();

  return (
    <div className="bg-white dark:bg-black text-gray-900 dark:text-white min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 클라이언트 컴포넌트로 전체 포스트 전달 */}
        <PostList posts={allPosts} postsPerPage={6} />
      </main>
    </div>
  );
}

export async function generateMetadata() {
  return {
    title: "개발 기술 블로그",
    description: "개발과 기술에 관한 다양한 이야기들을 공유하는 블로그입니다.",
    openGraph: {
      title: "개발 기술 블로그",
      description: "개발과 기술에 관한 다양한 이야기들을 공유하는 블로그입니다.",
      type: "website",
    },
  };
}
