import Link from "next/link";
import type { PostMetadata } from "../model/usePostsQuery";

interface PostCardProps {
  post: PostMetadata;
}

// test
export function PostCard({ post }: PostCardProps) {
  return (
    <article className="py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            <Link
              href={`/posts/${post.slug}`}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {post.title}
            </Link>
          </h2>

          {post.excerpt && <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{post.excerpt}</p>}

        </div>

        <div className="md:ml-4 md:flex-shrink-0">
          <time dateTime={post.publishedAt.toISOString()} className="text-xs text-gray-500 dark:text-gray-400">
            {post.publishedAt.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 md:max-w-[220px] md:justify-end">
              {post.tags.map((tag) => (
                <span
                  key={tag.slug}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
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
