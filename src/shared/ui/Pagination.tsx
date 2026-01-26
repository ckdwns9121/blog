import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const getRange = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const ELLIPSIS = -1;

    // 전체 페이지 범위 생성
    const allPages = Array.from({ length: totalPages }, (_, i) => i + 1);

    // 간단한 경우: 전체 페이지 표시
    if (totalPages <= maxVisiblePages) {
      return allPages;
    }

    // 복잡한 경우: 페이지 범위 계산

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    // 페이지 세그먼트 구성
    const segments = [
      [1], // 첫 페이지
      startPage > 2 ? [ELLIPSIS] : [], // 첫 생략
      getRange(startPage, endPage), // 현재 페이지 주변
      endPage < totalPages - 1 ? [ELLIPSIS] : [], // 마지막 생략
      [totalPages], // 마지막 페이지
    ];

    return segments.flat();
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex items-center justify-center space-x-2 mt-8" aria-label="페이지네이션">
      {/* 이전 페이지 */}
      <Button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        variant="outline"
        size="sm"
        aria-label="이전 페이지"
      >
        이전
      </Button>

      {/* 페이지 번호들 */}
      {pageNumbers.map((page, index) => (
        <div key={index}>
          {page === -1 ? (
            <span className="px-3 py-2 text-sm font-medium text-muted-foreground">...</span>
          ) : (
            <Button
              onClick={() => onPageChange(page)}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              className={cn(
                currentPage === page && "pointer-events-none"
              )}
              aria-label={`페이지 ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          )}
        </div>
      ))}

      {/* 다음 페이지 */}
      <Button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        variant="outline"
        size="sm"
        aria-label="다음 페이지"
      >
        다음
      </Button>
    </nav>
  );
}
