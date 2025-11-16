import { useState, useEffect, useRef } from "react";
import type { NotionPost } from "@/features/notion/types";

interface UseSearchResult {
  query: string;
  setQuery: (query: string) => void;
  results: (NotionPost & { score?: number })[];
  isLoading: boolean;
  reset: () => void;
}

const DEBOUNCE_DELAY = 300;

/**
 * 검색 기능을 위한 커스텀 훅
 * - 디바운싱된 검색 실행
 * - API 호출 및 결과 관리
 */
export function useSearch(isOpen: boolean): UseSearchResult {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(NotionPost & { score?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // 모달이 열릴 때 검색 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
    }
  }, [isOpen]);

  const reset = () => {
    setQuery("");
    setResults([]);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    reset,
  };
}

