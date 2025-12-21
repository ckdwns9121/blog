'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/entities/post/model';
import { SearchResult, type FuseResult } from '@/shared/utils/search';
import { cn } from '@/shared/lib/cn';
import { highlightMatchedText } from '@/shared/utils/search';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isSearching?: boolean;
}

export function SearchResults({ results, query, isSearching = false }: SearchResultsProps) {
  if (isSearching) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>검색어를 입력하세요</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
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
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
          />
        </svg>
        <p className="text-gray-600 font-medium">검색 결과가 없습니다</p>
        <p className="text-sm text-gray-500 mt-1">다른 검색어로 시도해보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {results.length}개의 검색 결과
      </p>

      <div className="grid gap-4">
        {results.map(({ post, matches }) => (
          <SearchResultItem key={post.id} post={post} matches={matches} />
        ))}
      </div>
    </div>
  );
}

function SearchResultItem({ post, matches }: { post: BlogPost; matches?: SearchResult['matches'] }) {
  const titleMatch = matches?.find(m => m.key === 'title');
  const excerptMatch = matches?.find(m => m.key === 'excerpt');
  const tagMatches = matches?.filter(m => m.key === 'tags.name');

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="block group bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
    >
      <article className="space-y-2">
        <div className="flex items-start gap-4">
          {post.coverImage && (
            <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {titleMatch ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightMatchedText(post.title, [titleMatch])
                  }}
                />
              ) : (
                post.title
              )}
            </h3>

            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {excerptMatch ? (
                <span
                  dangerouslySetInnerHTML={{
                    __html: highlightMatchedText(post.excerpt, [excerptMatch])
                  }}
                />
              ) : (
                post.excerpt
              )}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <time dateTime={post.publishedAt.toISOString()}>
                {post.publishedAt.toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>

              {post.tags.length > 0 && (
                <div className="flex items-center gap-1">
                  <span>·</span>
                  <div className="flex gap-1 flex-wrap">
                    {post.tags.map((tag) => (
                      <span
                        key={tag.slug}
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          tagMatches?.some(m => m.value === tag.name)
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}