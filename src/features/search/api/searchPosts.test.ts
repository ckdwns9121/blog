import {
  loadSearchPosts,
  resetSearchPostsCache,
} from './searchPosts';

const validDocument = {
  id: 'post-1',
  title: '정적 검색',
  slug: 'static-search',
  excerpt: '검색 설명',
  publishedAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-02T00:00:00.000Z',
  tags: [{ name: '검색', slug: 'search', postCount: 1 }],
  coverImage: '/cover.png',
  searchText: '본문에만 있는 오로라프로토콜',
};

function jsonResponse(payload: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('loadSearchPosts', () => {
  beforeEach(() => {
    resetSearchPostsCache();
  });

  it('shares one in-flight request between concurrent callers', async () => {
    let resolveResponse!: (response: Response) => void;
    const fetchSearchIndex = jest.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve;
        }),
    );

    const first = loadSearchPosts(fetchSearchIndex);
    const second = loadSearchPosts(fetchSearchIndex);

    expect(first).toBe(second);
    expect(fetchSearchIndex).toHaveBeenCalledTimes(1);
    expect(fetchSearchIndex).toHaveBeenCalledWith('/search-index.json', {
      cache: 'no-cache',
    });

    resolveResponse(jsonResponse([validDocument]));
    await expect(first).resolves.toHaveLength(1);
  });

  it('hydrates valid documents without dropping body search text', async () => {
    const fetchSearchIndex = jest.fn().mockResolvedValue(
      jsonResponse([validDocument]),
    );

    const [post] = await loadSearchPosts(fetchSearchIndex);

    expect(post.publishedAt).toBeInstanceOf(Date);
    expect(post.updatedAt).toBeInstanceOf(Date);
    expect(post.searchText).toBe(validDocument.searchText);
  });

  it.each([
    [
      'a non-2xx response',
      jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
      } as Response),
      'HTTP 503',
    ],
    [
      'a network failure',
      jest.fn().mockRejectedValue(new Error('offline')),
      'offline',
    ],
    [
      'malformed JSON',
      jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
      } as unknown as Response),
      'invalid JSON',
    ],
    [
      'an invalid schema',
      jest.fn().mockResolvedValue(jsonResponse([{ id: 'missing-fields' }])),
      '검색',
    ],
    [
      'an invalid ISO date',
      jest.fn().mockResolvedValue(
        jsonResponse([{ ...validDocument, publishedAt: 'July 1, 2026' }]),
      ),
      'publishedAt',
    ],
  ])('rejects clearly for %s', async (_label, fetchSearchIndex, message) => {
    await expect(loadSearchPosts(fetchSearchIndex)).rejects.toThrow(message);
  });

  it('evicts a rejected request so a retry can fetch again', async () => {
    const fetchSearchIndex = jest
      .fn()
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValueOnce(jsonResponse([validDocument]));

    await expect(loadSearchPosts(fetchSearchIndex)).rejects.toThrow(
      'temporary outage',
    );
    await expect(loadSearchPosts(fetchSearchIndex)).resolves.toHaveLength(1);
    expect(fetchSearchIndex).toHaveBeenCalledTimes(2);
  });
});
