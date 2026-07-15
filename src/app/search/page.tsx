import { SearchResults } from './SearchResults';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? '';

  return (
    <div className="py-8 text-gray-900 dark:text-white">
      <h1 className="mb-4 text-2xl font-bold">검색</h1>
      <form action="/search" className="mb-6">
        <label htmlFor="site-search" className="sr-only">
          블로그 글 검색
        </label>
        <input
          id="site-search"
          type="search"
          name="q"
          defaultValue={query}
          placeholder="검색어를 입력하세요"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 focus-visible:border-primary-600 focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-gray-700 dark:bg-gray-900"
        />
      </form>

      <SearchResults query={query} />
    </div>
  );
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim();

  return {
    title: query ? `검색: ${query}` : '검색',
    description: query ? `${query} 검색 결과` : '블로그 포스트를 검색해보세요',
    alternates: {
      canonical: '/search',
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
