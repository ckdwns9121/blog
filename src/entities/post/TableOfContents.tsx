"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { TableOfContentsItem } from "@/features/notion";

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  className?: string;
}

export default function TableOfContents({ items, className = "" }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Intersection Observer 설정
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px", // 상단 80px(헤더 높이), 하단 80%에서 감지
        threshold: 0,
      }
    );

    // 모든 헤딩 요소 관찰
    const headingElements = items.map((item) => document.getElementById(item.id)).filter((el) => el !== null);

    headingElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      headingElements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [items]);

  // 활성화된 항목이 보이도록 스크롤
  useEffect(() => {
    if (activeId) {
      const activeElement = document.querySelector(`a[href="#${activeId}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [activeId]);

  if (!items || items.length === 0) {
    return null;
  }

  const renderTocItem = (item: TableOfContentsItem, index: number) => {
    // Tailwind의 정적 클래스 사용 (동적 클래스는 작동하지 않음)
    const indentClasses: Record<number, string> = {
      1: "",
      2: "ml-4",
      3: "ml-8",
      4: "ml-12",
      5: "ml-16",
      6: "ml-20",
    };

    const indentClass = indentClasses[item.level] || "";
    const isActive = activeId === item.id;

    return (
      <li key={item.id || index} className={`${indentClass} mb-1`}>
        <Link
          href={`#${item.id}`}
          className={`block py-1 px-2 text-sm rounded transition-all ${
            isActive
              ? "text-primary-700 font-semibold dark:text-primary-300 "
              : "text-gray-600 hover:text-primary-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-primary-400 dark:hover:bg-gray-800"
          }`}
        >
          {item.title}
        </Link>
      </li>
    );
  };

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">목차</h3>
      <nav className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-1 pr-2">
        <ul className="space-y-1">{items.map((item, index) => renderTocItem(item, index))}</ul>
      </nav>
    </div>
  );
}
