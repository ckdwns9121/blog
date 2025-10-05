# Changjun.blog - 개발 기술 블로그

Next.js 15와 Notion API를 활용한 **SSG(Static Site Generation)** 기반 개발 블로그입니다.

## ✨ 주요 기능

- 📝 **Notion CMS**: Notion을 CMS로 사용하여 포스트 관리
- 🎨 **다크모드**: 시스템 설정을 따르는 다크모드 지원
- ⚡ **SSG 최적화**: 빌드 타임에 모든 페이지 정적 생성
- 📱 **반응형 디자인**: 모바일/태블릿/데스크톱 완벽 지원
- 🔍 **SEO 최적화**: 메타데이터, Open Graph, Twitter 카드
- 📖 **목차 자동 생성**: 포스트 헤딩 기반 목차
- 🎯 **타입 안전**: TypeScript로 작성
- ✅ **테스트**: Jest + Testing Library

## 🛠️ 기술 스택

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **CMS**: Notion API
- **Code Highlighting**: React Syntax Highlighter
- **Icons**: Heroicons
- **Testing**: Jest, Testing Library

## 🚀 시작하기

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하세요:

```env
NOTION_API_KEY=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id
```

**Notion 설정 방법:**

1. [Notion Integrations](https://www.notion.so/my-integrations)에서 Integration 생성
2. API 키 복사
3. Notion 데이터베이스를 Integration에 연결
4. 데이터베이스 ID 복사 (URL에서 확인 가능)

자세한 설정 방법은 [NOTION_SETUP.md](./NOTION_SETUP.md)를 참고하세요.

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📦 빌드 & 배포

### 프로덕션 빌드

```bash
npm run build
npm run start
```

### SSG 배포 (Vercel, Netlify 등)

이 프로젝트는 **SSG로 최적화**되어 있습니다:

- ✅ `generateStaticParams` 구현
- ✅ 메타데이터 최적화
- ✅ 이미지 최적화 설정

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

### 추천 배포 플랫폼

- **Vercel** (추천): Next.js 최적화, 자동 배포
- **Netlify**: 쉬운 설정, 무료 호스팅
- **GitHub Pages**: 완전 정적 사이트로 내보내기

## 🧪 테스트

```bash
# 테스트 실행
npm run test

# 워치 모드
npm run test:watch
```

## 📂 프로젝트 구조

```
src/
├── app/                    # Next.js 앱 라우터
│   ├── page.tsx           # 홈페이지 (포스트 목록)
│   ├── posts/[slug]/      # 포스트 상세 페이지
│   ├── about/             # About 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 공통 컴포넌트
├── entities/              # 도메인 엔티티
│   └── post/             # 포스트 관련 컴포넌트
├── service/              # 비즈니스 로직
│   └── notion.ts         # Notion API 클라이언트
├── shared/               # 공유 UI 컴포넌트
│   ├── Header.tsx        # 헤더
│   └── Footer.tsx        # 푸터
├── lib/                  # 유틸리티 함수
├── providers/            # Context Providers
└── types/                # TypeScript 타입 정의
```

## 🎨 커스터마이징

### 블로그 정보 수정

- **사이트 제목**: `src/app/layout.tsx`
- **푸터 정보**: `src/shared/Footer.tsx`
- **헤더 로고**: `src/shared/Header.tsx`

### 스타일 수정

- **색상 테마**: `tailwind.config.js`
- **전역 스타일**: `src/app/globals.css`

## 📝 포스트 작성 방법

1. Notion에서 데이터베이스에 새 페이지 추가
2. 다음 속성 설정:
   - **제목** (Title)
   - **slug** (Text)
   - **카테고리** (Select)
   - **태그** (Multi-select)
   - **상태** (Select): "Published"
3. 포스트 본문 작성
4. 재배포 또는 ISR 대기

## 🔄 업데이트 & 재배포

Notion 내용을 업데이트하면:

- **Vercel**: Git push 시 자동 재배포
- **수동**: `npm run build` 후 재배포
- **ISR**: `revalidate` 옵션으로 자동 갱신 (선택사항)

## 📄 라이센스

MIT License - 자유롭게 사용하세요!

## 🤝 기여

이슈 및 PR을 환영합니다!

---

**Built with ❤️ by changjun**
