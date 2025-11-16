"use client";

import { useEffect, useRef } from "react";
import { useSearch } from "@/shared/hooks/useSearch";
import { useKeyboardNavigation } from "@/shared/hooks/useKeyboardNavigation";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";
import { SearchFooter } from "./SearchFooter";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { query, setQuery, results, isLoading, reset } = useSearch(isOpen);

  const { selectedIndex, handleKeyDown, scrollRef } = useKeyboardNavigation({
    itemCount: results.length,
    isEnabled: isOpen,
    onSelect: (index) => {
      if (results[index]) {
        window.location.href = `/posts/${results[index].slug}`;
        onClose();
      }
    },
    onEscape: onClose,
  });

  // 모달이 열릴 때 입력 필드에 포커스
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      reset();
    }
  }, [isOpen, reset]);

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
        <SearchInput query={query} onQueryChange={setQuery} onClose={onClose} inputRef={inputRef} />

        <SearchResults
          query={query}
          results={results}
          isLoading={isLoading}
          selectedIndex={selectedIndex}
          onItemClick={onClose}
          scrollRef={scrollRef}
        />

        <SearchFooter resultCount={results.length} />
      </div>
    </div>
  );
}

