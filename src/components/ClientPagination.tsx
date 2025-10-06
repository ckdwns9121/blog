"use client";

import { Pagination } from "../components/Pagination";

interface ClientPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ClientPagination({ currentPage, totalPages, onPageChange }: ClientPaginationProps) {
  return <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />;
}
