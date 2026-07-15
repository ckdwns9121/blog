"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HeaderPlugin } from '../types';

function NavigationLinks() {
  const pathname = usePathname();
  const isPostActive = pathname === "/" || pathname.startsWith("/posts");
  const isAboutActive = pathname === "/about";

  const getLinkClassName = (isActive: boolean) =>
    `text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-2 text-sm transition-colors ${
      isActive ? "font-bold text-gray-950 dark:text-white" : "font-medium"
    }`;

  return (
    <nav aria-label="주요 네비게이션" className="hidden md:flex items-center gap-5">
      <Link href="/" aria-current={isPostActive ? "page" : undefined} className={getLinkClassName(isPostActive)}>
        Post
      </Link>
      <Link href="/about" aria-current={isAboutActive ? "page" : undefined} className={getLinkClassName(isAboutActive)}>
        About
      </Link>
    </nav>
  );
}

export function createNavigationPlugin(): HeaderPlugin {
  return {
    id: 'navigation',
    name: '네비게이션',
    position: 'right',
    priority: 10,
    render: () => <NavigationLinks />,
  };
}
