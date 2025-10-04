"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "../components/Pagination";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function ClientPagination({ currentPage, totalPages }: ClientPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    // 현재 검색 파라미터 유지하면서 페이지만 변경
    const params = new URLSearchParams(searchParams.toString());

    if (page === 1) {
      params.delete("page");
    } else {
      params.set("page", page.toString());
    }

    router.push(`/?${params.toString()}`);
  };

  return <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />;
}
