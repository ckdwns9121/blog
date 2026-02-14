'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BlogPost } from '@/entities/post/model';
import { BlogSearch, SearchResult } from '@/shared/utils/search';
import { cn } from '@/shared/lib/cn';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: BlogPost[];
  isLoading?: boolean;
  contentId?: string;
}

export function SearchModal({ isOpen, onClose, posts, isLoading = false, contentId }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();

  // Initialize search instance
  const searchInstance = useMemo(() => {
    if (posts.length === 0) return null;
    return new BlogSearch(posts);
  }, [posts]);

  // Perform search when query changes
  useEffect(() => {
    if (!searchInstance) {
      setSearchResults([]);
      return;
    }

    if (!query.trim()) {
      setSearchResults(posts.map(post => ({ post, score: 0 })));
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(() => {
      try {
        const results = searchInstance.search(query);
        setSearchResults(results);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    }, 150); // Debounce search

    return () => clearTimeout(timer);
  }, [searchInstance, query, posts]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selectedPost = searchResults[selectedIndex]?.post;
      if (selectedPost) {
        router.push(`/posts/${selectedPost.slug}`);
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent id={contentId} className="w-full max-w-2xl h-[600px] md:h-[700px] max-h-[80vh] overflow-hidden flex flex-col p-0">
        <DialogTitle className="sr-only">포스트 검색</DialogTitle>
        <DialogDescription className="sr-only">포스트 제목, 태그, 내용을 검색할 수 있습니다.</DialogDescription>
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200 dark:border-dark-border flex-shrink-0">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="포스트 검색"
              placeholder="검색어를 입력하세요..."
              className={cn(
                "w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-900",
                "border border-gray-300 dark:border-gray-700 rounded-lg",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                "text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              )}
              autoFocus
            />
            {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="검색어 지우기"
                >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {query && searchResults.length === 0 && (
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">검색 결과가 없습니다</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">다른 검색어로 시도해보세요</p>
            </div>
          )}

          {!query && isLoading && (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">검색 데이터를 불러오는 중...</p>
            </div>
          )}

          <div className="py-2">
            {searchResults.map(({ post }, index) => (
              <SearchResultItem
                key={post.id}
                post={post}
                isSelected={index === selectedIndex}
                onClick={() => {
                  router.push(`/posts/${post.slug}`);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          <div className="flex items-center justify-between">
            <span>
              {searchResults.length}개의 포스트
            </span>
            <div className="flex items-center gap-4">
              <span>↑↓ 탐색</span>
              <span>Enter 선택</span>
              <span>Esc 닫기</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultItem({
  post,
  isSelected,
  onClick,
  onMouseEnter
}: {
  post: BlogPost;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <div
      className={cn(
        'px-4 py-3 cursor-pointer transition-colors',
        'border-b border-gray-100 dark:border-gray-800 last:border-b-0',
        isSelected
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900/50'
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    >
      <div className="flex items-start gap-3">
        {post.coverImage && (
          <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
            <Image
              src={post.coverImage}
              alt={post.title}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-medium text-sm text-gray-900 dark:text-white truncate',
            isSelected && 'text-primary-600 dark:text-primary-400'
          )}>
            {post.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <time className="text-xs text-gray-500 dark:text-gray-500">
              {post.publishedAt.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </time>
            {post.tags.length > 0 && (
              <div className="flex gap-1">
                {post.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag.slug}
                    className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                  >
                    {tag.name}
                  </span>
                ))}
                {post.tags.length > 2 && (
                  <span className="px-2 py-0.5 text-xs text-gray-500 dark:text-gray-500">
                    +{post.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
