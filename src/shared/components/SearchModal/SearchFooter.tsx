interface SearchFooterProps {
  resultCount: number;
}

export function SearchFooter({ resultCount }: SearchFooterProps) {
  if (resultCount === 0) return null;

  return (
    <div className="px-4 py-2 border-t border-gray-200 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
      <span>{resultCount}개의 결과</span>
      <span>↑↓ 이동 · Enter 선택 · Esc 닫기</span>
    </div>
  );
}

