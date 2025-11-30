"use client";

import { useEffect, useRef, useState } from "react";

export function ScrollProgress() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const updateScrollProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      // 값이 변경된 경우에만 상태 업데이트
      if (Math.abs(lastScrollY.current - scrollPercent) > 0.1) {
        setScrollProgress(scrollPercent);
        lastScrollY.current = scrollPercent;
      }
    };

    const handleScroll = () => {
      // 이전 애니메이션 프레임이 있으면 취소
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      // requestAnimationFrame으로 다음 프레임에 업데이트 예약
      rafRef.current = requestAnimationFrame(updateScrollProgress);
    };

    // 초기 실행
    updateScrollProgress();

    // 스크롤 이벤트 리스너 (passive 옵션으로 성능 최적화)
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      // 컴포넌트 언마운트 시 예약된 애니메이션 프레임 취소
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-gray-200 dark:bg-dark-border">
      <div
        className="h-full bg-primary-600 dark:bg-primary-500 transition-transform duration-100 ease-out will-change-transform"
        style={{
          transform: `scaleX(${scrollProgress / 100})`,
          transformOrigin: "left",
        }}
      />
    </div>
  );
}
