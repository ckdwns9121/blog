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
    <article className="border-b border-gray-200 py-4 last:border-b-0 dark:border-gray-800">
      <div className="max-w-3xl">
        <div className="min-w-0">
          <time dateTime={post.publishedAt.toISOString()} className="mb-1.5 block text-xs text-gray-500 dark:text-gray-400">
            {formatDate(post.publishedAt)}
          </time>

          <h2 className="mb-1 text-lg font-semibold leading-snug text-gray-900 dark:text-white">
            <Link
              href={`/posts/${post.slug}`}
              onClick={onNavigate}
              className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {post.title}
            </Link>
          </h2>

          {post.excerpt && <p className="line-clamp-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{post.excerpt}</p>}
        </div>
      </div>
    </article>
  );
}
