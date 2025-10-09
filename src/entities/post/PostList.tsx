"use client";

import { useState, useEffect, useMemo } from "react";
import { PostCard } from "./PostCard";
import { ClientPagination } from "./ClientPagination";
import type { NotionPost } from "@/features/notion";

interface PostListProps {
  posts: NotionPost[];
  postsPerPage: number;
}

// 태그 버튼 스타일 헬퍼
const getButtonClassName = (isActive: boolean) => {
  const baseClasses = "px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer";
  if (isActive) {
    return `${baseClasses} bg-primary-600 text-white hover:bg-primary-700`;
  }
  return `${baseClasses} bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700`;
};

export function PostList({ posts, postsPerPage }: PostListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // URL에서 페이지 번호와 태그 읽기 (브라우저 네비게이션 지원)
  useEffect(() => {
    const syncStateWithUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get("page") || "1", 10);
      const tag = params.get("tag");
      setCurrentPage(page);
      setSelectedTag(tag);
    };

    // 브라우저 뒤로/앞으로 가기 감지
    window.addEventListener("popstate", syncStateWithUrl);

    // 초기 로드 시 실행
    syncStateWithUrl();

    return () => {
      window.removeEventListener("popstate", syncStateWithUrl);
    };
  }, []);

  // 페이지 또는 태그 변경 시 URL 업데이트
  useEffect(() => {
    const url = new URL(window.location.href);

    if (currentPage > 1) {
      url.searchParams.set("page", currentPage.toString());
    } else {
      url.searchParams.delete("page");
    }

    if (selectedTag) {
      url.searchParams.set("tag", selectedTag);
    } else {
      url.searchParams.delete("tag");
    }

    window.history.replaceState({}, "", url);
  }, [currentPage, selectedTag]);

  // 태그 카운트와 태그 목록을 한 번에 계산 (성능 최적화)
  const { tagCounts, allTags } = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => {
      post.tags.forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    const sortedTags = Array.from(counts.keys()).sort();
    return { tagCounts: counts, allTags: sortedTags };
  }, [posts]);

  // 태그로 필터링된 포스트
  const filteredPosts = useMemo(() => {
    if (!selectedTag) return posts;
    return posts.filter((post) => post.tags.includes(selectedTag));
  }, [posts, selectedTag]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = filteredPosts.slice(startIndex, endIndex);

  // 태그 변경 핸들러
  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag);
    setCurrentPage(1); // 태그 변경 시 첫 페이지로
  };

  return (
    <>
      {/* 태그 필터 */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
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

      <div className="space-y-0 mb-8">
        {currentPosts.map((post) => (
          <PostCard
            key={post.id}
            post={{
              id: post.id,
              title: post.title,
              slug: post.slug,
              content: [],
              excerpt: post.excerpt || "",
              publishedAt: new Date(post.publishedAt),
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
            }}
          />
        ))}
      </div>

      {currentPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">아직 포스트가 없습니다.</p>
        </div>
      )}

      {totalPages > 1 && (
        <ClientPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </>
  );
}
