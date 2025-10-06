"use client";

import { useState, useEffect } from "react";
import { PostCard } from "./PostCard";
import { ClientPagination } from "./ClientPagination";
import type { NotionPost } from "../../shared/types/notion";

interface PostListProps {
  posts: NotionPost[];
  postsPerPage: number;
}

export function PostList({ posts, postsPerPage }: PostListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // URL에서 페이지 번호 읽기
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get("page") || "1", 10);
    setCurrentPage(page);
  }, []);

  // 페이지 변경 시 URL 업데이트
  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentPage > 1) {
      url.searchParams.set("page", currentPage.toString());
    } else {
      url.searchParams.delete("page");
    }
    window.history.replaceState({}, "", url);
  }, [currentPage]);

  const totalPages = Math.ceil(posts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = posts.slice(startIndex, endIndex);

  return (
    <>
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
