import Link from "next/link";
import type { PostMetadata } from "../model/usePostsQuery";

interface PostCardProps {
  post: PostMetadata;
  onNavigate?: () => void;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function PostCard({ post, onNavigate }: PostCardProps) {
  return (
    <article className="border-b border-gray-200 py-7 dark:border-gray-800">
      <div className="max-w-3xl">
        <div className="min-w-0">
          <time dateTime={post.publishedAt.toISOString()} className="mb-2 block text-sm font-semibold text-gray-400 sm:text-base dark:text-gray-500">
            {formatDate(post.publishedAt)}
          </time>

          <h2 className="mb-2 text-xl font-bold leading-tight text-gray-950 sm:text-2xl dark:text-gray-50">
            <Link
              href={`/posts/${post.slug}`}
              onClick={onNavigate}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {post.title}
            </Link>
          </h2>

          {post.excerpt && <p className="mb-4 text-base leading-[1.5] text-gray-500 line-clamp-2 sm:text-lg dark:text-gray-400">{post.excerpt}</p>}

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 sm:px-3 sm:py-1.5 sm:text-sm dark:bg-gray-800 dark:text-gray-400"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
