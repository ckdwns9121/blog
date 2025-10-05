import { notionClient } from "../lib/notion";
import { PostCard } from "../components/PostCard";
import { ClientPagination } from "../components/ClientPagination";
import { Header } from "../components/Header";
// import type { BlogPost } from '../types/notion';

interface HomeProps {
  searchParams: {
    page?: string;
  };
}

export default async function Home({ searchParams }: HomeProps) {
  const resolvedSearchParams = await searchParams;
  const currentPage = parseInt(resolvedSearchParams.page || "1", 10);
  const postsPerPage = 6;

  // Notion에서 모든 포스트 가져오기
  const allPosts = await notionClient.getAllPosts();

  // 페이지네이션 계산
  const totalPages = Math.ceil(allPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const posts = allPosts.slice(startIndex, endIndex);

  // 포스트 대화형 페이지 (클라이언트 컴포넌트로 이동)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      {/* 메인 콘텐츠 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 포스트 목록 */}
        <div className="space-y-0 mb-8">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={
                // NotionPost를 BlogPost로 변환
                {
                  id: post.id,
                  title: post.title,
                  slug: post.slug,
                  content: [], // 상세 페이지에서 구현
                  excerpt: post.excerpt || "",
                  publishedAt: new Date(post.createdAt),
                  updatedAt: new Date(post.updatedAt),
                  category: {
                    name: post.category,
                    slug: post.category.toLowerCase().replace(/\s+/g, "-"),
                    postCount: 0,
                  },
                  tags: post.tags.map((tag) => ({
                    name: tag,
                    slug: tag.toLowerCase().replace(/\s+/g, "-"),
                    postCount: 0,
                  })),
                  coverImage: post.coverImage,
                  readingTime: post.readingTime || 0,
                  toc: [],
                }
              }
            />
          ))}
        </div>

        {/* 포스트가 없는 경우 */}
        {posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">아직 포스트가 없습니다.</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && <ClientPagination currentPage={currentPage} totalPages={totalPages} />}
      </main>

      {/* 푸터 */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 개발 기술 블로그. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// SSG를 위한 메타데이터 생성
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
