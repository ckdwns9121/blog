"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { PostCard } from "./PostCard";
import type { PostMetadata } from "../model/usePostsQuery";

interface PostListProps {
  posts: PostMetadata[];
  postsPerPage: number;
}

interface PostListHistoryState {
  selectedTag: string | null;
  scrollY: number;
  visibleCount: number;
}

const POST_LIST_HISTORY_KEY = "postList";

function getPostListHistoryState(): PostListHistoryState | null {
  const savedState = window.history.state?.[POST_LIST_HISTORY_KEY] as Partial<PostListHistoryState> | undefined;

  if (
    !savedState ||
    !Number.isInteger(savedState.visibleCount) ||
    (savedState.visibleCount ?? 0) < 0 ||
    typeof savedState.scrollY !== "number" ||
    !Number.isFinite(savedState.scrollY) ||
    savedState.scrollY < 0 ||
    (savedState.selectedTag !== null && typeof savedState.selectedTag !== "string")
  ) {
    return null;
  }

  return savedState as PostListHistoryState;
}

// 태그 버튼 스타일 헬퍼
const getButtonClassName = (isActive: boolean) => {
  const baseClasses = "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors";
  if (isActive) {
    return `${baseClasses} bg-primary-600 text-white hover:bg-primary-700`;
  }
  return `${baseClasses} bg-surface-raised text-fg-muted hover:text-fg`;
};

export function PostList({ posts, postsPerPage }: PostListProps) {
  const [visibleCount, setVisibleCount] = useState(postsPerPage);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const pendingScrollRestoreRef = useRef<PostListHistoryState | null>(null);
  const didSyncTagRef = useRef(false);

  // URL에서 태그 읽기 (브라우저 네비게이션 지원)
  useEffect(() => {
    const restoreStateFromHistory = () => {
      const params = new URLSearchParams(window.location.search);
      const tag = params.get("tag");
      setSelectedTag(tag);

      const savedState = getPostListHistoryState();
      if (!savedState || savedState.selectedTag !== tag) return;

      const availableCount = tag
        ? posts.filter((post) => post.tags.some((postTag) => postTag.name === tag)).length
        : posts.length;
      const restoredVisibleCount = Math.min(
        Math.max(savedState.visibleCount, postsPerPage),
        availableCount,
      );

      pendingScrollRestoreRef.current = {
        ...savedState,
        visibleCount: restoredVisibleCount,
      };
      setVisibleCount(restoredVisibleCount);
    };

    const handlePopState = () => restoreStateFromHistory();

    window.addEventListener("popstate", handlePopState);
    restoreStateFromHistory();

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [posts, postsPerPage]);

  useEffect(() => {
    const pendingState = pendingScrollRestoreRef.current;
    if (
      !pendingState ||
      pendingState.selectedTag !== selectedTag ||
      visibleCount < pendingState.visibleCount
    ) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      window.scrollTo(0, pendingState.scrollY);
      pendingScrollRestoreRef.current = null;
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [selectedTag, visibleCount]);

  // 태그 변경 시 URL 업데이트
  useEffect(() => {
    if (!didSyncTagRef.current) {
      didSyncTagRef.current = true;
      return;
    }

    const url = new URL(window.location.href);

    if (selectedTag) {
      url.searchParams.set("tag", selectedTag);
    } else {
      url.searchParams.delete("tag");
    }

    url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
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

  const saveListPosition = useCallback(() => {
    const currentHistoryState =
      window.history.state && typeof window.history.state === "object"
        ? window.history.state
        : {};

    window.history.replaceState(
      {
        ...currentHistoryState,
        [POST_LIST_HISTORY_KEY]: {
          selectedTag,
          scrollY: window.scrollY,
          visibleCount,
        } satisfies PostListHistoryState,
      },
      "",
    );
  }, [selectedTag, visibleCount]);

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
    pendingScrollRestoreRef.current = null;
    setSelectedTag(tag);
    setVisibleCount(postsPerPage);
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* 태그 필터 */}
      <div className="pt-0 pb-5 sm:pb-7">
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="sr-only">태그로 글 필터링</legend>
          <button type="button" aria-pressed={selectedTag === null} onClick={() => handleTagClick(null)} className={getButtonClassName(selectedTag === null)}>
            전체 ({posts.length})
          </button>
          {allTags.map((tag) => {
            const count = tagCounts.get(tag) || 0;
            return (
              <button type="button" aria-pressed={selectedTag === tag} key={tag} onClick={() => handleTagClick(tag)} className={getButtonClassName(selectedTag === tag)}>
                {tag} ({count})
              </button>
            );
          })}
        </fieldset>
      </div>

      <div className="mb-10 border-t border-gray-200 dark:border-gray-800">
        {visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} onNavigate={saveListPosition} />
        ))}
      </div>

      <p className="sr-only" role="status">
        {selectedTag ? `${selectedTag} 태그 글 ${filteredPosts.length}개` : `전체 글 ${filteredPosts.length}개`}
      </p>

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
    </div>
  );
}
