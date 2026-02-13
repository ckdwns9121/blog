'use client';

import { useState } from 'react';
import { SearchModal } from './SearchModal';
import { useSearchShortcut } from '../hooks/useSearchShortcut';
import { BlogPost } from '@/entities/post/model';

interface SearchButtonProps {
  className?: string;
  children?: React.ReactNode;
}

interface SearchPostResponse {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  tags: { name: string; slug: string; postCount: number }[];
  coverImage?: string;
}

export function SearchButton({ className, children }: SearchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = async () => {
    setIsModalOpen(true);

    if (posts.length > 0 || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/search/posts');
      if (!response.ok) {
        throw new Error('Failed to load search posts');
      }

      const data = (await response.json()) as SearchPostResponse[];
      const mappedPosts: BlogPost[] = data.map((post) => ({
        ...post,
        publishedAt: new Date(post.publishedAt),
        updatedAt: new Date(post.updatedAt),
        content: [],
        toc: [],
      }));

      setPosts(mappedPosts);
    } catch (error) {
      console.error('Failed to load search posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut to open search modal
  useSearchShortcut(openModal);

  return (
    <>
      <button
        onClick={openModal}
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
        isLoading={isLoading}
      />
    </>
  );
}
