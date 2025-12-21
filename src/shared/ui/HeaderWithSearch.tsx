'use client';

import Link from "next/link";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { BlogPost } from "@/entities/post/model";
import { SearchButton } from "@/features/search/ui/SearchButton";
import { SearchInput } from "@/features/search/ui/SearchInput";

interface HeaderWithSearchProps {
  posts: BlogPost[];
}

export function HeaderWithSearch({ posts }: HeaderWithSearchProps) {
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleTheme = () => {
    console.log("Current theme:", theme);
    const newTheme = theme === "dark" ? "light" : "dark";
    console.log("Setting theme to:", newTheme);
    setTheme(newTheme);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="border-b border-gray-200 dark:border-dark-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 모바일: 햄버거 메뉴, 데스크톱: 로고 */}
          <div className="flex items-center gap-4">
            {/* 모바일 햄버거 메뉴 */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="메뉴 토글"
            >
              {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>

            {/* 데스크톱 로고 */}
            <div className="hidden md:flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-gray-900 dark:text-white">{`<Changjun.blog/>`}</span>
              </Link>
            </div>
          </div>

          {/* 네비게이션 메뉴 */}
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

          {/* 검색 및 다크모드 토글 */}
          <div className="flex items-center gap-3">
            {/* 데스크톱 검색 버튼 */}
            <div className="hidden lg:block">
              <div className="relative group">
                <SearchButton
                  posts={posts}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                />
                <div className="absolute right-0 top-full mt-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  검색 (Ctrl+K)
                </div>
              </div>
            </div>

            {/* 다크모드 토글 */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="다크모드 토글"
            >
              {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-dark-border py-4">
            {/* 모바일 검색 버튼 */}
            <div className="mb-4">
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

            <nav className="flex flex-col space-y-2">
              <Link
                href="/search"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                검색 페이지
              </Link>
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                Post
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}