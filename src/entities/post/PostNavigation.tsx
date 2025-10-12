import React from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { BlogPost } from "@/features/notion";

interface PostNavigationProps {
  previousPost?: BlogPost;
  nextPost?: BlogPost;
  className?: string;
}

export default function PostNavigation({ previousPost, nextPost, className = "" }: PostNavigationProps) {
  if (!previousPost && !nextPost) {
    return null;
  }

  return (
    <nav className={`py-8 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex justify-between items-center">
        {/* 이전 포스트 */}
        <div className="flex-1">
          {previousPost ? (
            <Link
              href={`/posts/${previousPost.slug}`}
              className="group flex items-center space-x-3 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-500">이전 글</div>
                <div className="font-medium truncate">{previousPost.title}</div>
              </div>
            </Link>
          ) : (
            <div></div>
          )}
        </div>

        {/* 다음 포스트 */}
        <div className="flex-1 text-right">
          {nextPost ? (
            <Link
              href={`/posts/${nextPost.slug}`}
              className="group flex items-center justify-end space-x-3 text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
            >
              <div className="min-w-0 flex-1 text-right">
                <div className="text-sm text-gray-500 dark:text-gray-500">다음 글</div>
                <div className="font-medium truncate">{nextPost.title}</div>
              </div>
              <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </Link>
          ) : (
            <div></div>
          )}
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="md:hidden space-y-4">
        {/* 이전 포스트 */}
        {previousPost && (
          <Link
            href={`/posts/${previousPost.slug}`}
            className="group block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <ChevronLeftIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">이전 글</div>
                <div className="font-medium text-gray-900 dark:text-white line-clamp-2">{previousPost.title}</div>
              </div>
            </div>
          </Link>
        )}

        {/* 다음 포스트 */}
        {nextPost && (
          <Link
            href={`/posts/${nextPost.slug}`}
            className="group block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">다음 글</div>
                <div className="font-medium text-gray-900 dark:text-white line-clamp-2">{nextPost.title}</div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            </div>
          </Link>
        )}
      </div>
    </nav>
  );
}
