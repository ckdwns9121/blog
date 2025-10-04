# Story 2.1: 다크모드 기본 구현

## Story 정보

**Epic**: Epic 2 - 다크모드 및 사용자 경험 개선  
**Story ID**: 2.1  
**우선순위**: High  
**스토리 포인트**: 5

## 사용자 스토리

**As a** 블로그 방문자  
**I want to** 다크모드와 라이트모드를 선택할 수 있도록  
**So that** 눈의 피로를 줄이고 선호하는 테마로 읽을 수 있다

## Acceptance Criteria

- [ ] 시스템 테마를 자동으로 감지한다 (prefers-color-scheme)
- [ ] 수동으로 테마를 전환할 수 있는 토글 버튼을 제공한다
- [ ] 테마 상태를 로컬 스토리지에 영구 저장한다
- [ ] 테마 변경 시 부드러운 전환 애니메이션을 적용한다
- [ ] SSR 하이드레이션 불일치를 방지한다

## 기술적 요구사항

- next-themes 라이브러리 사용
- CSS 변수 기반 테마 시스템
- localStorage를 통한 상태 저장
- SSR 하이드레이션 고려

## 구현 세부사항

### 컴포넌트

- `ThemeToggle.tsx` - 테마 전환 버튼
- `ThemeProvider.tsx` - 테마 프로바이더

### 훅

- `useTheme.ts` - 테마 관리 훅

### 스타일

- CSS 변수 기반 색상 시스템
- 다크모드 전용 스타일

### 설정 파일

```typescript
// tailwind.config.js
module.exports = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        muted: "var(--muted)",
        border: "var(--border)",
      },
    },
  },
};
```

## 테스트 케이스

1. **테마 전환 테스트**

   - 토글 버튼 클릭 시 테마가 변경되는지 확인
   - 애니메이션이 부드럽게 적용되는지 확인

2. **시스템 테마 감지 테스트**

   - 시스템 테마 변경 시 자동으로 동기화되는지 확인
   - 초기 로딩 시 시스템 테마를 감지하는지 확인

3. **상태 저장 테스트**

   - 테마 설정이 로컬 스토리지에 저장되는지 확인
   - 페이지 새로고침 후 설정이 유지되는지 확인

4. **SSR 테스트**
   - 서버와 클라이언트 렌더링이 일치하는지 확인
   - 하이드레이션 경고가 발생하지 않는지 확인

## 정의된 완료 기준 (Definition of Done)

- [ ] 모든 Acceptance Criteria가 충족되었다
- [ ] 다크모드가 모든 페이지에서 정상 작동한다
- [ ] 테마 전환이 부드럽게 이루어진다
- [ ] 사용자 설정이 영구 저장된다
- [ ] SSR 하이드레이션 불일치가 없다
- [ ] 단위 테스트가 작성되었다
- [ ] 접근성 기준을 준수한다
