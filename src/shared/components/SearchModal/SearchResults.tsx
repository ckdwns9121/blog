import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { NotionPost } from "@/features/notion/types";
import { SearchResultItem } from "./SearchResultItem";

interface SearchResultsProps {
  query: string;
  results: (NotionPost & { score?: number })[];
  isLoading: boolean;
  selectedIndex: number;
  onItemClick: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function SearchResults({
  query,
  results,
  isLoading,
  selectedIndex,
  onItemClick,
  scrollRef,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">검색 중...</div>
    );
  }

  if (query.trim() && results.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        검색 결과가 없습니다.
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <MagnifyingGlassIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">검색어를 입력하세요</p>
        <p className="text-xs mt-2 opacity-75">↑↓ 키로 이동, Enter로 선택, Esc로 닫기</p>
      </div>
    );
  }

  return (
    <div className="max-h-[60vh] overflow-y-auto" ref={scrollRef}>
      <div className="p-2">
        {results.map((post, index) => (
          <SearchResultItem
            key={post.id}
            post={post}
            isSelected={index === selectedIndex}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

