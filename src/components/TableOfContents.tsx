import React from "react";
import Link from "next/link";
import type { TableOfContentsItem } from "../types/notion";

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  className?: string;
}

export default function TableOfContents({ items, className = "" }: TableOfContentsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const renderTocItem = (item: TableOfContentsItem, index: number) => {
    const indentClass = `ml-${(item.level - 1) * 4}`;

    return (
      <li key={item.id || index} className={`${indentClass} mb-1`}>
        <Link
          href={`#${item.id}`}
          className="block py-1 px-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-gray-800 rounded transition-colors"
        >
          {item.title}
        </Link>
      </li>
    );
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">목차</h3>
      <nav className="space-y-1">
        <ul className="space-y-1">{items.map((item, index) => renderTocItem(item, index))}</ul>
      </nav>
    </div>
  );
}
