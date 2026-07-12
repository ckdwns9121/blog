import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { loadSearchPosts } from '@/features/search/api/searchPosts';
import type { SearchablePost } from '@/features/search/model/searchDocument';
import { BlogSearch } from '@/shared/utils/search';
import { SearchResults } from './SearchResults';

jest.mock('../../features/search/api/searchPosts', () => ({
  loadSearchPosts: jest.fn(),
}));

const mockedLoadSearchPosts = jest.mocked(loadSearchPosts);

const posts: SearchablePost[] = [
  {
    id: 'body-match',
    title: '정적 검색 인덱스',
    slug: 'static-search-index',
    excerpt: '빌드 데이터로 검색합니다',
    publishedAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    tags: [{ name: '검색', slug: 'search', postCount: 1 }],
    content: [],
    toc: [],
    searchText: '제목에는 없고 본문에만 있는 오로라프로토콜',
  },
];

describe('SearchResults', () => {
  beforeEach(() => {
    mockedLoadSearchPosts.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not load the corpus until a query is present', () => {
    const { container } = render(<SearchResults query="" />);

    expect(container).toBeEmptyDOMElement();
    expect(mockedLoadSearchPosts).not.toHaveBeenCalled();
  });

  it('renders an explicit loading state while the static dataset is pending', async () => {
    mockedLoadSearchPosts.mockReturnValue(new Promise(() => undefined));

    render(<SearchResults query="오로라프로토콜" />);

    expect(
      await screen.findByText('검색 데이터를 불러오는 중...'),
    ).toBeInTheDocument();
    expect(mockedLoadSearchPosts).toHaveBeenCalledTimes(1);
  });

  it('renders a result matched only by body search text', async () => {
    mockedLoadSearchPosts.mockResolvedValue(posts);

    render(<SearchResults query="오로라프로토콜" />);

    expect(
      await screen.findByRole('link', { name: /정적 검색 인덱스/ }),
    ).toHaveAttribute('href', '/posts/static-search-index');
  });

  it('reuses the loaded corpus and Fuse index when the query changes', async () => {
    mockedLoadSearchPosts.mockResolvedValue(posts);
    const searchInstances = new Set<BlogSearch>();
    const originalSearch = BlogSearch.prototype.search;
    jest
      .spyOn(BlogSearch.prototype, 'search')
      .mockImplementation(function (this: BlogSearch, query: string) {
        searchInstances.add(this);
        return originalSearch.call(this, query);
      });

    const { rerender } = render(<SearchResults query="오로라프로토콜" />);
    await screen.findByRole('link', { name: /정적 검색 인덱스/ });

    rerender(<SearchResults query="정적" />);
    await waitFor(() =>
      expect(screen.getByText('"정적" 검색 결과 1개')).toBeInTheDocument(),
    );

    expect(mockedLoadSearchPosts).toHaveBeenCalledTimes(1);
    expect(searchInstances.size).toBe(1);
  });

  it('renders an explicit error and retries the shared loader', async () => {
    mockedLoadSearchPosts
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(posts);

    render(<SearchResults query="오로라프로토콜" />);

    expect(
      await screen.findByText('검색 데이터를 불러오지 못했습니다'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(
      await screen.findByRole('link', { name: /정적 검색 인덱스/ }),
    ).toBeInTheDocument();
    expect(mockedLoadSearchPosts).toHaveBeenCalledTimes(2);
  });
});
