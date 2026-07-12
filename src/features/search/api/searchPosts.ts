import {
  hydrateSearchDocuments,
  type SearchablePost,
} from "@/features/search/model/searchDocument";

export type SearchPostsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; posts: SearchablePost[] }
  | { status: "error"; error: Error };

type FetchSearchIndex = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

let searchPostsPromise: Promise<SearchablePost[]> | undefined;

export function loadSearchPosts(
  fetchSearchIndex: FetchSearchIndex = fetch,
): Promise<SearchablePost[]> {
  if (searchPostsPromise) {
    return searchPostsPromise;
  }

  const request = fetchSearchIndex("/search-index.json", {
    cache: "no-cache",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json() as Promise<unknown>;
    })
    .then(hydrateSearchDocuments)
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`검색 데이터를 불러오지 못했습니다: ${message}`);
    });

  searchPostsPromise = request;
  void request.catch(() => {
    if (searchPostsPromise === request) {
      searchPostsPromise = undefined;
    }
  });

  return request;
}

export function resetSearchPostsCache(): void {
  searchPostsPromise = undefined;
}
