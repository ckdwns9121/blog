# 개발 가이드

**생성일:** 2025-11-16

## 사전 요구사항

### 필수 소프트웨어

- **Node.js**: 20.x 이상
- **pnpm**: 패키지 관리자 (npm 대신 사용)
- **Git**: 버전 관리

### 권장 도구

- **VS Code** 또는 **Cursor**: 코드 에디터
- **TypeScript**: 타입 체크 (프로젝트에 포함)

---

## 설치 및 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd blog
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수를 설정합니다:

```bash
# Notion API 설정
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# 사이트 설정 (선택사항)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Notion API 키 및 데이터베이스 ID 설정 방법:**
- 자세한 내용은 `NOTION_SETUP.md` 참조

---

## 개발 명령어

### 개발 서버 실행

```bash
pnpm dev
```

- 개발 서버가 `http://localhost:3000`에서 실행됩니다
- Turbopack을 사용하여 빠른 핫 리로드 제공
- 코드 변경 시 자동으로 페이지가 새로고침됩니다

### 빌드

```bash
# 전체 빌드 (이미지 변환 + Next.js 빌드)
pnpm build

# 이미지만 변환
pnpm build:images
```

**빌드 프로세스:**
1. 이미지 변환: Notion 이미지를 WebP로 변환
2. Next.js 빌드: 정적 페이지 생성

### 프로덕션 서버 실행

```bash
pnpm start
```

빌드 후 프로덕션 모드로 서버를 실행합니다.

### 린트

```bash
pnpm lint
```

ESLint를 사용하여 코드 스타일을 검사합니다.

### 테스트

```bash
# 테스트 실행
pnpm test

# 감시 모드 (파일 변경 시 자동 실행)
pnpm test:watch
```

Jest와 Testing Library를 사용하여 테스트를 실행합니다.

---

## 프로젝트 구조

### 주요 디렉토리

- `src/app/`: Next.js App Router 페이지 및 라우트
- `src/entities/`: 비즈니스 엔티티 컴포넌트
- `src/features/`: 기능 모듈 (Notion 통합 등)
- `src/shared/`: 공유 컴포넌트 및 유틸리티
- `public/`: 정적 파일 (이미지, 파비콘 등)
- `scripts/`: 빌드 스크립트

자세한 내용은 `source-tree-analysis.md` 참조

---

## 개발 워크플로우

### 1. 새 포스트 추가

1. Notion 데이터베이스에서 새 페이지 생성
2. 필수 속성 입력:
   - `title`: 포스트 제목
   - `published`: 발행 여부 (체크)
   - `publishedAt`: 발행일
3. 콘텐츠 작성
4. 로컬에서 확인:
   ```bash
   pnpm dev
   ```
5. 빌드 및 배포:
   ```bash
   pnpm build
   ```

### 2. 이미지 추가

1. Notion 페이지에 이미지 추가
2. 빌드 시 자동으로 WebP로 변환됨
3. `public/images/{post-slug}/`에 저장됨

**수동 이미지 변환:**
```bash
pnpm build:images
```

### 3. 스타일 수정

- Tailwind CSS 사용
- `src/app/globals.css`에서 전역 스타일 정의
- 컴포넌트별로 Tailwind 클래스 사용

### 4. 컴포넌트 추가

**새 컴포넌트 생성:**
1. 적절한 디렉토리 선택:
   - 공유 컴포넌트: `src/shared/components/`
   - 엔티티 컴포넌트: `src/entities/{entity}/`
   - 기능 컴포넌트: `src/features/{feature}/components/`
2. TypeScript 파일 생성
3. 필요한 경우 `index.ts`에서 export

---

## 환경 변수

### 필수 환경 변수

- `NOTION_API_KEY`: Notion Integration Token
- `NOTION_DATABASE_ID`: Notion 데이터베이스 ID

### 선택적 환경 변수

- `NEXT_PUBLIC_SITE_URL`: 사이트 URL (기본값: `https://changjun.dev`)

### 환경 변수 파일

- `.env.local`: 로컬 개발용 (Git에 커밋하지 않음)
- `.env.example`: 예시 파일 (선택사항)

---

## 빌드 프로세스

### 이미지 최적화

빌드 시 자동으로 수행되는 작업:

1. 모든 Notion 포스트 가져오기
2. 이미지 URL 추출 (커버 이미지 + 콘텐츠 이미지)
3. 각 이미지를 WebP로 변환 (품질 85%)
4. `public/images/{post-slug}/`에 저장
5. URL 매핑 정보를 `image-mapping.json`에 저장

**자세한 내용:** `IMAGE_OPTIMIZATION.md` 참조

### 정적 페이지 생성

Next.js가 다음 페이지를 정적으로 생성합니다:

- 홈페이지 (`/`)
- About 페이지 (`/about`)
- 모든 포스트 페이지 (`/posts/{slug}`)
- 피드 페이지 (`/feed.xml`, `/feed.json`, `/atom.xml`)
- 메타데이터 페이지 (`/robots.txt`, `/sitemap.xml`)

---

## 테스트 전략

### 테스트 도구

- **Jest**: 테스트 러너
- **Testing Library**: React 컴포넌트 테스트
- **jest-environment-jsdom**: 브라우저 환경 시뮬레이션

### 테스트 파일 위치

- 컴포넌트 테스트: `__tests__/` 디렉토리 또는 `*.test.tsx` 파일
- 유틸리티 테스트: `*.test.ts` 파일

### 테스트 실행

```bash
# 모든 테스트 실행
pnpm test

# 감시 모드
pnpm test:watch

# 커버리지 리포트
pnpm test --coverage
```

---

## 코드 스타일

### TypeScript

- 엄격 모드 활성화 (`strict: true`)
- 타입 안정성 우선
- 명시적 타입 정의

### ESLint

- Next.js 기본 규칙 사용
- TypeScript 규칙 포함
- 자동 수정 가능한 규칙 자동 적용

### 포맷팅

현재 Prettier 설정은 없지만, ESLint 규칙을 따릅니다.

---

## 일반적인 개발 작업

### 새 페이지 추가

1. `src/app/{route}/page.tsx` 파일 생성
2. Server Component 또는 Client Component로 구현
3. 메타데이터 정의 (선택사항)

### API 라우트 추가

1. `src/app/{route}/route.ts` 파일 생성
2. HTTP 메서드 함수 export (`GET`, `POST` 등)

### 컴포넌트 수정

1. 해당 컴포넌트 파일 수정
2. 개발 서버에서 자동 리로드 확인
3. 필요시 테스트 업데이트

---

## 문제 해결

### 이미지가 표시되지 않음

1. 이미지 변환 확인:
   ```bash
   pnpm build:images
   ```
2. `public/images/` 디렉토리 확인
3. 이미지 매핑 파일 확인: `src/shared/utils/imageMapping.generated.ts`

### Notion API 오류

1. 환경 변수 확인: `.env.local` 파일
2. Notion Integration 권한 확인
3. 데이터베이스 ID 확인

### 빌드 실패

1. 의존성 재설치:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
2. 캐시 삭제:
   ```bash
   rm -rf .next
   ```
3. TypeScript 오류 확인:
   ```bash
   pnpm tsc --noEmit
   ```

---

## 성능 최적화

### 이미지 최적화

- 빌드 시점에 WebP로 변환
- Sharp를 사용한 고품질 변환
- 자동 캐싱 (이미 변환된 이미지 재사용)

### 정적 생성

- SSG를 통한 빠른 로딩
- ISR을 통한 주기적 업데이트 (1시간)

### 번들 최적화

- Turbopack을 사용한 빠른 개발 빌드
- Next.js 자동 코드 스플리팅

---

## 배포

### Vercel (권장)

1. GitHub 저장소 연결
2. 빌드 명령어: `pnpm build`
3. 환경 변수 설정
4. 자동 배포 활성화

### 기타 플랫폼

**Netlify:**
- 빌드 명령어: `pnpm build`
- 출력 디렉토리: `.next`

**커스텀 서버:**
```bash
pnpm build
pnpm start
```

---

## 추가 리소스

- **Notion 설정**: `NOTION_SETUP.md`
- **이미지 최적화**: `IMAGE_OPTIMIZATION.md`
- **프로젝트 구조**: `source-tree-analysis.md`
- **기술 스택**: `technology-stack.md`


