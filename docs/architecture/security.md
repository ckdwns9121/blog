# 보안 아키텍처

## API 보안

```typescript
// lib/notion.ts - API 키 보안
class NotionClient {
  private client: Client;

  constructor() {
    if (!process.env.NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY is required");
    }

    this.client = new Client({
      auth: process.env.NOTION_API_KEY,
    });
  }

  // Rate limiting 구현
  private async rateLimitCheck() {
    // 초당 3 requests 제한 준수
    await new Promise((resolve) => setTimeout(resolve, 334));
  }
}
```

## 환경 변수 보안

- Notion API Key는 서버 사이드에서만 사용
- 클라이언트 사이드에는 공개 가능한 변수만 노출
- Vercel Secrets를 통한 안전한 환경 변수 관리
