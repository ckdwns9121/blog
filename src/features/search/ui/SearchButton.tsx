'use client';

import { useCallback, useId, useState } from 'react';
import {
  loadSearchPosts,
  type SearchPostsState,
} from '@/features/search/api/searchPosts';
import { useSearchShortcut } from '../hooks/useSearchShortcut';
import { SearchModal } from './SearchModal';

interface SearchButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function SearchButton({ className, children }: SearchButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [state, setState] = useState<SearchPostsState>({ status: 'idle' });
  const searchDialogId = `search-dialog-${useId().replaceAll(':', '')}`;

  const requestPosts = useCallback(() => {
    setState({ status: 'loading' });
    void loadSearchPosts().then(
      (posts) => setState({ status: 'success', posts }),
      (error: unknown) =>
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        }),
    );
  }, []);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    if (state.status === 'idle') {
      requestPosts();
    }
  }, [requestPosts, state.status]);

  useSearchShortcut(openModal);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={className}
        aria-label="검색"
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        aria-controls={searchDialogId}
      >
        {children || (
          <svg
            aria-hidden="true"
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
        state={state}
        onRetry={requestPosts}
        contentId={searchDialogId}
      />
    </>
  );
}
