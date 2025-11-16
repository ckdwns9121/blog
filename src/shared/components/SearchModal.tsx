"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { NotionPost } from "@/features/notion/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  item: NotionPost;
  score: number;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(NotionPost & { score: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // 검색 실행 (디바운싱)
  useEffect(() => {
    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 디바운싱: 300ms 후에 검색 실행
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          console.error("Search API error:", response.status, response.statusText);
          setResults([]);
          return;
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.error("Search error:", data.error);
          setResults([]);
          return;
        }
        
        setResults(data.results || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // 모달이 열릴 때 입력 필드에 포커스
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          if (results[selectedIndex]) {
            const slug = results[selectedIndex].slug;
            window.location.href = `/posts/${slug}`;
            onClose();
          }
          break;
      }
    },
    [isOpen, results, selectedIndex, onClose]
  );

  // 선택된 항목으로 스크롤
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* 배경 오버레이 */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* 검색 모달 */}
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-dark-bg rounded-lg shadow-2xl border border-gray-200 dark:border-dark-border"
        onKeyDown={handleKeyDown}
      >
        {/* 검색 입력 */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-dark-border">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="포스트 검색... (제목, 내용, 태그)"
            className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 outline-none text-lg"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* 검색 결과 */}
        <div className="max-h-[60vh] overflow-y-auto" ref={resultsRef}>
          {isLoading && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              검색 중...
            </div>
          )}

          {!isLoading && query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              검색 결과가 없습니다.
            </div>
          )}

          {!isLoading && query.trim() && results.length > 0 && (
            <div className="p-2">
              {results.map((post, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <Link
                    key={post.id}
                    href={`/posts/${post.slug}`}
                    onClick={onClose}
                    className={`block p-3 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {post.excerpt}
                          </p>
                        )}
                        {post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.slug}
                                className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "short",
                        })}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!query.trim() && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">검색어를 입력하세요</p>
              <p className="text-xs mt-2 opacity-75">↑↓ 키로 이동, Enter로 선택, Esc로 닫기</p>
            </div>
          )}
        </div>

        {/* 단축키 안내 */}
        {query.trim() && results.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>{results.length}개의 결과</span>
            <span>↑↓ 이동 · Enter 선택 · Esc 닫기</span>
          </div>
        )}
      </div>
    </div>
  );
}

