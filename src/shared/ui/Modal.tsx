"use client";

import { useEffect, ReactNode } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string; // 모달 최대 너비 (기본값: max-w-7xl)
}

/**
 * 범용 모달 컴포넌트
 * children으로 받은 컨텐츠를 모달로 표시
 */
export function Modal({ isOpen, onClose, children, maxWidth = "max-w-7xl" }: ModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dimmed 배경 */}
      <div className="absolute inset-0 bg-black/75 dark:bg-black/90" />

      {/* 모달 컨텐츠 */}
      <div
        className={`relative z-10 ${maxWidth} max-h-[90vh] w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors"
          aria-label="닫기"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* 컨텐츠 */}
        {children}
      </div>
    </div>
  );
}

