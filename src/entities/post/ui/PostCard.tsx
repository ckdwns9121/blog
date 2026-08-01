import Link from "next/link";
import { PostThumbnail } from "./PostThumbnail";
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
        className="flex items-start gap-4 py-5 sm:gap-5"
        aria-label={post.title}
      >
        <PostThumbnail
          slug={post.slug}
          title={post.title}
          coverImage={post.coverImage}
          className="aspect-[4/3] w-24 sm:w-32"
        />

        <div className="min-w-0 flex-1">
          <time
            dateTime={post.publishedAt.toISOString()}
            className="text-fg-subtle mb-1.5 block text-xs tabular-nums"
          >
            {formatDate(post.publishedAt)}
          </time>

          <h2 className="text-fg group-hover:text-primary-600 dark:group-hover:text-primary-400 mb-1 text-lg leading-snug font-semibold transition-colors">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="line-clamp-2 hidden text-sm leading-6 text-fg-muted sm:block">{post.excerpt}</p>
          )}

          {post.tags.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
              {post.tags.slice(0, 3).map((tag) => (
                <li key={tag.slug} className="text-fg-subtle text-xs">
                  #{tag.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Link>
    </article>
  );
}
