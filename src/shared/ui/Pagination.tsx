interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

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
    const getRange = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

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
    <nav className="flex items-center justify-center space-x-2 mt-8">
      {/* 이전 페이지 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
      >
        이전
      </button>

      {/* 페이지 번호들 */}
      {pageNumbers.map((page, index) => (
        <div key={index}>
          {page === -1 ? (
            <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
          ) : (
            <button
              onClick={() => onPageChange(page)}
              className={`cursor-pointer px-3 py-2 text-sm font-medium rounded-md ${
                currentPage === page
                  ? "text-primary-700 bg-primary-50 dark:bg-primary-900 dark:text-primary-200 border border-primary-300 dark:border-primary-700"
                  : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {page}
            </button>
          )}
        </div>
      ))}

      {/* 다음 페이지 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="cursor-pointer px-3 py-2 text-sm font-medium text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-gray-800"
      >
        다음
      </button>
    </nav>
  );
}
