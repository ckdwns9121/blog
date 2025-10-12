"use client";

import { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { TableOfContentsItem } from "@/features/notion";

interface BottomNavigationProps {
  tocItems: TableOfContentsItem[];
}

export default function BottomNavigation({ tocItems }: BottomNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!tocItems || tocItems.length === 0) {
    return null;
  }

  const indentClasses: Record<number, string> = {
    1: "",
    2: "ml-4",
    3: "ml-8",
    4: "ml-12",
    5: "ml-16",
    6: "ml-20",
  } as const;

  return (
    <>
      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-colors"
          aria-label="목차 열기"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* 오버레이 - 투명하게 설정하여 뒤 콘텐츠가 보이도록 */}
      {isOpen && <div className="fixed inset-0 bg-transparent z-50 lg:hidden" onClick={() => setIsOpen(false)} />}

      {/* 모달 */}
      <div
        className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl z-50 transform transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">목차</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="목차 닫기"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* 목차 리스트 */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <nav className="space-y-1">
            {tocItems.map((item, index) => {
              const indentClass = indentClasses[item.level] || "";

              return (
                <Link
                  key={item.id || index}
                  href={`#${item.id}`}
                  onClick={() => setIsOpen(false)}
                  className={`block py-2 px-3 text-sm rounded-lg transition-colors ${indentClass} ${"text-gray-700 hover:text-primary-600 hover:bg-primary-50 dark:text-gray-300 dark:hover:text-primary-400 dark:hover:bg-primary-950"}`}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
}
