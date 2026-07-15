"use client";

import { useState } from "react";
import { Bars3Icon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { TableOfContentsItem } from "@/entities/post/model";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <DialogTrigger asChild>
          <button
          type="button"
          className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-full shadow-lg transition-colors"
          aria-label="목차 열기"
        >
          <Bars3Icon aria-hidden="true" className="w-6 h-6" />
        </button>
        </DialogTrigger>
      </div>

      <DialogContent
        className="top-auto bottom-0 left-0 w-full max-w-none translate-x-0 translate-y-0 rounded-b-none rounded-t-2xl border-x-0 border-b-0 p-0 sm:max-w-none lg:hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">목차</DialogTitle>
          <DialogDescription className="sr-only">글의 각 제목으로 이동할 수 있습니다.</DialogDescription>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          <nav aria-label="글 목차" className="space-y-1">
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
      </DialogContent>
    </Dialog>
  );
}
