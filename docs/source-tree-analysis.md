# 소스 트리 분석

**생성일:** 2025-11-16

## 개요

이 프로젝트는 Next.js 15 App Router를 사용하며, Feature-Sliced Design (FSD) 아키텍처 패턴을 따릅니다.

## 전체 디렉토리 구조

```
blog/
├── .bmad/                    # BMAD 메서드 설정 (문서화 도구)
├── .cursor/                  # Cursor IDE 설정
├── docs/                     # 프로젝트 문서 (생성됨)
│   ├── sprint-artifacts/     # 스프린트 산출물
│   └── project-scan-report.json
├── node_modules/             # 의존성 패키지
├── public/                   # 정적 파일
│   ├── favicon/             # 파비콘
│   ├── images/               # 최적화된 이미지 (WebP)
│   ├── logo.png
│   ├── profile.jpeg
│   └── manifest.json
├── scripts/                  # 빌드 스크립트
│   ├── buildImages.ts        # 이미지 빌드 스크립트
│   └── convertImages.ts      # 이미지 변환 스크립트
├── src/                      # 소스 코드
│   ├── app/                  # Next.js App Router
│   ├── entities/             # 비즈니스 엔티티
│   ├── features/             # 기능 모듈
│   └── shared/               # 공유 리소스
├── .env.local                # 환경 변수 (로컬)
├── eslint.config.mjs         # ESLint 설정
├── jest.config.js            # Jest 설정
├── jest.setup.js             # Jest 설정 파일
├── next.config.ts            # Next.js 설정
├── package.json              # 프로젝트 의존성
├── postcss.config.mjs        # PostCSS 설정
├── tsconfig.json             # TypeScript 설정
├── README.md                 # 프로젝트 개요
├── IMAGE_OPTIMIZATION.md     # 이미지 최적화 가이드
└── NOTION_SETUP.md           # Notion 설정 가이드
```

## 핵심 디렉토리 상세

### `src/app/` - Next.js App Router

**목적:** Next.js 15 App Router의 페이지 및 라우트 핸들러

**구조:**
```
app/
├── about/                    # About 페이지
│   └── page.tsx
├── posts/                    # 포스트 관련 페이지
│   └── [slug]/               # 동적 라우트
│       ├── opengraph-image.tsx  # Open Graph 이미지 생성
│       └── page.tsx          # 포스트 상세 페이지
├── atom.xml/                 # Atom 피드 라우트
│   └── route.ts
├── feed.json/                # JSON 피드 라우트
│   └── route.ts
├── feed.xml/                 # RSS 피드 라우트
│   └── route.ts
├── favicon.ico               # 파비콘
├── globals.css               # 전역 스타일
├── layout.tsx                # 루트 레이아웃
├── page.tsx                  # 홈페이지
├── robots.ts                 # robots.txt 생성
└── sitemap.ts                # sitemap.xml 생성
```

**특징:**
- Server Components 기본 사용
- Route Handlers로 API 엔드포인트 제공
- 메타데이터 생성 (robots.ts, sitemap.ts)

**진입점:**
- `layout.tsx`: 루트 레이아웃 (전역 설정)
- `page.tsx`: 홈페이지 (포스트 목록)

---

### `src/entities/` - 비즈니스 엔티티

**목적:** 도메인 엔티티 컴포넌트 (Post, Comment)

**구조:**
```
entities/
├── comment/                  # 댓글 엔티티
│   ├── Comment.tsx
│   └── index.ts
└── post/                     # 포스트 엔티티
    ├── ClientPagination.tsx  # 클라이언트 페이지네이션
    ├── PostCard.tsx          # 포스트 카드
    ├── PostContent.tsx       # 포스트 콘텐츠
    ├── PostList.tsx          # 포스트 목록
    ├── PostNavigation.tsx    # 포스트 네비게이션
    └── TableOfContents.tsx   # 목차
```

**특징:**
- 비즈니스 로직 포함
- 재사용 가능한 컴포넌트
- 도메인 특화 기능

---

### `src/features/` - 기능 모듈

**목적:** 특정 기능을 구현하는 모듈

**구조:**
```
features/
└── notion/                   # Notion 통합 기능
    ├── api/                  # Notion API 클라이언트
    │   └── client.ts         # Notion API 래퍼
    ├── components/           # Notion 렌더링 컴포넌트
    │   ├── blocks/           # 블록별 컴포넌트
    │   │   ├── CodeBlock.tsx
    │   │   ├── ImageBlock.tsx
    │   │   ├── ImageWithModal.tsx
    │   │   ├── VideoBlock.tsx
    │   │   └── index.ts
    │   ├── NotionBlockRenderer.tsx  # 블록 렌더러
    │   └── RichTextRenderer.tsx     # 리치 텍스트 렌더러
    ├── types/                # Notion 타입 정의
    │   └── index.ts
    ├── utils/                # Notion 유틸리티
    │   ├── blockMapper.ts    # 블록 매핑
    │   ├── blockParser.ts    # 블록 파싱
    │   └── toc.ts            # 목차 생성
    └── index.ts              # 공개 API
```

**특징:**
- Notion API 통합
- 블록 타입별 렌더링
- 타입 안정성 (TypeScript)

---

### `src/shared/` - 공유 리소스

**목적:** 프로젝트 전반에서 사용되는 공유 컴포넌트 및 유틸리티

**구조:**
```
shared/
├── components/               # 공유 UI 컴포넌트
│   ├── BottomNavigation.tsx  # 하단 네비게이션
│   ├── Footer.tsx           # 푸터
│   ├── Header.tsx           # 헤더
│   ├── Modal.tsx            # 모달
│   ├── Pagination.tsx       # 페이지네이션
│   └── ScrollProgress.tsx   # 스크롤 진행률
├── constants/               # 상수
│   └── index.ts
├── providers/               # Context Providers
│   └── ThemeProvider.tsx    # 테마 프로바이더
└── utils/                   # 유틸리티 함수
    ├── imageMapper.ts       # 이미지 매핑
    └── imageMapping.generated.ts  # 생성된 이미지 매핑
```

**특징:**
- 범용 컴포넌트
- 도메인 독립적
- 재사용 가능

---

## 파일 조직 패턴

### 1. Feature-Sliced Design (FSD)

프로젝트는 FSD 아키텍처를 따릅니다:

- **entities/**: 비즈니스 엔티티
- **features/**: 기능 모듈
- **shared/**: 공유 리소스

### 2. Next.js App Router 구조

- `app/` 디렉토리에 페이지 및 라우트 정의
- 파일 기반 라우팅
- Route Handlers로 API 엔드포인트 제공

### 3. 컴포넌트 구조

- 각 컴포넌트는 독립 파일
- `index.ts`로 공개 API 정의
- 타입 정의는 `types/` 디렉토리 또는 파일 내부

---

## 진입점 (Entry Points)

### 메인 진입점

1. **`src/app/layout.tsx`**
   - 루트 레이아웃
   - 전역 설정 (메타데이터, 폰트, 테마)
   - Header, Footer 포함

2. **`src/app/page.tsx`**
   - 홈페이지
   - 포스트 목록 표시

3. **`src/app/posts/[slug]/page.tsx`**
   - 포스트 상세 페이지
   - 동적 라우트

### API 진입점

1. **`src/app/feed.xml/route.ts`** - RSS 피드
2. **`src/app/feed.json/route.ts`** - JSON 피드
3. **`src/app/atom.xml/route.ts`** - Atom 피드
4. **`src/app/robots.ts`** - robots.txt
5. **`src/app/sitemap.ts`** - sitemap.xml

---

## 통합 지점 (Integration Points)

### Notion API 통합

**위치:** `src/features/notion/api/client.ts`

**역할:**
- Notion API 클라이언트 초기화
- 포스트 데이터 조회
- 블록 데이터 조회

**사용 위치:**
- `src/app/page.tsx` - 포스트 목록
- `src/app/posts/[slug]/page.tsx` - 포스트 상세
- `src/app/feed.*/route.ts` - 피드 생성
- `src/app/sitemap.ts` - 사이트맵 생성

### 이미지 처리 통합

**위치:** `scripts/buildImages.ts`

**역할:**
- 빌드 시점 이미지 최적화
- WebP 변환
- 이미지 매핑 생성

**사용 위치:**
- 빌드 프로세스 (`pnpm build`)

---

## 설정 파일

### 빌드 설정

- `next.config.ts`: Next.js 설정 (이미지 최적화, 헤더 등)
- `tsconfig.json`: TypeScript 설정
- `postcss.config.mjs`: PostCSS 설정 (Tailwind CSS)
- `eslint.config.mjs`: ESLint 설정
- `jest.config.js`: Jest 테스트 설정

### 환경 변수

- `.env.local`: 로컬 환경 변수
  - `NOTION_API_KEY`: Notion API 키
  - `NOTION_DATABASE_ID`: Notion 데이터베이스 ID
  - `NEXT_PUBLIC_SITE_URL`: 사이트 URL

---

## 정적 파일 위치

### `public/` 디렉토리

- `favicon/`: 파비콘 파일
- `images/`: 최적화된 이미지 (WebP)
  - 구조: `images/{post-slug}/{index}.webp`
- `logo.png`, `profile.jpeg`: 정적 이미지
- `manifest.json`: PWA 매니페스트

---

## 빌드 산출물

### 생성되는 파일

- `.next/`: Next.js 빌드 산출물
- `public/images/`: 최적화된 이미지
- `src/shared/utils/imageMapping.generated.ts`: 이미지 매핑

### 제외되는 디렉토리

- `node_modules/`: 의존성 패키지
- `.next/`: 빌드 산출물
- `.git/`: Git 저장소

---

## 파일 조직 패턴 요약

1. **도메인별 분리**: entities, features로 도메인 분리
2. **공유 리소스**: shared로 공통 기능 분리
3. **라우팅**: Next.js App Router 사용
4. **타입 안정성**: TypeScript로 타입 정의
5. **모듈화**: 각 기능을 독립 모듈로 구성


