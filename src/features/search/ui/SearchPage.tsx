'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlogPost } from '@/entities/post/model';
import { BlogSearch, SearchResult } from '@/shared/utils/search';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';

// Post API 어댑터 초기화
import '@/app/init-post-api';

export function SearchPageClient({ initialPosts }: { initialPosts: BlogPost[] }) {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';

  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize posts on mount
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Initialize search instance
  const searchInstance = useMemo(() => {
    if (posts.length === 0) return null;
    return new BlogSearch(posts);
  }, [posts]);

  // Perform search when query or posts change
  useEffect(() => {
    if (!searchInstance || !query) {
      setSearchResults(posts.map(post => ({ post, score: 0 })));
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      try {
        const results = searchInstance.search(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults(posts.map(post => ({ post, score: 0 })));
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchInstance, query, posts]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">검색</h1>
        <SearchInput
          placeholder="포스트 제목, 내용, 태그로 검색..."
          className="max-w-xl"
        />
      </div>

      <SearchResults
        results={searchResults}
        query={query}
        isSearching={isSearching}
      />
    </div>
  );
}