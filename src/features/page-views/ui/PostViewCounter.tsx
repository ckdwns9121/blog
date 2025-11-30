"use client";

import { useEffect } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { usePostViews } from "../hooks/usePostViews";

interface PostViewCounterProps {
  slug: string;
  className?: string;
}

/**
 * 포스트 조회수 표시 및 증가 컴포넌트
 *
 * 동작 방식:
 * 1. usePostViews 훅을 통해 조회수 데이터 관리
 * 2. 컴포넌트 마운트 시 조회수 증가
 * 3. 조회수 실시간 표시
 */
export default function PostViewCounter({ slug, className = "" }: PostViewCounterProps) {
  const { views, isLoading, incrementViews } = usePostViews(slug);

  // 컴포넌트 마운트 시 조회수 증가
  useEffect(() => {
    incrementViews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // 로딩 중이거나 조회수를 가져오지 못한 경우
  if (isLoading || views === null || views === undefined) {
    return (
      <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
        <EyeIcon className="w-4 h-4" />
        <span>---</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      <EyeIcon className="w-4 h-4" />
      <span>{views.toLocaleString()} views</span>
    </div>
  );
}
