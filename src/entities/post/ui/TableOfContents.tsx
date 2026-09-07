"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { TableOfContentsItem } from "../model";
import { cn } from "@/shared/lib/cn";

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
  // 본문에서 현재 읽고 있는 heading의 id입니다.
  // 이 값으로 목차 링크의 활성 스타일과 aria-current를 함께 갱신합니다.
  const [activeId, setActiveId] = useState<string>("");

  // 본문 스크롤과 별개로 목차 자체가 긴 경우가 있어,
  // 활성 링크를 목차 스크롤 영역 안으로 이동시키는 데 사용합니다.
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Observer 하나로 글 본문의 모든 heading을 관찰합니다.
    // heading이 감지 영역에 들어오면 해당 id를 현재 목차 항목으로 선택합니다.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        // 상단 고정 UI 아래 80px부터 화면 높이의 상단 약 20%까지만
        // 감지 영역으로 사용합니다. heading이 이 좁은 띠를 통과할 때
        // 목차가 바뀌므로 화면 아래의 다음 heading이 너무 일찍 활성화되지 않습니다.
        rootMargin: "-80px 0px -80% 0px",

        // 감지 영역과 조금이라도 교차하면 callback을 실행합니다.
        threshold: 0,
      }
    );

    // 목차를 만들 때 사용한 id와 본문 heading의 id가 같기 때문에,
    // 별도의 DOM 목록을 만들지 않고 실제 heading을 찾아 관찰할 수 있습니다.
    const headingElements = items.map((item) => document.getElementById(item.id)).filter((el) => el !== null);

    // 여러 heading을 같은 Observer 인스턴스에 등록합니다.
    headingElements.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      // 목차가 사라지거나 items가 바뀌면 등록했던 heading만 관찰 해제합니다.
      // unobserve는 대상 하나씩 해제하며, disconnect를 사용하면 이 Observer가
      // 관찰하는 모든 대상이 한 번에 해제됩니다.
      headingElements.forEach((el) => {
        if (el) observer.unobserve(el);
      });
    };
  }, [items]);

  // 본문의 현재 heading이 바뀌어도 해당 목차 링크가 목차 영역 밖에
  // 숨어 있을 수 있습니다. 이 경우에만 목차 컨테이너를 별도로 스크롤합니다.
  useEffect(() => {
    if (activeId && navRef.current) {
      const activeLink = navRef.current.querySelector(`a[href="#${activeId}"]`);
      if (activeLink && navRef.current) {
        const container = navRef.current;
        const linkRect = activeLink.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // 링크가 이미 보인다면 스크롤하지 않아 사용자의 목차 탐색을 방해하지 않습니다.
        if (linkRect.top < containerRect.top || linkRect.bottom > containerRect.bottom) {
          // 활성 링크의 중심과 목차 컨테이너의 중심 차이를 계산해
          // 활성 항목이 목차 가운데에 오도록 이동합니다.
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
    <div className={cn("p-4", className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">목차</h3>
      <nav
        ref={navRef}
        aria-label="글 목차"
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

  // Observer가 선택한 heading id와 링크 대상 id를 비교합니다.
  const isActive = activeId === item.id;

  return (
    <li key={item.id || index} className={`${indentClass} mb-1`}>
      <Link
        href={`#${item.id}`}
        aria-current={isActive ? "location" : undefined}
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
