# 상태 관리 패턴

**생성일:** 2025-11-16

## 개요

이 프로젝트는 전역 상태 관리 라이브러리(Redux, Zustand 등)를 사용하지 않으며, React의 내장 상태 관리 기능과 Context API를 사용합니다.

## 상태 관리 전략

### 1. 로컬 상태 (Local State)

**사용 위치:** 컴포넌트 내부

**패턴:** `useState` Hook

**예시:**
- 모달 열기/닫기 상태
- 폼 입력 값
- UI 토글 상태

### 2. Context API

**사용 위치:** 테마 관리

**구현:** `next-themes` 라이브러리 사용

**파일:** `src/shared/providers/ThemeProvider.tsx`

```typescript
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="light" 
      enableSystem={false} 
      disableTransitionOnChange={false}
    >
      {children}
    </ThemeProvider>
  );
}
```

**특징:**
- 다크 모드 지원
- 시스템 테마 감지 비활성화 (`enableSystem={false}`)
- 기본 테마: light
- 클래스 기반 테마 전환 (`attribute="class"`)

### 3. 서버 상태 (Server State)

**패턴:** Next.js App Router의 Server Components 사용

**특징:**
- 서버 컴포넌트에서 직접 데이터 페칭
- 클라이언트 상태 관리 불필요
- SSG/ISR을 통한 캐싱

**예시:**
```typescript
// src/app/page.tsx
export default async function Home() {
  const allPosts = await getAllPosts(); // 서버에서 직접 조회
  // ...
}
```

## 상태 관리 라이브러리

### 사용하지 않는 라이브러리

- ❌ Redux
- ❌ Zustand
- ❌ Jotai
- ❌ Recoil
- ❌ MobX

### 사용하는 라이브러리

- ✅ `next-themes` - 테마 관리 (Context API 기반)

## 상태 관리 패턴별 사용 사례

### 1. 클라이언트 컴포넌트 상태

**사용 위치:**
- `PostList` - 페이지네이션 상태
- `Modal` - 모달 열기/닫기 상태
- `ImageWithModal` - 이미지 모달 상태

**패턴:**
```typescript
const [isOpen, setIsOpen] = useState(false);
```

### 2. 서버 컴포넌트 데이터

**사용 위치:**
- `page.tsx` - 포스트 목록
- `[slug]/page.tsx` - 포스트 상세

**패턴:**
```typescript
export default async function Page() {
  const data = await fetchData(); // 서버에서 직접 조회
  return <Component data={data} />;
}
```

### 3. 테마 상태

**사용 위치:** 전역 (RootLayout)

**패턴:**
```typescript
// 클라이언트 컴포넌트에서
import { useTheme } from "next-themes";

const { theme, setTheme } = useTheme();
```

## 상태 전달 패턴

### Props Drilling

일반적인 React 패턴을 따릅니다. 깊은 중첩이 필요한 경우 Context API를 고려할 수 있지만, 현재는 Props를 통한 전달을 선호합니다.

### Server-to-Client 데이터 전달

서버 컴포넌트에서 클라이언트 컴포넌트로 데이터를 전달:

```typescript
// Server Component
export default async function Page() {
  const posts = await getAllPosts();
  return <PostList posts={posts} />; // Props로 전달
}
```

## 상태 동기화

### 서버-클라이언트 동기화

- **ISR (Incremental Static Regeneration)**: `revalidate: 3600` (1시간마다 재검증)
- **빌드 시점**: SSG로 정적 페이지 생성

### 클라이언트 상태 동기화

현재 실시간 동기화가 필요한 기능이 없으므로 별도의 동기화 메커니즘이 없습니다.

## 성능 최적화

### 1. 서버 컴포넌트 활용

- 클라이언트 번들 크기 감소
- 서버에서 데이터 페칭으로 초기 로딩 시간 단축

### 2. 정적 생성 (SSG)

- 빌드 시점에 모든 페이지 생성
- 런타임 상태 관리 불필요

### 3. ISR (Incremental Static Regeneration)

- 1시간마다 자동 재검증
- 새로운 콘텐츠 자동 반영

## 향후 개선 가능성

현재 상태 관리가 단순하므로 복잡한 전역 상태가 필요한 경우를 대비하여:

1. **Zustand**: 가벼운 전역 상태 관리
2. **React Query**: 서버 상태 관리 (현재는 불필요)
3. **Jotai**: 원자적 상태 관리

하지만 현재 프로젝트 규모에서는 추가 라이브러리가 필요하지 않습니다.

