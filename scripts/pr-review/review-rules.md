# PR 리뷰 규칙 (Review Rules)

이 프로젝트는 Next.js 15 기반 블로그로 Notion을 CMS로 사용합니다.

## 1. 아키텍처 규칙 (Architecture)

### Feature-Sliced Design (FSD) 준수
```
src/
├── entities/     # 도메인 엔티티 (CMS-agnostic)
├── features/     # 기능 모듈 (notion, search, page-views 등)
├── shared/       # 공유 UI, 타입, 유틸리티
└── widgets/      # 복합 UI 컴포넌트
```

- **entities/**: Notion 의존성 없이 범용적이어야 함
- **features/notion/**: Notion API 연동은 이곳만
- **shared/types/**: CMS-agnostic 타입 정의
- 순환 의존성 금지 (상위 레이어가 하위 레이어 import 금지)

### Adapter Pattern
- Notion 전용 타입 → 공용 타입 변환은 `features/notion/utils/blockAdapter.ts`에서
- 새로운 CMS로 교체 가능하도록 설계

## 2. TypeScript 규칙

### 타입 안전성
- `any` 타입 사용 금지 (명백한 이유 없는 경우)
- `unknown` 사용 후 타입 가드 prefer
- 인터페이스는 `shared/types/`에 정의
- 제네릭 타입은 명확한 제약 조건 포함

```typescript
// Bad
function process(data: any) { ... }

// Good
function process<T extends Record<string, unknown>>(data: T): Processed<T> { ... }
```

## 3. React/Next.js 규칙

### Server vs Client Components
- 가능한 Server Component 사용 우선
- Client Component는 `"use client"` 지정
- `use client`가 필요한 최소한의 컴포넌트로 분리

```typescript
// Server Component (기본)
export default function Page() { ... }

// Client Component (필요한 경우만)
"use client";
export function InteractiveComponent() { ... }
```

### Hooks 규칙
- Custom hooks는 `hooks/` 또는 `use*` 파일에
- Hook은 순수 함수로 사이드 이펙트 최소화
- 의존성 배열은 빠짐없이 명시

### State Management
- 서버 상태: React Query (`@tanstack/react-query`)
- 로컬 상태: useState, useReducer
- 전역 상태: Context API (필요한 경우만)

## 4. 성능 규칙

### 이미지 처리
- Notion S3 URL은 만료되므로 로컬 변환 필수
- 이미지는 빌드 시 `buildImages.ts`로 최적화
- WebP/AVIF 형식 사용
- `next/image` 컴포넌트 사용

### 데이터 fetching
- 병렬 요청으로 대기 시간 최소화 (`Promise.all`)
- React Query 캐싱 활용
- SSG/ISR 우선, SSR 최소화

### 번들 크기
- 동적 import로 코드 스플리팅
- 라이브러리는 서브패스 import 고려

```typescript
// Good
import { Button } from '@radix-ui/react-slot'

// Avoid (전체 import)
import * as Radix from '@radix-ui/react-slot'
```

## 5. 보안 규칙

### 입력 검증
- 사용자 입력은 항상 검증 및 이스케이프
- Notion API 응답도 신뢰하지 말고 처리

### API 키 & 시크릿
- 환경변수만 사용 (.gitignore에 .env)
- 코드에 하드코딩 금지
- GitHub Secrets 사용 (Actions)

### 콘텐츠 보안
- XSS 방지: React의 자동 이스케이프 의존
- `dangerouslySetInnerHTML` 사용 시 sanitize 필수

## 6. 코드 스타일

### 명명 규칙
- 컴포넌트: PascalCase (`PostList.tsx`)
- 함수/변수: camelCase (`fetchPostData`)
- 타입: PascalCase (`PostData`, `FetchFn`)
- 상수: UPPER_SNAKE_CASE (`API_BASE_URL`)
- private 멤버: 접두사 `_` (_internalMethod)

### 파일 구조
- 하나의 파일 = 하나의 주요 export
- 관련 파일은 같은 디렉토리
- index.ts로 public API 노출

```typescript
// features/notion/ui/blocks/index.ts
export { CodeBlock } from './CodeBlock';
export { ImageBlock } from './ImageBlock';
```

## 7. 에러 처리

- API 호출은 try-catch로 감싸
- 에러는 사용자에게 친숙한 메시지로 변환
- 에러 로깅은 일관되게

```typescript
// Good
try {
  const data = await fetchData();
} catch (error) {
  console.error('[FetchError] Failed to fetch:', error);
  return { error: '데이터를 불러올 수 없습니다.' };
}
```

## 8. 테스트 & 품질

- 복잡한 로직은 유닛 테스트 작성
- 불필요한 `console.log`는 커밋 전 제거
- ESLint 경고는 해결 후 커밋

## 9. Notion API 특이사항

- 블록 조회는 페이지네이션 (100개씩)
- 이미지 URL은 만료되므로 프록시 또는 다운로드 필요
- Rate Limit 주의 (초당 요청 제한)

## 10. PR 작성 가이드

- 커밋 메시지는 명확하게 (무엇을, 왜)
- 변경사항이 많으면 여러 PR로 분할
- Breaking Change가 있으면 명시
- 테스트 방법 포함 (관련된 경우)
