# API 계약서

**생성일:** 2025-11-16

## 개요

이 프로젝트는 Next.js App Router의 Route Handlers를 사용하여 API 엔드포인트를 제공합니다. 모든 엔드포인트는 정적 생성(SSG) 또는 동적 라우트 핸들러를 통해 구현됩니다.

## API 엔드포인트

### 1. RSS 피드

**엔드포인트:** `GET /feed.xml`

**설명:** RSS 2.0 형식의 블로그 피드

**응답 형식:**
- Content-Type: `application/xml; charset=utf-8`
- 형식: RSS 2.0

**응답 내용:**
- 블로그 메타데이터 (제목, 설명, 언어: ko)
- 모든 발행된 포스트 목록
- 각 포스트: 제목, 링크, 설명, 발행일, 태그, 커버 이미지

**데이터 소스:** Notion API (`getAllPosts()`)

---

### 2. JSON 피드

**엔드포인트:** `GET /feed.json`

**설명:** JSON Feed 형식의 블로그 피드

**응답 형식:**
- Content-Type: `application/json; charset=utf-8`
- 형식: JSON Feed 1.0

**응답 내용:**
- RSS 피드와 동일한 내용을 JSON 형식으로 제공

---

### 3. Atom 피드

**엔드포인트:** `GET /atom.xml`

**설명:** Atom 형식의 블로그 피드

**응답 형식:**
- Content-Type: `application/xml; charset=utf-8`
- 형식: Atom 1.0

**응답 내용:**
- RSS 피드와 동일한 내용을 Atom 형식으로 제공

---

### 4. Robots.txt

**엔드포인트:** `GET /robots.txt`

**설명:** 검색 엔진 크롤러를 위한 robots.txt 파일

**응답 형식:**
- Content-Type: `text/plain`
- 형식: robots.txt 표준

**규칙:**
- 모든 User-Agent 허용
- 모든 경로 크롤링 허용 (`/`)
- `/api/` 경로는 크롤링 차단
- Sitemap 위치: `/sitemap.xml`

---

### 5. Sitemap

**엔드포인트:** `GET /sitemap.xml`

**설명:** 검색 엔진을 위한 사이트맵

**응답 형식:**
- Content-Type: `application/xml`
- 형식: XML Sitemap

**포함 경로:**
- 홈페이지 (`/`) - 우선순위: 1.0, 변경 빈도: daily
- About 페이지 (`/about`) - 우선순위: 0.5, 변경 빈도: monthly
- 모든 포스트 (`/posts/{slug}`) - 우선순위: 0.8, 변경 빈도: weekly

**데이터 소스:** Notion API (`getAllPosts()`)

---

## 외부 API 통합

### Notion API

**클라이언트:** `@notionhq/client` v5.1.0

**주요 함수:**
- `getAllPosts()`: 모든 발행된 포스트 목록 조회
- `getPostBySlug(slug)`: 슬러그로 특정 포스트 조회
- `getPostByPageId(pageId)`: 페이지 ID로 포스트 조회
- `getPostBlocks(pageId)`: 포스트 콘텐츠 블록 조회

**인증:**
- 환경 변수: `NOTION_API_KEY`
- Notion Integration Token 사용

**데이터베이스:**
- 환경 변수: `NOTION_DATABASE_ID`
- Notion 데이터베이스 ID

#### Notion API 통합 상세

##### 1. 포스트 목록 조회 (`getAllPosts()`)

**프로세스:**

```typescript
// 1단계: Notion API로 모든 페이지 검색
const response = await getClient().search({
  query: "",
  page_size: 100,
});

// 2단계: 각 페이지를 순회하며 발행된 포스트만 필터링
for (const page of response.results) {
  // 2-1. 페이지 상세 정보 조회
  const pageData = await getClient().pages.retrieve({
    page_id: page.id,
  });

  // 2-2. 발행 여부 확인
  const publishedProperty = properties.published as NotionCheckboxProperty;
  const titleProperty = getPlainText(properties.title);

  // 2-3. 발행된 포스트만 처리
  if (publishedProperty?.checkbox && titleProperty) {
    // 슬러그 생성 (자세한 내용은 data-models.md 참조)
    const validSlug = generateSlug(properties, notionPage.id);
    
    // 포스트 메타데이터 구성
    posts.push({
      id: notionPage.id,
      title: titleProperty,
      slug: validSlug,
      // ... 기타 속성
    });
  }
}

// 3단계: 발행일 기준으로 정렬
return posts.sort((a, b) => 
  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
);
```

**특징:**
- `published` 속성이 `true`인 포스트만 반환
- 제목이 없는 페이지는 제외
- 발행일 기준 내림차순 정렬

##### 2. 포스트 상세 조회 (`getPostBySlug()`)

**프로세스:**

```typescript
// 1단계: Slug에서 PageId 추출
const decodedSlug = decodeURIComponent(slug);
const parts = decodedSlug.split("-");
const pageIdWithoutHyphens = parts[parts.length - 1]; // 마지막 부분이 pageId

// 2단계: PageId 유효성 검증 (32자리 확인)
if (pageIdWithoutHyphens.length !== 32) {
  throw new Error(`Invalid slug format`);
}

// 3단계: UUID 형식으로 복원 (8-4-4-4-12)
const pageId = restoreUUIDFormat(pageIdWithoutHyphens);

// 4단계: PageId로 포스트 조회
return getPostByPageId(pageId, fetchContent);
```

**Slug 파싱 예시:**
```
입력 slug: "javascript-promise-8618d667c89b3708a1b2c3d4e5f6g7h8"
분리: ["javascript", "promise", "8618d667c89b3708a1b2c3d4e5f6g7h8"]
PageId (하이픈 제거): "8618d667c89b3708a1b2c3d4e5f6g7h8"
PageId (UUID 복원): "8618d667-c89b-3708-a1b2-c3d4e5f6g7h8"
```

##### 3. 포스트 콘텐츠 조회 (`getPostByPageId()`)

**프로세스:**

```typescript
// 병렬 API 호출로 성능 최적화
const pageDataPromise = getClient().pages.retrieve({ page_id: pageId });
const blocksPromise = fetchContent ? getPostBlocks(pageId) : Promise.resolve([]);

const [pageData, blocks] = await Promise.all([pageDataPromise, blocksPromise]);

// 메타데이터 추출
const title = getPlainText(properties.title);
const tags = getMultiSelect(properties.tags);
// ... 기타 속성

// 슬러그 재생성 (일관성 유지)
const slug = generateSlug(properties, page.id);

return {
  id: page.id,
  title,
  slug,
  content: blocks,  // Notion 블록 배열
  // ... 기타 속성
};
```

**성능 최적화:**
- 페이지 메타데이터와 블록 콘텐츠를 병렬로 조회
- `fetchContent` 파라미터로 콘텐츠 조회 선택 가능 (목록 조회 시 불필요)

##### 4. 블록 콘텐츠 조회 (`getPostBlocks()`)

**프로세스:**

```typescript
// 페이지네이션을 통한 모든 블록 조회
let cursor: string | undefined = undefined;
let hasMore = true;

while (hasMore) {
  const response = await getClient().blocks.children.list({
    block_id: pageId,
    page_size: 100,
    start_cursor: cursor,
  });

  // 각 블록 처리
  const blocks = await Promise.all(
    response.results.map(async (block) => {
      const baseBlock = {
        id: block.id,
        type: block.type,
        content: extractBlockContent(block),
        children: undefined,
      };

      // 중첩된 블록이 있으면 재귀적으로 조회
      if (block.has_children) {
        baseBlock.children = await getPostBlocks(block.id);
      }

      return baseBlock;
    })
  );

  allBlocks.push(...blocks);
  hasMore = response.has_more;
  cursor = response.next_cursor;
}
```

**특징:**
- 페이지네이션 지원 (최대 100개씩)
- 중첩된 블록 재귀적 조회
- 모든 블록 타입 지원 (제목, 단락, 코드, 이미지 등)

---

## 페이지 라우트

### 정적 페이지

- `/` - 홈페이지 (포스트 목록)
- `/about` - 소개 페이지
- `/posts/[slug]` - 포스트 상세 페이지 (동적 라우트)

### 메타데이터 생성

- `/posts/[slug]/opengraph-image.tsx` - Open Graph 이미지 생성

---

## 에러 처리

현재 명시적인 에러 핸들러는 구현되지 않았습니다. Next.js의 기본 에러 처리 메커니즘을 사용합니다.

---

## 성능 최적화

- **SSG (Static Site Generation)**: 빌드 시점에 정적 HTML 생성
- **ISR (Incremental Static Regeneration)**: `revalidate: 3600` (1시간마다 재검증)
- **병렬 API 호출**: `getPostByPageId`에서 페이지 데이터와 블록 데이터를 병렬로 조회

