import Link from "next/link";
import type { BlogPost } from "../../shared/types/notion";

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            <Link
              href={`/posts/${post.slug}`}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {post.title}
            </Link>
          </h2>

          {post.excerpt && <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{post.excerpt}</p>}

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
              {post.category.name}
            </span>

            {post.tags.map((tag) => (
              <span
                key={tag.slug}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        </div>

        <time
          dateTime={post.publishedAt.toISOString()}
          className="text-xs text-gray-500 dark:text-gray-400 ml-4 flex-shrink-0"
        >
          {post.publishedAt.toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </div>
    </article>
  );
}
