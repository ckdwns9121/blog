import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { SearchPostsState } from '@/features/search/api/searchPosts';
import type { SearchablePost } from '@/features/search/model/searchDocument';
import { SearchModal } from './SearchModal';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../../../components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
}));

const post: SearchablePost = {
  id: 'post-1',
  title: '검색 포스트',
  slug: 'search-post',
  excerpt: '검색 설명',
  publishedAt: new Date('2026-07-01T00:00:00.000Z'),
  updatedAt: new Date('2026-07-02T00:00:00.000Z'),
  tags: [{ name: '검색', slug: 'search', postCount: 1 }],
  content: [],
  toc: [],
  searchText: '본문 전용 단어',
};

function renderModal(state: SearchPostsState, onRetry = jest.fn()) {
  render(
    <SearchModal
      isOpen
      onClose={jest.fn()}
      state={state}
      onRetry={onRetry}
    />,
  );

  return { onRetry };
}

describe('SearchModal', () => {
  it('shows loading instead of empty results even when a query is present', () => {
    renderModal({ status: 'loading' });
    fireEvent.change(screen.getByRole('searchbox', { name: '포스트 검색' }), {
      target: { value: '없는 검색어' },
    });

    expect(screen.getByText('검색 데이터를 불러오는 중...')).toBeInTheDocument();
    expect(screen.queryByText('검색 결과가 없습니다')).not.toBeInTheDocument();
  });

  it('shows a distinct retryable error instead of empty results', () => {
    const onRetry = jest.fn();
    renderModal(
      { status: 'error', error: new Error('network failure') },
      onRetry,
    );

    expect(screen.getByText('검색 데이터를 불러오지 못했습니다')).toBeInTheDocument();
    expect(screen.queryByText('검색 결과가 없습니다')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the ordinary empty state only after a successful load', () => {
    renderModal({ status: 'success', posts: [post] });
    fireEvent.change(screen.getByRole('searchbox', { name: '포스트 검색' }), {
      target: { value: '해저화산관측위성' },
    });

    expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
    expect(screen.queryByText('검색 데이터를 불러오는 중...')).not.toBeInTheDocument();
    expect(screen.queryByText('검색 데이터를 불러오지 못했습니다')).not.toBeInTheDocument();
  });

  it('keeps an empty successful dataset distinct from idle and loading', () => {
    renderModal({ status: 'success', posts: [] });

    expect(screen.getByText('검색할 포스트가 없습니다')).toBeInTheDocument();
    expect(screen.queryByText('검색을 준비하는 중...')).not.toBeInTheDocument();
    expect(screen.queryByText('검색 데이터를 불러오는 중...')).not.toBeInTheDocument();
  });

  it('renders every search result as a full-width row', () => {
    renderModal({ status: 'success', posts: [post] });

    const result = screen.getByRole('button', { name: /검색 포스트/ });
    expect(result).toHaveClass('w-full');
  });

  it('does not render a second clear icon inside the search field', () => {
    renderModal({ status: 'success', posts: [post] });
    fireEvent.change(screen.getByRole('searchbox', { name: '포스트 검색' }), {
      target: { value: '검색' },
    });

    expect(screen.queryByRole('button', { name: '검색어 지우기' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: '포스트 검색' })).toHaveAttribute(
      'type',
      'text',
    );
  });
});
