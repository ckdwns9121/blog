"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PostCard } from "./PostCard";
import type { PostMetadata } from "../model/usePostsQuery";

interface PostListProps {
  posts: PostMetadata[];
  postsPerPage: number;
}

// 태그 버튼 스타일 헬퍼
const getButtonClassName = (isActive: boolean) => {
  const baseClasses = "px-5 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer";
  if (isActive) {
    return `${baseClasses} bg-primary-600 text-white hover:bg-primary-700`;
  }
  return `${baseClasses} bg-[#efe8dc] text-[#6f6253] hover:bg-[#e7dece] dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700`;
};

export function PostList({ posts, postsPerPage }: PostListProps) {
  const [visibleCount, setVisibleCount] = useState(postsPerPage);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  // URL에서 태그 읽기 (브라우저 네비게이션 지원)
  useEffect(() => {
    const syncStateWithUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tag = params.get("tag");
      setSelectedTag(tag);
    };

    window.addEventListener("popstate", syncStateWithUrl);
    syncStateWithUrl();

    return () => {
      window.removeEventListener("popstate", syncStateWithUrl);
    };
  }, []);

  // 태그 변경 시 URL 업데이트
  useEffect(() => {
    const url = new URL(window.location.href);

    if (selectedTag) {
      url.searchParams.set("tag", selectedTag);
    } else {
      url.searchParams.delete("tag");
    }

    url.searchParams.delete("page");
    window.history.replaceState({}, "", url);
  }, [selectedTag]);

  // 태그 카운트와 태그 목록을 한 번에 계산 (성능 최적화)
  const { tagCounts, allTags } = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        counts.set(tag.name, (counts.get(tag.name) || 0) + 1);
      });
    });
    const sortedTags = Array.from(counts.keys()).sort();
    return { tagCounts: counts, allTags: sortedTags };
  }, [posts]);

  // 태그로 필터링된 포스트
  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter((post) => post.tags.some((tag) => tag.name === selectedTag));
  }, [posts, selectedTag]);

  const hasMore = visibleCount < filteredPosts.length;
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  // Intersection Observer로 무한 스크롤
  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + postsPerPage);
  }, [postsPerPage]);

  useEffect(() => {
    const el = observerRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  // 태그 변경 핸들러
  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag);
    setVisibleCount(postsPerPage);
  };

  return (
    <>
      {/* 태그 필터 */}
      <div className="pt-0 pb-5 sm:pb-7">
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <button onClick={() => handleTagClick(null)} className={getButtonClassName(selectedTag === null)}>
            전체 ({posts.length})
          </button>
          {allTags.map((tag) => {
            const count = tagCounts.get(tag) || 0;
            return (
              <button key={tag} onClick={() => handleTagClick(tag)} className={getButtonClassName(selectedTag === tag)}>
                {tag} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-10 border-t border-gray-200 dark:border-gray-800">
        {visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {visiblePosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">아직 포스트가 없습니다.</p>
        </div>
      )}

      {/* 무한 스크롤 트리거 */}
      {hasMore && (
        <div ref={observerRef} className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600" />
        </div>
      )}
    </>
  );
}
