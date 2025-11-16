import Link from "next/link";
import type { NotionPost } from "@/features/notion/types";

interface SearchResultItemProps {
  post: NotionPost & { score?: number };
  isSelected: boolean;
  onClick: () => void;
}

export function SearchResultItem({ post, isSelected, onClick }: SearchResultItemProps) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      onClick={onClick}
      className={`block p-3 rounded-lg transition-colors ${
        isSelected
          ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {post.excerpt}
            </p>
          )}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.slug}
                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
          {new Date(post.publishedAt).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "short",
          })}
        </div>
      </div>
    </Link>
  );
}

