import Link from "next/link";
import { getAllPosts } from "@/entities/post/api";
import { BlogSearch } from "@/shared/utils/search";
import type { BlogPost } from "@/entities/post/model";
import "@/app/init-post-api";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const allPosts = await getAllPosts();
  const searchInput: BlogPost[] = allPosts.map((post) => ({
    ...post,
    content: [],
    toc: [],
  }));
  const searchInstance = new BlogSearch(searchInput);

  const results = query ? searchInstance.search(query).map((result) => result.post) : [];

  return (
    <div className="py-8 text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-4">검색</h1>
      <form action="/search" className="mb-6">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="검색어를 입력하세요"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3"
        />
      </form>

      {query && (
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          &quot;{query}&quot; 검색 결과 {results.length}개
        </p>
      )}

      <ul className="space-y-4">
        {results.map((post) => (
          <li key={post.id}>
            <Link href={`/posts/${post.slug}`} className="block rounded-lg border border-gray-200 dark:border-gray-800 p-4">
              <h2 className="font-semibold">{post.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{post.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim();
  const hasQuery = Boolean(query);

  return {
    title: query ? `검색: ${query}` : "검색",
    description: query ? `${query} 검색 결과` : "블로그 포스트를 검색해보세요",
    alternates: {
      canonical: "/search",
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": hasQuery ? 0 : -1,
      },
    },
  };
}
