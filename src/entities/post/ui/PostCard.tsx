import Link from "next/link";
import { getOptimizedImageUrl } from "@/shared/utils/imageMapper";
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
    <article className="border-line border-b py-7 last:border-b-0 sm:py-9">
      <Link
        href={`/posts/${post.slug}`}
        onClick={onNavigate}
        className="group flex items-start gap-5 sm:gap-9"
        aria-label={post.title}
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-fg group-hover:text-primary-600 dark:group-hover:text-primary-400 text-xl leading-snug font-bold tracking-tight transition-colors sm:text-2xl">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-fg-muted mt-2.5 line-clamp-2 text-sm leading-relaxed sm:text-base">
              {post.excerpt}
            </p>
          )}
        </div>
        {post.coverImage && (
          // External Notion images fall back to their original URL when not mapped at build time.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getOptimizedImageUrl(post.coverImage)}
            alt=""
            width={160}
            height={112}
            loading="lazy"
            decoding="async"
            className="h-20 w-20 shrink-0 rounded-sm object-cover sm:h-28 sm:w-40"
          />
        )}
      </Link>
      <div className="text-fg-muted mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
        <time dateTime={post.publishedAt.toISOString()} className="tabular-nums">
          {formatDate(post.publishedAt)}
        </time>
        {post.tags.slice(0, 2).map((tag) => (
          <a
            key={tag.slug}
            href={`/?tag=${encodeURIComponent(tag.name)}`}
            onClick={onNavigate}
            className="bg-surface-raised hover:text-primary-600 dark:hover:text-primary-400 rounded-full px-2.5 py-1 transition-colors"
          >
            {tag.name}
          </a>
        ))}
      </div>
    </article>
  );
}
