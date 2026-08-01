import React from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { BlogPost } from "@/entities/post/model";

interface PostNavigationProps {
  previousPost?: BlogPost;
  nextPost?: BlogPost;
  className?: string;
}

interface NavigationItemProps {
  post: BlogPost;
  direction: "previous" | "next";
}

/**
 * 이전/다음 글 하나를 박스로 렌더링한다.
 *
 * 이전에는 두 글을 가로로 나란히 두고 truncate로 잘랐는데, 바깥 flex
 * 아이템에 min-w-0이 없어 제목이 자기 칸을 넘어 서로 붙어 버렸다.
 * 세로로 쌓고 line-clamp로 두 줄까지 접어 넘칠 수 없게 한다.
 */
function NavigationItem({ post, direction }: NavigationItemProps) {
  const isPrevious = direction === "previous";
  const Chevron = isPrevious ? ChevronLeftIcon : ChevronRightIcon;

  return (
    <Link
      href={`/posts/${post.slug}`}
      className={`group border-line hover:border-primary-600 dark:hover:border-primary-400 flex items-center gap-3 border p-4 transition-colors ${
        isPrevious ? "" : "flex-row-reverse"
      }`}
    >
      <Chevron
        aria-hidden="true"
        className={`text-fg-subtle group-hover:text-primary-600 dark:group-hover:text-primary-400 h-5 w-5 shrink-0 transition-all ${
          isPrevious ? "group-hover:-translate-x-1" : "group-hover:translate-x-1"
        }`}
      />

      <div className={`min-w-0 flex-1 ${isPrevious ? "" : "text-right"}`}>
        <span className="text-fg-subtle block text-xs">{isPrevious ? "이전 글" : "다음 글"}</span>
        <span className="text-fg group-hover:text-primary-600 dark:group-hover:text-primary-400 mt-1 block line-clamp-2 font-medium transition-colors">
          {post.title}
        </span>
      </div>
    </Link>
  );
}

export default function PostNavigation({ previousPost, nextPost, className = "" }: PostNavigationProps) {
  if (!previousPost && !nextPost) {
    return null;
  }

  return (
    <nav aria-label="글 이동" className={`border-line border-t py-8 ${className}`}>
      <ul className="flex flex-col gap-3">
        {previousPost && (
          <li>
            <NavigationItem post={previousPost} direction="previous" />
          </li>
        )}
        {nextPost && (
          <li>
            <NavigationItem post={nextPost} direction="next" />
          </li>
        )}
      </ul>
    </nav>
  );
}
