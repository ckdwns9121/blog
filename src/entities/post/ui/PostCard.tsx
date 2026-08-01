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
    <article className="border-line group border-b last:border-b-0">
      <Link
        href={`/posts/${post.slug}`}
        onClick={onNavigate}
        className="flex flex-col gap-1 py-4 sm:flex-row-reverse sm:items-baseline sm:justify-end sm:gap-6"
        aria-label={post.title}
      >
        <time dateTime={post.publishedAt.toISOString()} className="text-fg-subtle shrink-0 text-xs tabular-nums">
          {formatDate(post.publishedAt)}
        </time>

        <div className="min-w-0 sm:flex-1">
          <h2 className="text-fg group-hover:text-primary-600 dark:group-hover:text-primary-400 text-base leading-snug font-medium transition-colors">
            {post.title}
          </h2>

          {post.excerpt && <p className="text-fg-muted mt-1 truncate text-sm leading-6">{post.excerpt}</p>}
        </div>
      </Link>
    </article>
  );
}
