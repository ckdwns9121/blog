'use client';

import { HeaderPlugin } from '@/shared/ui/Header/types';
import { BlogPost } from '@/entities/post/model';
import { SearchButton } from '@/features/search/ui/SearchButton';
import { ThemeToggle } from '@/shared/ui/Header/plugins/ThemeToggle';
import Link from 'next/link';

// 로고 플러그인
export function createLogoPlugin(): HeaderPlugin {
  return {
    id: 'logo',
    name: '로고',
    position: 'left',
    priority: 20,
    render: () => (
      <div className="hidden md:flex items-center">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-gray-900 dark:text-white">{`<Changjun.blog/>`}</span>
        </Link>
      </div>
    ),
  };
}

// 네비게이션 플러그인
export function createNavigationPlugin(): HeaderPlugin {
  return {
    id: 'navigation',
    name: '네비게이션',
    position: 'center',
    priority: 10,
    render: () => (
      <nav className="hidden md:flex items-center space-x-8">
        <Link
          href="/"
          className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
        >
          Post
        </Link>
        <Link
          href="/about"
          className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
        >
          About
        </Link>
      </nav>
    ),
  };
}

// 검색 플러그인
export function createSearchPlugin(posts: BlogPost[]): HeaderPlugin {
  return {
    id: 'search',
    name: '검색',
    position: 'right',
    priority: 10,
    render: () => (
      <div className="relative group">
        <SearchButton
          posts={posts}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        />
        <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          검색 (Ctrl+K)
        </div>
      </div>
    ),
  };
}

// 모바일 검색 플러그인
export function createMobileSearchPlugin(posts: BlogPost[]): HeaderPlugin {
  return {
    id: 'mobile-search',
    name: '모바일 검색',
    position: 'left',
    priority: 20,
    render: () => (
      <div className="w-full">
        <SearchButton
          posts={posts}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span>검색</span>
        </SearchButton>
      </div>
    ),
  };
}

// 테마 토글 플러그인
export function createThemeTogglePlugin(): HeaderPlugin {
  return {
    id: 'theme-toggle',
    name: '테마 토글',
    position: 'right',
    priority: 5,
    render: () => <ThemeToggle />,
  };
}