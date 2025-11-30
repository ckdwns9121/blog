import type { PostApi } from "./types";

/**
 * Post API 어댑터 관리
 *
 * 다양한 CMS(Notion, GitHub, MDX 등)에서 포스트를 가져오기 위한 어댑터 패턴
 * 어댑터는 features 레이어에서 등록됩니다.
 */

let postApiAdapter: PostApi | null = null;

/**
 * Post API 어댑터를 등록합니다.
 * 이 함수는 app 레이어에서 호출되어야 합니다.
 *
 * @param adapter - PostApi 인터페이스를 구현한 어댑터
 */
export function setPostApiAdapter(adapter: PostApi): void {
  postApiAdapter = adapter;
}

/**
 * 등록된 Post API 어댑터를 가져옵니다.
 *
 * @throws Error - 어댑터가 등록되지 않은 경우
 */
export function getPostApiAdapter(): PostApi {
  if (!postApiAdapter) {
    throw new Error(
      "Post API adapter is not registered. " + "Please call setPostApiAdapter() in your app initialization code."
    );
  }
  return postApiAdapter;
}

/**
 * 어댑터가 등록되어 있는지 확인합니다.
 */
export function isPostApiAdapterRegistered(): boolean {
  return postApiAdapter !== null;
}
