import { useState, useEffect, useRef, useCallback } from "react";

interface UseKeyboardNavigationOptions {
  itemCount: number;
  isEnabled: boolean;
  onSelect: (index: number) => void;
  onEscape?: () => void;
}

interface UseKeyboardNavigationResult {
  selectedIndex: number;
  setSelectedIndex: (index: number | ((prev: number) => number)) => void;
  reset: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 키보드 네비게이션을 위한 커스텀 훅
 * - 화살표 키로 항목 이동
 * - Enter로 선택
 * - Escape로 닫기
 * - 선택된 항목으로 자동 스크롤
 */
export function useKeyboardNavigation({
  itemCount,
  isEnabled,
  onSelect,
  onEscape,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationResult {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement|null>(null);

  // 키보드 네비게이션 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isEnabled) return;

      switch (e.key) {
        case "Escape":
          onEscape?.();
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, itemCount - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          if (selectedIndex >= 0 && selectedIndex < itemCount) {
            onSelect(selectedIndex);
          }
          break;
      }
    },
    [isEnabled, itemCount, selectedIndex, onSelect, onEscape]
  );

  // 선택된 항목으로 스크롤
  useEffect(() => {
    if (scrollRef.current && selectedIndex >= 0 && itemCount > 0) {
      const selectedElement = scrollRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex, itemCount]);

  // 결과가 변경되면 선택 인덱스 초기화
  useEffect(() => {
    setSelectedIndex(0);
  }, [itemCount]);

  const reset = () => {
    setSelectedIndex(0);
  };

  return {
    selectedIndex,
    setSelectedIndex,
    reset,
    handleKeyDown,
    scrollRef,
  };
}

