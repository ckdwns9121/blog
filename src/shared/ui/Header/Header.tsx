"use client";

import { useState, useMemo } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { HeaderPlugin } from "./types";
import { HeaderSection } from "./HeaderSection";
import { cn } from "@/shared/lib/cn";

interface HeaderProps {
  plugins: HeaderPlugin[];
  mobilePlugins?: HeaderPlugin[];
  className?: string;
}

export function Header({ plugins, mobilePlugins = [], className }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 플러그인을 포지션별로 분리
  const leftPlugins = useMemo(() => plugins.filter((p) => p.position === "left"), [plugins]);
  const centerPlugins = useMemo(() => plugins.filter((p) => p.position === "center"), [plugins]);
  const rightPlugins = useMemo(() => plugins.filter((p) => p.position === "right"), [plugins]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className={cn("border-b border-gray-200 dark:border-dark-border", className)}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 좌측 섹션 */}
          <div className="flex items-center gap-4">
            {/* 모바일 메뉴 버튼 */}
              <button
                onClick={toggleMenu}
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                type="button"
                aria-label={isMenuOpen ? "메뉴 닫기" : "메뉴 열기"}
                aria-expanded={isMenuOpen}
              >
              {isMenuOpen ? <XMarkIcon aria-hidden="true" className="h-6 w-6" /> : <Bars3Icon aria-hidden="true" className="h-6 w-6" />}
            </button>

            {/* 좌측 플러그인들 */}
            <HeaderSection plugins={leftPlugins} position="left" className="hidden md:flex" />
          </div>
          {/* 중앙 섹션 */}
          <HeaderSection plugins={centerPlugins} position="center" className="hidden md:flex" />
          {/* 우측 섹션 */}
          <HeaderSection plugins={rightPlugins} position="right" />
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-dark-border py-4">
            {/* 모바일 플러그인들 */}
            {mobilePlugins.map((plugin) => (
              <div key={plugin.id} className="mb-4 last:mb-0">
                {plugin.render()}
              </div>
            ))}

            {/* 기본 네비게이션 링크 */}
            <nav aria-label="모바일 네비게이션" className="flex flex-col space-y-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors text-left"
              >
                Post
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 text-sm font-medium transition-colors text-left"
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
