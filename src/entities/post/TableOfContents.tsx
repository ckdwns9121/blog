"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { TableOfContentsItem } from "@/features/notion";

interface TableOfContentsProps {
  items: TableOfContentsItem[];
  className?: string;
}

const indentClasses: Record<number, string> = {
  1: "",
  2: "ml-2",
  3: "ml-4",
  4: "ml-6",
  5: "ml-8",
  6: "ml-10",
} as const;

export default function TableOfContents({ items, className = "" }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-80px 0px -80% 0px",
        threshold: 0,
      }
    );

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

  // 활성화된 항목이 목차 영역 내에서만 보이도록 스크롤
  useEffect(() => {
    if (activeId && navRef.current) {
      const activeLink = navRef.current.querySelector(`a[href="#${activeId}"]`);
      if (activeLink && navRef.current) {
        const container = navRef.current;
        const linkRect = activeLink.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 링크가 컨테이너 밖에 있는 경우에만 스크롤
        if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
          const scrollOffset = linkRect.top - containerRect.top - container.clientHeight / 2 + linkRect.height / 2;

          container.scrollTo({
            top: container.scrollTop + scrollOffset,
            behavior: "smooth",
          });
        }
      }
    }
  }, [activeId]);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">목차</h3>
      <nav
        ref={navRef}
        className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-1 pr-2"
        style={{ scrollBehavior: "smooth" }}
      >
        <ul className="space-y-1">
          {items.map((item, index) => (
            <TocItem key={item.id || index} item={item} index={index} activeId={activeId} />
          ))}
        </ul>
      </nav>
    </div>
  );
}

const TocItem = ({ item, index, activeId }: { item: TableOfContentsItem; index: number; activeId: string }) => {
  // Tailwind의 정적 클래스 사용 (동적 클래스는 작동하지 않음)

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
