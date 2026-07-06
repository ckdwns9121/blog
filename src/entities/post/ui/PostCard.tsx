import Link from "next/link";
import Image from "next/image";
import type { PostMetadata } from "../model/usePostsQuery";

interface PostCardProps {
  post: PostMetadata;
}

const thumbnailThemes = [
  {
    surface: "bg-[#e8edf5] dark:bg-[#1f2937]",
    mark: "text-[#36577e] dark:text-[#93b4df]",
    caption: "text-[#8292aa] dark:text-[#9caec7]",
    symbol: "?",
  },
  {
    surface: "bg-[#e8f1ec] dark:bg-[#17251d]",
    mark: "text-primary-700 dark:text-primary-300",
    caption: "text-primary-700/60 dark:text-primary-200/70",
    symbol: "</>",
  },
  {
    surface: "bg-[#f1eee8] dark:bg-[#2a241c]",
    mark: "text-[#755f3a] dark:text-[#d6bd8c]",
    caption: "text-[#8b7b62] dark:text-[#d0b98a]",
    symbol: "#",
  },
];

function getThumbnailTheme(post: PostMetadata) {
  const source = post.tags[0]?.name || post.title;
  const charSum = Array.from(source).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return thumbnailThemes[charSum % thumbnailThemes.length];
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function PostCard({ post }: PostCardProps) {
  const thumbnailTheme = getThumbnailTheme(post);
  const thumbnailCaption = post.tags.slice(0, 2).map((tag) => tag.slug || tag.name).join(" · ");

  return (
    <article className="border-b border-gray-200 py-7 dark:border-gray-800">
      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-4 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-5 md:grid-cols-[148px_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_180px]">
        <Link
          href={`/posts/${post.slug}`}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-lg lg:order-2"
          aria-label={`${post.title} 포스트 보기`}
        >
          {post.coverImage ? (
            <Image
              src={post.coverImage}
              alt=""
              fill
              sizes="(max-width: 640px) 112px, (max-width: 768px) 132px, (max-width: 1024px) 148px, 180px"
              className="object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className={`flex h-full w-full flex-col justify-between p-3 sm:p-4 ${thumbnailTheme.surface}`}>
              <span className={`text-2xl font-black leading-none sm:text-3xl ${thumbnailTheme.mark}`}>{thumbnailTheme.symbol}</span>
              {thumbnailCaption && (
                <span className={`truncate font-mono text-[10px] font-semibold sm:text-xs ${thumbnailTheme.caption}`}>{thumbnailCaption}</span>
              )}
            </div>
          )}
        </Link>

        <div className="min-w-0 lg:order-1">
          <time dateTime={post.publishedAt.toISOString()} className="mb-2 block text-sm font-semibold text-gray-400 sm:text-base dark:text-gray-500">
            {formatDate(post.publishedAt)}
          </time>

          <h2 className="mb-2 text-xl font-bold leading-tight text-gray-950 sm:text-2xl dark:text-gray-50">
            <Link
              href={`/posts/${post.slug}`}
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
                  className="rounded-md bg-[#efe8dc] px-2.5 py-1 text-xs font-medium text-[#6f6253] sm:px-3 sm:py-1.5 sm:text-sm dark:bg-gray-800 dark:text-gray-400"
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
