/**
 * 포스트 조회수를 조회하는 API 함수
 */
export async function getPostViews(slug: string): Promise<number> {
  const response = await fetch(`/api/posts/${slug}/views`);

  if (!response.ok) {
    throw new Error("Failed to fetch views");
  }

  const data = await response.json();
  return data.views as number;
}
