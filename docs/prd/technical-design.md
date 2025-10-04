# 기술 설계

## 프로젝트 구조

```
/
├── app/ (또는 pages/)
│   ├── page.tsx (홈)
│   ├── posts/
│   │   └── [slug]/
│   │       └── page.tsx
│   ├── category/
│   │   └── [category]/
│   │       └── page.tsx
│   └── about/
│       └── page.tsx
├── components/
│   ├── PostCard.tsx
│   ├── PostContent.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── notion.ts (Notion API 클라이언트)
│   ├── markdown.ts (변환 로직)
│   ├── utils.ts
│   └── themes.ts (다크모드 설정)
├── types/
│   └── notion.d.ts
├── public/
├── .github/
│   └── workflows/
│       └── deploy.yml
└── next.config.js
```

## 데이터 플로우

```
Notion Database
    ↓ (Notion API)
빌드 타임 데이터 페칭
    ↓ (notion-to-md 또는 커스텀 파서)
Markdown/JSON 변환
    ↓ (Next.js SSG)
정적 HTML 생성
    ↓ (GitHub Actions)
자동 배포
```

## Notion API 연동 설계

### 필요한 Notion 설정

- Integration 생성 (Internal Integration)
- Database 권한 부여
- Database ID 및 API Key 환경변수 설정

### 주요 API 함수

```typescript
// lib/notion.ts 주요 함수 스펙
- getAllPosts(): 전체 포스트 메타데이터 조회
- getPostBySlug(slug): 특정 포스트 상세 조회
- getPostContent(pageId): Notion 블록 → Markdown 변환
- getCategories(): 전체 카테고리 목록
- getPostsByCategory(category): 카테고리별 필터링
```

## 성능 최적화

- **이미지 최적화**: Next.js Image 컴포넌트 사용, Notion 이미지 캐싱
- **코드 스플리팅**: Dynamic import 활용
- **폰트 최적화**: next/font 사용
- **번들 사이즈 최적화**: 불필요한 라이브러리 제거

## 다크모드 구현 설계

### 테마 관리 시스템

```typescript
// lib/themes.ts 주요 기능
- ThemeProvider: next-themes를 이용한 전역 테마 상태 관리
- useTheme: React Hook을 통한 테마 상태 및 전환 함수 제공
- theme 저장소: localStorage를 통한 사용자 설정 영구 보존

// 핵심 구현 사항
1. HTML 다크모드 클래스 자동 주입
2. SSR 하이드레이션 불일치 방지
3. 시스템 테마 변경 감지 및 동기화
4. 테마 전환 시 부드러운 애니메이션 적용
```

### Tailwind CSS 다크모드 설정

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class", // 클래스 기반 다크모드 활성화
  theme: {
    extend: {
      colors: {
        // 라이트/다크 모드 색상 시스템 정의
        background: {
          light: "#ffffff",
          dark: "#0f0f23",
        },
        text: {
          primary: {
            light: "#1f2937",
            dark: "#f9fafb",
          },
        },
      },
    },
  },
};
```
