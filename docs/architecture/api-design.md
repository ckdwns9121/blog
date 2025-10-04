# API 설계

## Notion API 연동 설계

```typescript
// lib/notion.ts - 핵심 API 함수들
class NotionClient {
  private client: Client;
  private databaseId: string;

  // 포스트 메타데이터 조회
  async getAllPosts(): Promise<NotionPost[]>;

  // 특정 포스트 상세 조회
  async getPostBySlug(slug: string): Promise<BlogPost>;

  // 포스트 콘텐츠 변환
  async getPostContent(pageId: string): Promise<string>;

  // 카테고리 목록 조회
  async getCategories(): Promise<Category[]>;

  // 카테고리별 포스트 필터링
  async getPostsByCategory(category: string): Promise<BlogPost[]>;

  // 태그별 포스트 필터링
  async getPostsByTag(tag: string): Promise<BlogPost[]>;
}
```

## Next.js API Routes 설계

```typescript
// app/api/posts/route.ts
export async function GET() {
  const posts = await notionClient.getAllPosts();
  return Response.json(posts);
}

// app/api/posts/[slug]/route.ts
export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const post = await notionClient.getPostBySlug(params.slug);
  return Response.json(post);
}

// app/api/categories/route.ts
export async function GET() {
  const categories = await notionClient.getCategories();
  return Response.json(categories);
}
```
