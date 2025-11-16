# 아키텍처 문서

**생성일:** 2025-11-16  
**프로젝트:** Changjun.blog  
**타입:** 웹 애플리케이션 (Monolith)

## 실행 요약

Changjun.blog는 Next.js 15와 Notion API를 활용한 SSG(Static Site Generation) 기반 개발 블로그입니다. Feature-Sliced Design (FSD) 아키텍처 패턴을 따르며, Notion을 Headless CMS로 사용하여 콘텐츠를 관리합니다.

## 기술 스택

### 프레임워크 및 언어

- **Next.js**: 15.5.4 (App Router)
- **React**: 19.1.0
- **TypeScript**: 5
- **Node.js**: 20.x 이상

### 스타일링

- **Tailwind CSS**: 4
- **PostCSS**: Tailwind CSS 처리

### CMS 및 데이터

- **Notion API**: 5.1.0 (Headless CMS)
- **데이터베이스**: 없음 (Notion 사용)

### 빌드 및 도구

- **pnpm**: 패키지 관리자
- **Turbopack**: Next.js 번들러 (개발)
- **Sharp**: 0.34.4 (이미지 최적화)
- **Jest**: 30.2.0 (테스팅)
- **ESLint**: 9 (린팅)

자세한 내용은 `technology-stack.md` 참조

## 아키텍처 패턴

### 1. Component-Based Architecture

React 컴포넌트를 기반으로 한 모듈화된 UI 구조를 사용합니다. 각 컴포넌트는 독립적으로 개발 및 테스트 가능합니다.

### 2. Feature-Sliced Design (FSD)

프로젝트는 FSD 아키텍처를 따릅니다:

```
src/
├── entities/      # 비즈니스 엔티티 (Post, Comment)
├── features/      # 기능 모듈 (notion 통합)
└── shared/        # 공유 리소스 (컴포넌트, 유틸리티)
```

**계층 구조:**
- **entities**: 도메인 엔티티 컴포넌트
- **features**: 특정 기능 구현 모듈
- **shared**: 프로젝트 전반에서 사용되는 공유 리소스

### 3. SSG (Static Site Generation)

빌드 시점에 모든 페이지를 정적 HTML로 생성합니다:

- **장점**: 빠른 로딩, SEO 최적화, 서버 비용 절감
- **ISR**: Incremental Static Regeneration (1시간마다 재검증)
- **데이터 소스**: Notion API (빌드 시점에 조회)

### 4. Headless CMS 패턴

Notion을 CMS로 사용하여 콘텐츠를 관리합니다:

- **작성 경험**: Notion에서 콘텐츠 작성
- **개발 경험**: API를 통한 콘텐츠 조회
- **장점**: 익숙한 작성 도구, 별도 CMS 구축 불필요

## 시스템 아키텍처

### 전체 구조

```
┌─────────────────────────────────────────┐
│         Notion (CMS)                    │
│  - 데이터베이스                          │
│  - 콘텐츠 작성                           │
└──────────────┬──────────────────────────┘
               │ Notion API
               ▼
┌─────────────────────────────────────────┐
│      Next.js Application                │
│  ┌──────────────────────────────────┐   │
│  │  Build Process                   │   │
│  │  1. 이미지 최적화 (WebP 변환)     │   │
│  │  2. 정적 페이지 생성 (SSG)        │   │
│  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────┐   │
│  │  Runtime                         │   │
│  │  - Server Components             │   │
│  │  - Route Handlers                │   │
│  │  - Client Components             │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      Static Files (CDN)                  │
│  - HTML, CSS, JS                        │
│  - 이미지 (WebP)                         │
│  - 피드 (RSS, JSON, Atom)                │
└─────────────────────────────────────────┘
```

### 데이터 흐름

#### 1. 콘텐츠 작성 단계

```
Notion 데이터베이스
  ↓
작성자가 Notion에서 콘텐츠 작성
  - 제목 입력
  - slug 속성 입력 (선택사항)
  - published 체크박스 활성화
  - 콘텐츠 블록 작성
```

#### 2. 빌드 시점 데이터 조회

**포스트 목록 조회 (`getAllPosts()`):**

```
Notion API
  ↓
search() - 모든 페이지 검색
  ↓
각 페이지 순회
  ↓
pages.retrieve() - 페이지 상세 정보 조회
  ↓
속성 파싱
  - published 확인
  - title 추출
  - slug 생성 (제목 + pageId)
  ↓
발행된 포스트만 필터링
  ↓
발행일 기준 정렬
  ↓
포스트 목록 반환
```

**슬러그 생성 상세:**

```
제목: "JavaScript Promise 완전 정리"
  ↓
slugify() 함수 적용
  - 소문자 변환
  - 특수문자 제거
  - 공백을 하이픈으로 변환
  ↓
baseSlug: "javascript-promise-완전-정리"
  ↓
PageId 추출: "8618d667-c89b-3708-a1b2-c3d4e5f6g7h8"
  ↓
하이픈 제거: "8618d667c89b3708a1b2c3d4e5f6g7h8"
  ↓
최종 slug: "javascript-promise-완전-정리-8618d667c89b3708a1b2c3d4e5f6g7h8"
```

#### 3. 상세 페이지 생성

**SSG를 위한 정적 경로 생성:**

```typescript
// src/app/posts/[slug]/page.tsx

export async function generateStaticParams() {
  const allPosts = await getAllPosts();
  
  return allPosts.map((post) => ({
    slug: post.slug,  // 생성된 slug 사용
  }));
}
```

**상세 페이지 데이터 조회:**

```
URL: /posts/javascript-promise-8618d667c89b3708a1b2c3d4e5f6g7h8
  ↓
getPostBySlug(slug)
  ↓
Slug 파싱
  - 하이픈으로 분리
  - 마지막 부분 추출 (pageId)
  - UUID 형식으로 복원
  ↓
getPostByPageId(pageId)
  ↓
병렬 API 호출
  ├─ pages.retrieve() - 페이지 메타데이터
  └─ blocks.children.list() - 콘텐츠 블록
  ↓
데이터 조합
  - 메타데이터 + 블록 콘텐츠
  - 슬러그 재생성 (일관성 유지)
  ↓
BlogPost 객체 반환
```

#### 4. 이미지 처리

```
Notion API에서 이미지 URL 추출
  ↓
빌드 시점 다운로드
  ↓
Sharp로 WebP 변환 (품질 85%)
  ↓
public/images/{post-slug}/{index}.webp 저장
  ↓
URL 매핑 정보 저장
```

#### 5. 정적 HTML 생성

```
Next.js 빌드 프로세스
  ↓
각 포스트에 대해 정적 페이지 생성
  - generateStaticParams()로 경로 생성
  - 각 경로에 대해 페이지 렌더링
  ↓
정적 HTML 파일 생성
  ↓
CDN 배포
```

#### 6. 런타임

```
사용자 요청
  ↓
CDN에서 정적 HTML 제공
  ↓
클라이언트 사이드 하이드레이션
  ↓
인터랙티브 기능 활성화
```

## 컴포넌트 아키텍처

### 레이어 구조

```
┌─────────────────────────────────────┐
│         App Layer                   │
│  - pages (Next.js App Router)       │
│  - route handlers                   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Entity Layer                    │
│  - Post, Comment                     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Feature Layer                   │
│  - Notion integration                │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Shared Layer                    │
│  - UI Components                   │
│  - Utilities                        │
└─────────────────────────────────────┘
```

### 컴포넌트 분류

**공유 컴포넌트** (`shared/components/`):
- Header, Footer, Modal, Pagination 등
- 범용 UI 컴포넌트

**엔티티 컴포넌트** (`entities/`):
- PostCard, PostList, PostContent 등
- 도메인 특화 컴포넌트

**기능 컴포넌트** (`features/notion/components/`):
- NotionBlockRenderer, CodeBlock, ImageBlock 등
- Notion 콘텐츠 렌더링 전용

자세한 내용은 `component-inventory.md` 참조

## 데이터 아키텍처

### 데이터 소스

이 프로젝트는 전통적인 데이터베이스를 사용하지 않습니다:

- **CMS**: Notion (외부 서비스)
- **이미지 저장**: 빌드 시점에 `public/images/`에 WebP로 변환하여 저장
- **상태 관리**: React의 내장 상태 관리 (Context API, useState)

### Notion 데이터 구조

**포스트 속성:**
- title, slug, published, publishedAt, createdAt, updatedAt
- tags, excerpt, coverImage, readingTime

**블록 타입:**
- 제목 (heading_1, heading_2, heading_3)
- 단락, 리스트, 코드, 인용, 이미지, 비디오 등

자세한 내용은 `data-models.md` 참조

## API 아키텍처

### Route Handlers

Next.js App Router의 Route Handlers를 사용합니다:

- `GET /feed.xml` - RSS 피드
- `GET /feed.json` - JSON 피드
- `GET /atom.xml` - Atom 피드
- `GET /robots.txt` - robots.txt
- `GET /sitemap.xml` - sitemap.xml

### 외부 API 통합

**Notion API:**
- 클라이언트: `@notionhq/client`
- 인증: Integration Token
- 데이터베이스: Notion Database ID

자세한 내용은 `api-contracts.md` 참조

## 상태 관리

### 전략

- **로컬 상태**: `useState` Hook
- **테마 상태**: `next-themes` (Context API 기반)
- **서버 상태**: Server Components에서 직접 데이터 페칭

### 전역 상태 관리 라이브러리

사용하지 않음 (Redux, Zustand 등)

자세한 내용은 `state-management-patterns.md` 참조

## 이미지 처리 아키텍처

### 문제점

Notion의 S3 이미지 URL은 1시간 후 만료됩니다.

### 해결 방법

빌드 시점에 이미지를 다운로드하여 WebP로 변환:

1. Notion API에서 이미지 URL 추출
2. 빌드 시점에 이미지 다운로드
3. Sharp를 사용하여 WebP로 변환 (품질 85%)
4. `public/images/{post-slug}/{index}.webp`에 저장
5. URL 매핑 정보를 `image-mapping.json`에 저장

자세한 내용은 `IMAGE_OPTIMIZATION.md` 참조

## 배포 아키텍처

### 배포 플랫폼

**권장**: Vercel
- Next.js 최적화
- 자동 빌드 및 배포
- CDN 제공

### 빌드 프로세스

1. 이미지 변환 (`pnpm build:images`)
2. Next.js 빌드 (`next build`)
3. 정적 파일 생성 (`.next/`)
4. CDN 배포

### 환경 변수

- `NOTION_API_KEY`: Notion Integration Token
- `NOTION_DATABASE_ID`: Notion Database ID
- `NEXT_PUBLIC_SITE_URL`: 사이트 URL

## 보안 고려사항

### 환경 변수

- `.env.local` 파일은 Git에 커밋하지 않음
- 프로덕션 환경에서는 플랫폼의 환경 변수 설정 사용

### API 키 관리

- Notion API 키는 환경 변수로 관리
- Integration Token은 Notion에서 안전하게 관리

### 이미지 보안

- Notion의 공개 이미지 프록시 URL 사용
- 빌드 시점에 이미지 다운로드 및 변환

## 성능 최적화

### 이미지 최적화

- WebP 포맷 사용 (85% 품질)
- 빌드 시점 변환으로 런타임 오버헤드 제거

### 정적 생성

- SSG를 통한 빠른 로딩
- ISR을 통한 주기적 업데이트 (1시간)

### 번들 최적화

- Turbopack을 사용한 빠른 개발 빌드
- Next.js 자동 코드 스플리팅
- Server Components로 클라이언트 번들 크기 감소

## 확장성 고려사항

### 현재 구조

- 단일 프로젝트 (Monolith)
- Notion을 CMS로 사용
- 정적 사이트 생성

### 향후 확장 가능성

1. **검색 기능**: Algolia 또는 Typesense 통합
2. **댓글 시스템**: 외부 서비스 (Disqus, Giscus 등) 통합
3. **분석**: Google Analytics 또는 Plausible 통합
4. **다국어 지원**: i18n 라이브러리 통합

## 테스트 전략

### 테스트 도구

- **Jest**: 테스트 러너
- **Testing Library**: React 컴포넌트 테스트

### 테스트 범위

- 컴포넌트 단위 테스트
- 유틸리티 함수 테스트
- API 라우트 테스트 (선택사항)

## 모니터링 및 로깅

현재 명시적인 모니터링 시스템은 없습니다. 향후 추가 가능:

- 에러 추적: Sentry
- 성능 모니터링: Vercel Analytics
- 사용자 분석: Google Analytics

## 참고 문서

- **기술 스택**: `technology-stack.md`
- **소스 트리**: `source-tree-analysis.md`
- **API 계약서**: `api-contracts.md`
- **데이터 모델**: `data-models.md`
- **컴포넌트 인벤토리**: `component-inventory.md`
- **상태 관리**: `state-management-patterns.md`
- **개발 가이드**: `development-guide.md`

