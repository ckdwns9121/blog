# 데이터 모델

**생성일:** 2025-11-16

## 개요

이 프로젝트는 전통적인 데이터베이스를 사용하지 않으며, Notion을 Headless CMS로 사용합니다. 데이터 모델은 Notion 데이터베이스의 속성 구조와 TypeScript 타입 정의로 표현됩니다.

## Notion 데이터베이스 스키마

### 포스트 속성 (Post Properties)

| 속성명 | 타입 | 설명 | 필수 |
|--------|------|------|------|
| `title` | Title | 포스트 제목 | ✅ |
| `slug` | Text | URL용 슬러그 (선택사항, 없으면 제목에서 자동 생성) | ❌ |
| `published` | Checkbox | 발행 여부 | ✅ |
| `publishedAt` | Date | 발행일 | ❌ |
| `createdAt` | Date | 생성일 (자동) | ✅ |
| `updatedAt` | Date | 수정일 (자동) | ✅ |
| `category` | Text | 카테고리 | ❌ |
| `tags` | Multi-select | 태그들 | ❌ |
| `excerpt` | Text | 포스트 요약 | ❌ |
| `coverImage` | URL | 커버 이미지 URL | ❌ |
| `readingTime` | Number | 읽기 시간 (분) | ❌ |

## TypeScript 타입 정의

### NotionPost

```typescript
interface NotionPost {
  id: string;                    // Notion 페이지 ID
  title: string;                 // 포스트 제목
  slug: string;                  // URL 슬러그 (slug + pageId 조합)
  published: boolean;            // 발행 여부
  createdAt: string;             // 생성일 (ISO 8601)
  publishedAt: string;           // 발행일 (ISO 8601)
  updatedAt: string;             // 수정일 (ISO 8601)
  tags: Array<{                  // 태그 목록
    name: string;
    slug: string;
  }>;
  excerpt?: string;              // 요약
  coverImage?: string;           // 커버 이미지 URL
}
```

### BlogPost

```typescript
interface BlogPost extends NotionPost {
  content: NotionBlock[];        // 포스트 콘텐츠 블록
  toc: TableOfContentsItem[];    // 목차
}
```

### NotionBlock

```typescript
interface NotionBlock {
  id: string;                     // 블록 ID
  type: string;                   // 블록 타입
  content: BlockContent;          // 블록 콘텐츠
  children?: NotionBlock[];       // 중첩된 블록 (재귀적 구조)
}
```

### 지원되는 블록 타입

- `heading_1`, `heading_2`, `heading_3` - 제목
- `paragraph` - 단락
- `bulleted_list_item` - 불릿 리스트
- `numbered_list_item` - 번호 리스트
- `code` - 코드 블록
- `quote` - 인용
- `image` - 이미지
- `video` - 비디오
- `divider` - 구분선
- `bookmark` - 북마크

### BlockContent

```typescript
type BlockContent =
  | { type: "rich_text"; rich_text: RichTextItem[] }
  | { type: "code"; text: string; language: string }
  | { type: "image"; url: string; caption: string }
  | { type: "bookmark"; url: string; caption: string }
  | { type: "plain_text"; text: string };
```

## 데이터 흐름

### 1. 콘텐츠 작성
```
Notion 데이터베이스 → 작성자가 Notion에서 콘텐츠 작성
```

### 2. 콘텐츠 조회
```
Notion API → getAllPosts() → 포스트 목록
Notion API → getPostBySlug() → 포스트 상세
```

### 3. 이미지 처리
```
Notion S3 URL → 빌드 시점 WebP 변환 → public/images/
```

## 슬러그 생성 규칙

### 슬러그 생성 프로세스

슬러그는 포스트의 고유 식별자로 사용되며, URL 친화적인 형식으로 생성됩니다.

#### 1. Base Slug 생성

```typescript
// src/features/notion/api/client.ts

// 1단계: Notion 속성에서 slug 확인
const originalSlug = getPlainText(properties.slug);

// 2단계: slug가 없으면 제목에서 자동 생성
const generatedSlug = slugify(titleProperty);

// 3단계: 최종 base slug 결정 (우선순위: 사용자 입력 > 자동 생성 > 기본값)
const baseSlug = originalSlug || generatedSlug || "post";
```

**slugify 함수:**
```typescript
function slugify(text: string): string {
  return text
    .toLowerCase()                    // 소문자 변환
    .replace(/[^\w\s-]/g, "")        // 특수문자 제거
    .replace(/\s+/g, "-")            // 공백을 하이픈으로 변환
    .trim();                          // 앞뒤 공백 제거
}
```

**예시:**
- 제목: "JavaScript Promise 완전 정리"
- 자동 생성 slug: `javascript-promise-완전-정리`

#### 2. PageId 추출 및 변환

```typescript
// Notion 페이지 ID는 UUID 형식 (하이픈 포함)
// 예: "8618d667-c89b-3708-a1b2-c3d4e5f6g7h8"

// 하이픈 제거하여 32자리 문자열로 변환
const pageIdWithoutHyphens = notionPage.id.replace(/-/g, "");
// 결과: "8618d667c89b3708a1b2c3d4e5f6g7h8"
```

#### 3. 최종 Slug 조합

```typescript
// baseSlug + pageId 조합
const validSlug = `${baseSlug}-${pageIdWithoutHyphens}`;
```

**최종 예시:**
- 제목: "JavaScript Promise"
- 사용자 slug: 없음
- 자동 생성 base slug: `javascript-promise`
- PageId (하이픈 제거): `8618d667c89b3708a1b2c3d4e5f6g7h8`
- **최종 slug**: `javascript-promise-8618d667c89b3708a1b2c3d4e5f6g7h8`

### Slug에서 PageId 역변환

상세 페이지에서 slug를 받아 pageId로 변환하는 과정:

```typescript
// src/features/notion/api/client.ts - getPostBySlug()

// 1단계: URL 디코딩
const decodedSlug = decodeURIComponent(slug);

// 2단계: 하이픈으로 분리하여 마지막 부분(pageId) 추출
const parts = decodedSlug.split("-");
const pageIdWithoutHyphens = parts[parts.length - 1];

// 3단계: pageId 유효성 검증 (32자리 확인)
if (pageIdWithoutHyphens.length !== 32) {
  throw new Error(`Invalid slug format: "${slug}". Expected format: slug-{32-char-page-id}`);
}

// 4단계: UUID 형식으로 복원 (8-4-4-4-12)
const pageId = `${pageIdWithoutHyphens.slice(0, 8)}-${pageIdWithoutHyphens.slice(8, 12)}-${pageIdWithoutHyphens.slice(12, 16)}-${pageIdWithoutHyphens.slice(16, 20)}-${pageIdWithoutHyphens.slice(20)}`;
// 결과: "8618d667-c89b-3708-a1b2-c3d4e5f6g7h8"
```

### Slug 생성 이유

1. **고유성 보장**: PageId를 포함하여 slug 충돌 방지
2. **URL 안정성**: 제목 변경 시에도 URL 유지 가능 (PageId는 변경되지 않음)
3. **SEO 친화적**: 제목 기반 slug로 검색 엔진 최적화
4. **사용자 제어**: Notion에서 slug 속성으로 커스텀 slug 지정 가능

### Slug 형식 규칙

- **최소 길이**: baseSlug (최소 1자) + 하이픈 + pageId (32자) = 최소 34자
- **최대 길이**: 제한 없음 (제목 길이에 따라 달라짐)
- **문자 제한**: 영문, 숫자, 하이픈만 사용 (특수문자 제거)
- **대소문자**: 소문자로 통일

## 이미지 URL 처리

### 문제점
Notion의 S3 이미지 URL은 1시간 후 만료됩니다.

### 해결 방법
빌드 시점에 이미지를 다운로드하여 WebP로 변환하고 `public/images/`에 저장합니다.

**변환 과정:**
1. Notion API에서 이미지 URL 추출
2. 빌드 시점에 이미지 다운로드
3. Sharp를 사용하여 WebP로 변환 (품질 85%)
4. `public/images/{post-slug}/{index}.webp`에 저장
5. URL 매핑 정보를 `image-mapping.json`에 저장

## 데이터 검증

### 필수 필드 검증
- `title`: 반드시 존재해야 함
- `published`: `true`인 경우에만 목록에 포함
- `createdAt`: 없으면 현재 시간 사용
- `publishedAt`: 없으면 `createdAt` 사용

### 날짜 유효성 검증
- 날짜 형식이 유효하지 않으면 현재 시간으로 대체
- ISO 8601 형식 사용

## 관계

이 프로젝트는 단일 데이터 소스(Notion)를 사용하므로 관계형 데이터베이스의 관계 개념이 없습니다. 대신:

- **태그**: Multi-select 속성으로 다대다 관계 표현
- **블록 중첩**: `children` 속성으로 계층 구조 표현

## 인덱싱 및 검색

현재 별도의 검색 기능은 구현되지 않았습니다. Notion API의 기본 검색 기능을 사용합니다.

## 마이그레이션

Notion을 CMS로 사용하므로 데이터베이스 마이그레이션이 필요하지 않습니다. Notion 데이터베이스의 속성 변경은 코드의 타입 정의만 수정하면 됩니다.

