# 개발 기술 블로그 PRD (Product Requirements Document)

## 1. 프로젝트 개요

### 1.1 목적

- Notion을 CMS로 활용하여 콘텐츠 관리가 용이한 개인 기술 블로그 구축
- SSG 방식으로 최적화된 성능과 SEO를 제공
- 자동화된 배포 파이프라인을 통한 콘텐츠 업데이트 간소화

### 1.2 핵심 가치

- **콘텐츠 작성의 편의성**: Notion의 친숙한 UI에서 글 작성
- **최적의 성능**: 정적 사이트 생성으로 빠른 로딩 속도
- **자동화**: GitHub Actions를 통한 무중단 자동 배포

### 1.3 기술 스택

- **Frontend**: Next.js 14+ (App Router), TypeScript
- **CMS**: Notion API
- **빌드**: Static Site Generation (SSG)
- **배포**: Vercel/Netlify + GitHub Actions
- **스타일링**: Tailwind CSS + 다크모드 플러그인 (next-themes)

---

## 2. 기능 요구사항

### 2.1 필수 기능 (MVP)

#### 2.1.1 콘텐츠 관리

- **Notion Database 연동**
  - Notion Database를 블로그 포스트 저장소로 활용
  - 필수 속성: 제목(Title), 작성일(Date), 카테고리(Select), 태그(Multi-select), 공개여부(Checkbox), 슬러그(Text)
  - Notion API를 통한 데이터 페칭

#### 2.1.2 페이지 구성

- **홈페이지**

  - 최신 포스트 리스트 (페이지네이션 또는 무한 스크롤)
  - 간단한 자기소개 섹션
  - 카테고리별 필터링

- **포스트 상세 페이지**

  - Notion 블록을 HTML/Markdown으로 변환하여 렌더링
  - 코드 하이라이팅 (Prism.js 또는 Shiki)
  - 목차(TOC) 자동 생성
  - 작성일, 수정일, 읽는 시간 표시
  - 이전/다음 글 네비게이션

- **카테고리/태그 페이지**

  - 카테고리별, 태그별 포스트 필터링
  - 각 카테고리/태그의 포스트 수 표시

- **About 페이지**

  - 개발자 소개
  - 기술 스택
  - 연락처/소셜 링크

- **다크모드 지원**
  - 시스템 테마 자동 감지 (prefers-color-scheme)
  - 수동 테마 전환 토글 버튼
  - 테마 상태 로컬 스토리지 영구 저장
  - 테마 변경 시 부드러운 전환 애니메이션

#### 2.1.3 SSG 구현

- `getStaticPaths`와 `getStaticProps` 활용 (Pages Router) 또는 `generateStaticParams` (App Router)
- 빌드 타임에 모든 포스트 페이지 사전 생성
- 404 페이지 커스터마이징

#### 2.1.4 SEO 최적화

- 메타 태그 자동 생성 (title, description, OG tags)
- sitemap.xml 자동 생성
- robots.txt 설정
- 구조화된 데이터 (JSON-LD)

### 2.2 자동 배포 시스템

#### 2.2.1 GitHub Actions 워크플로우

```yaml
# 핵심 요구사항
- 스케줄: 매시간(0분) 실행 (cron: '0 * * * *')
- 트리거: 수동 실행 가능 (workflow_dispatch)
- 프로세스:
  1. Notion API로 콘텐츠 변경 여부 확인
  2. 변경사항 있을 시 빌드 실행
  3. 배포 플랫폼에 자동 배포
  4. 배포 실패 시 슬랙/이메일 알림 (선택)
```

### 2.3 선택 기능 (Phase 2)

- **검색 기능**: 클라이언트 사이드 검색 (Fuse.js)
- **댓글 시스템**: Giscus 또는 Utterances 연동
- **조회수 카운터**: Vercel Analytics 또는 Google Analytics
- **RSS 피드**: RSS.xml 자동 생성
- **시리즈 기능**: 연재글 묶기

---

## 3. 기술 설계

### 3.1 프로젝트 구조

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

### 3.2 데이터 플로우

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

### 3.3 Notion API 연동 설계

#### 3.3.1 필요한 Notion 설정

- Integration 생성 (Internal Integration)
- Database 권한 부여
- Database ID 및 API Key 환경변수 설정

#### 3.3.2 주요 API 함수

```typescript
// lib/notion.ts 주요 함수 스펙
- getAllPosts(): 전체 포스트 메타데이터 조회
- getPostBySlug(slug): 특정 포스트 상세 조회
- getPostContent(pageId): Notion 블록 → Markdown 변환
- getCategories(): 전체 카테고리 목록
- getPostsByCategory(category): 카테고리별 필터링
```

### 3.4 성능 최적화

- **이미지 최적화**: Next.js Image 컴포넌트 사용, Notion 이미지 캐싱
- **코드 스플리팅**: Dynamic import 활용
- **폰트 최적화**: next/font 사용
- **번들 사이즈 최적화**: 불필요한 라이브러리 제거

### 3.5 다크모드 구현 설계

#### 3.5.1 테마 관리 시스템

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

#### 3.5.2 Tailwind CSS 다크모드 설정

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

---

## 4. 환경 변수 설정

```env
# .env.local
NOTION_API_KEY=secret_xxxxx
NOTION_DATABASE_ID=xxxxx
NEXT_PUBLIC_SITE_URL=https://yourblog.com
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX (선택)
```

---

## 5. 개발 단계별 마일스톤

### Phase 1: 기본 구조 (1주)

- [ ] Next.js 프로젝트 초기 설정
- [ ] Notion API 연동 및 테스트
- [ ] 기본 레이아웃 및 라우팅 구성
- [ ] Notion → Markdown 변환 로직 구현

### Phase 2: 핵심 기능 (2주)

- [ ] 포스트 목록 페이지 구현
- [ ] 포스트 상세 페이지 구현
- [ ] 코드 하이라이팅 적용
- [ ] 카테고리/태그 필터링
- [ ] SEO 메타 태그 설정
- [ ] 다크모드 기능 구현 (ThemeProvider, 토글 버튼)

### Phase 3: 자동화 및 배포 (1주)

- [ ] GitHub Actions 워크플로우 작성
- [ ] 배포 환경 설정 (Vercel/Netlify)
- [ ] 1시간 주기 자동 빌드 테스트
- [ ] sitemap, robots.txt 자동 생성

### Phase 4: 최적화 및 개선 (지속)

- [ ] 성능 테스트 및 개선
- [ ] 선택 기능 추가 (검색, 댓글 등)
- [ ] 반응형 디자인 개선
- [ ] 접근성 개선
- [ ] 다크모드 전환 애니메이션 개선
- [ ] 다크모드 색상 팔레트 고도화

---

## 6. 기술적 고려사항

### 6.1 Notion API 제한사항

- Rate Limit: 초당 3 requests
- 대용량 콘텐츠 처리 시 페이지네이션 필요
- 캐싱 전략 필요 (빌드 타임 캐싱)

### 6.2 GitHub Actions 무료 티어

- Public 레포: 무제한
- Private 레포: 월 2,000분
- 1시간마다 빌드 시 월 약 720회 빌드 예상

### 6.3 배포 플랫폼 선택

- **Vercel (추천)**: Next.js 최적화, 자동 배포, 무료 티어 충분
- **Netlify**: 유사한 기능, 대안으로 고려
- **GitHub Pages**: 정적 호스팅만 가능, 제한적

### 6.4 리스크 및 대응방안

| 리스크                       | 영향도 | 대응방안                             |
| ---------------------------- | ------ | ------------------------------------ |
| Notion API 장애              | 높음   | 로컬 캐시 백업, 에러 핸들링          |
| 빌드 시간 증가 (포스트 증가) | 중간   | Incremental Static Regeneration 고려 |
| GitHub Actions 실패          | 중간   | 재시도 로직, 알림 설정               |
| 무료 티어 한도 초과          | 낮음   | 사용량 모니터링, 유료 플랜 전환      |

---

## 7. 성공 지표 (KPI)

### 7.1 기술적 지표

- 페이지 로딩 속도: 3초 이내 (Lighthouse 90점 이상)
- 빌드 성공률: 95% 이상
- 배포 자동화율: 100%

### 7.2 콘텐츠 지표

- 월 포스팅 수: 4개 이상
- SEO 점수: 90점 이상
- 모바일 최적화 점수: 90점 이상

---

## 8. 참고 라이브러리

### 8.1 필수 라이브러리

```json
{
  "@notionhq/client": "^2.2.0",
  "notion-to-md": "^3.1.0",
  "react-markdown": "^9.0.0",
  "rehype-highlight": "^7.0.0",
  "rehype-slug": "^6.0.0",
  "next-themes": "^0.2.1"
}
```

### 8.2 권장 라이브러리

```json
{
  "gray-matter": "^4.0.3",
  "reading-time": "^1.5.0",
  "date-fns": "^3.0.0",
  "clsx": "^2.0.0",
  "lucide-react": "^0.294.0"
}
```

---

## 9. 문서화 요구사항

- README.md: 프로젝트 소개, 설치 방법, 환경 설정
- CONTRIBUTING.md: 기여 가이드라인
- 코드 주석: JSDoc 스타일로 핵심 함수 문서화
- Notion Database 템플릿 공유

---

## 10. 향후 확장 계획

### 10.1 단기 (3개월)

- 뉴스레터 구독 기능
- 포스트 통계 대시보드
- 검색 최적화

### 10.2 장기 (6개월+)

- 다국어 지원 (i18n)
- PWA 전환
- 포스트 시리즈 기능 고도화
- AI 기반 관련 포스트 추천

---

## 부록: Quick Start 체크리스트

### 개발 시작 전 준비사항

- [ ] Notion Workspace 생성
- [ ] Notion Integration 생성 및 API Key 발급
- [ ] Notion Database 구조 설계 (속성 정의)
- [ ] GitHub Repository 생성
- [ ] Vercel/Netlify 계정 생성
- [ ] 도메인 준비 (선택)

### 첫 주 목표

- [ ] Next.js 프로젝트 생성 및 TypeScript 설정
- [ ] Notion API로 데이터 1건 조회 성공
- [ ] 홈페이지에 포스트 1개 렌더링 성공
- [ ] GitHub에 코드 푸시
- [ ] 기본 다크모드 설정 및 토글 버튼 구현

---

**PRD 버전**: 1.1  
**작성일**: 2025-01-26  
**최종 수정일**: 2025-01-26  
**작성자**: Senior PM  
**검토자**: FE Junior Developer  
**주요 변경사항**: 다크모드 지원 기능 추가 (MVP로 변경)
