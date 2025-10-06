import React from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { BlogPost } from "../../shared/types/notion";

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
    <nav
      className={`flex justify-between items-center py-8 border-t border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* 이전 포스트 */}
      <div className="flex-1">
        {previousPost ? (
          <Link
            href={`/posts/${previousPost.slug}`}
            className="group flex items-center space-x-3 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-500">이전 글</div>
              <div className="font-medium truncate max-w-xs">{previousPost.title}</div>
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
            className="group flex items-center justify-end space-x-3 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          >
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-500">다음 글</div>
              <div className="font-medium truncate max-w-xs">{nextPost.title}</div>
            </div>
            <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <div></div>
        )}
      </div>
    </nav>
  );
}
