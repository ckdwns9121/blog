import type { SearchablePost } from '@/features/search/model/searchDocument';
import { BlogSearch } from './search';

const posts: SearchablePost[] = [
  {
    id: 'search-post',
    title: '웹 검색 만들기',
    slug: 'build-search',
    excerpt: '빠른 클라이언트 검색',
    publishedAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    tags: [{ name: '리액트', slug: 'react', postCount: 1 }],
    coverImage: undefined,
    content: [],
    toc: [],
    searchText: '본문에만 기록된 오로라프로토콜 설명',
  },
  {
    id: 'other-post',
    title: '타입스크립트 설정',
    slug: 'typescript-config',
    excerpt: '컴파일러 옵션 안내',
    publishedAt: new Date('2026-06-01T00:00:00.000Z'),
    updatedAt: new Date('2026-06-02T00:00:00.000Z'),
    tags: [{ name: '타입스크립트', slug: 'typescript', postCount: 1 }],
    content: [],
    toc: [],
    searchText: '엄격한 타입 검사를 설정합니다',
  },
];

describe('BlogSearch', () => {
  const search = new BlogSearch(posts);

  it.each([
    ['title', '웹'],
    ['excerpt', '클라이언트'],
    ['tag name', '리액트'],
    ['body search text', '오로라프로토콜'],
  ])('matches a term from %s', (_field, query) => {
    expect(search.search(query).map(({ post }) => post.id)).toContain(
      'search-post',
    );
  });

  it('allows a one-character Korean query', () => {
    expect(search.search('웹').map(({ post }) => post.id)).toContain(
      'search-post',
    );
  });

  it('returns every post for an empty query', () => {
    expect(search.search('')).toHaveLength(posts.length);
    expect(search.search('   ')).toHaveLength(posts.length);
  });

  it('returns nothing for an unrelated query', () => {
    expect(search.search('해저화산관측위성')).toEqual([]);
  });
});
