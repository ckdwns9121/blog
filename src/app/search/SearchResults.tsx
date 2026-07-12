'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  loadSearchPosts,
  type SearchPostsState,
} from '@/features/search/api/searchPosts';
import { BlogSearch } from '@/shared/utils/search';

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const [state, setState] = useState<SearchPostsState>({ status: 'idle' });
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    if (!query) {
      setState({ status: 'idle' });
      return;
    }

    let isCurrent = true;
    setState({ status: 'loading' });

    void loadSearchPosts().then(
      (posts) => {
        if (isCurrent) setState({ status: 'success', posts });
      },
      (error: unknown) => {
        if (!isCurrent) return;
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        });
      },
    );

    return () => {
      isCurrent = false;
    };
  }, [query, requestId]);

  const results = useMemo(() => {
    if (state.status !== 'success' || !query) return [];
    return new BlogSearch(state.posts).search(query).map(({ post }) => post);
  }, [query, state]);

  if (!query) return null;

  if (state.status === 'idle') {
    return <SearchStatus>검색을 준비하는 중...</SearchStatus>;
  }

  if (state.status === 'loading') {
    return <SearchStatus>검색 데이터를 불러오는 중...</SearchStatus>;
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-900 dark:bg-red-950/30">
        <p className="text-red-700 dark:text-red-300">
          검색 데이터를 불러오지 못했습니다
        </p>
        <button
          type="button"
          onClick={() => setRequestId((current) => current + 1)}
          className="mt-3 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div aria-live="polite">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        &quot;{query}&quot; 검색 결과 {results.length}개
      </p>

      {results.length === 0 ? (
        <p className="rounded-lg border border-gray-200 p-6 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400">
          검색 결과가 없습니다
        </p>
      ) : (
        <ul className="space-y-4">
          {results.map((post) => (
            <li key={post.id}>
              <Link
                href={`/posts/${post.slug}`}
                className="block rounded-lg border border-gray-200 p-4 dark:border-gray-800"
              >
                <h2 className="font-semibold">{post.title}</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {post.excerpt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SearchStatus({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="rounded-lg border border-gray-200 p-6 text-center text-gray-600 dark:border-gray-800 dark:text-gray-400"
      aria-live="polite"
    >
      {children}
    </p>
  );
}
