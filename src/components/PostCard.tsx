import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "../types/notion";

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {post.coverImage && (
        <div className="relative h-48 w-full">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" loading="lazy" />
        </div>
      )}

      <div className="p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
            {post.category.name}
          </span>
          {post.tags.map((tag) => (
            <span
              key={tag.slug}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full"
            >
              #{tag.name}
            </span>
          ))}
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          <Link
            href={`/posts/${post.slug}`}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt && <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">{post.excerpt}</p>}

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <time dateTime={post.publishedAt.toISOString()}>
            {post.publishedAt.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>

          {post.readingTime > 0 && <span>{post.readingTime}분 읽기</span>}
        </div>
      </div>
    </article>
  );
}
