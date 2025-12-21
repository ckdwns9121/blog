'use client';

import { useState } from 'react';
import { SearchModal } from './SearchModal';
import { useSearchShortcut } from '../hooks/useSearchShortcut';
import { BlogPost } from '@/entities/post/model';

interface SearchButtonProps {
  posts: BlogPost[];
  className?: string;
  children?: React.ReactNode;
}

export function SearchButton({ posts, className, children }: SearchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Keyboard shortcut to open search modal
  useSearchShortcut(() => setIsModalOpen(true));

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={className}
        aria-label="검색"
      >
        {children || (
          <svg
            className="h-5 w-5 text-gray-400"
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
        )}
      </button>

      <SearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        posts={posts}
      />
    </>
  );
}