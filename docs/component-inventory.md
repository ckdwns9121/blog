# 컴포넌트 인벤토리

**생성일:** 2025-11-16

## 개요

이 프로젝트는 Feature-Sliced Design (FSD) 아키텍처를 따르며, 컴포넌트는 다음과 같이 분류됩니다:

- **shared/components**: 공유 UI 컴포넌트
- **entities**: 비즈니스 엔티티 컴포넌트
- **features**: 기능별 컴포넌트

## 컴포넌트 분류

### 1. 레이아웃 컴포넌트 (Layout Components)

#### Header
**위치:** `src/shared/components/Header.tsx`

**기능:**
- 네비게이션 메뉴
- 다크 모드 토글
- 반응형 햄버거 메뉴 (모바일)
- 로고/브랜딩

**상태:**
- `isMenuOpen`: 모바일 메뉴 열기/닫기
- `theme`: 다크/라이트 모드 (next-themes)

**의존성:**
- `next-themes`
- `@heroicons/react`

---

#### Footer
**위치:** `src/shared/components/Footer.tsx`

**기능:**
- 저작권 정보 표시
- 푸터 레이아웃

**특징:**
- 다크 모드 지원
- 반응형 디자인

---

#### BottomNavigation
**위치:** `src/shared/components/BottomNavigation.tsx`

**기능:**
- 모바일 하단 네비게이션
- 주요 페이지 링크

---

### 2. 공유 UI 컴포넌트 (Shared UI Components)

#### Modal
**위치:** `src/shared/components/Modal.tsx`

**기능:**
- 모달 오버레이
- 모달 컨텐츠 표시
- 닫기 기능

**Props:**
- `isOpen`: 모달 열기/닫기 상태
- `onClose`: 닫기 핸들러
- `children`: 모달 내용
- `maxWidth`: 최대 너비 (기본값: "max-w-7xl")

**특징:**
- ESC 키로 닫기
- 오버레이 클릭으로 닫기
- 다크 모드 지원

---

#### Pagination
**위치:** `src/shared/components/Pagination.tsx`

**기능:**
- 페이지네이션 UI
- 페이지 번호 표시
- 이전/다음 버튼

---

#### ScrollProgress
**위치:** `src/shared/components/ScrollProgress.tsx`

**기능:**
- 스크롤 진행률 표시
- 상단 고정 진행 바

---

### 3. 포스트 엔티티 컴포넌트 (Post Entity Components)

#### PostCard
**위치:** `src/entities/post/PostCard.tsx`

**기능:**
- 포스트 카드 표시
- 제목, 요약, 태그, 날짜 표시
- 포스트 상세 페이지 링크

**Props:**
- `post`: BlogPost 객체

**특징:**
- 반응형 레이아웃
- 다크 모드 지원
- 태그 표시

---

#### PostList
**위치:** `src/entities/post/PostList.tsx`

**기능:**
- 포스트 목록 표시
- 페이지네이션
- 태그 필터링
- URL 동기화 (쿼리 파라미터)

**상태:**
- `currentPage`: 현재 페이지
- `selectedTag`: 선택된 태그

**특징:**
- 클라이언트 사이드 페이지네이션
- URL 쿼리 파라미터와 상태 동기화
- 브라우저 뒤로/앞으로 가기 지원

---

#### PostContent
**위치:** `src/entities/post/PostContent.tsx`

**기능:**
- 포스트 콘텐츠 렌더링
- Notion 블록 렌더링
- 목차 표시

**의존성:**
- `NotionBlockRenderer`

---

#### PostNavigation
**위치:** `src/entities/post/PostNavigation.tsx`

**기능:**
- 이전/다음 포스트 네비게이션
- 포스트 간 이동

---

#### TableOfContents
**위치:** `src/entities/post/TableOfContents.tsx`

**기능:**
- 목차 (TOC) 표시
- 섹션 링크
- 스크롤 위치에 따른 활성화

---

#### ClientPagination
**위치:** `src/entities/post/ClientPagination.tsx`

**기능:**
- 클라이언트 사이드 페이지네이션 로직
- 페이지 계산 및 필터링

---

### 4. 댓글 엔티티 컴포넌트 (Comment Entity Components)

#### Comment
**위치:** `src/entities/comment/Comment.tsx`

**기능:**
- 댓글 표시
- 댓글 작성자 정보
- 댓글 내용

---

### 5. Notion 기능 컴포넌트 (Notion Feature Components)

#### NotionBlockRenderer
**위치:** `src/features/notion/components/NotionBlockRenderer.tsx`

**기능:**
- Notion 블록을 React 컴포넌트로 변환
- 블록 타입별 렌더링
- 중첩 블록 처리

**지원 블록 타입:**
- 제목 (heading_1, heading_2, heading_3)
- 단락 (paragraph)
- 리스트 (bulleted_list_item, numbered_list_item)
- 코드 (code)
- 인용 (quote)
- 이미지 (image)
- 비디오 (video)
- 구분선 (divider)
- 북마크 (bookmark)

---

#### RichTextRenderer
**위치:** `src/features/notion/components/RichTextRenderer.tsx`

**기능:**
- Notion Rich Text를 HTML로 변환
- 텍스트 스타일링 (bold, italic, code 등)
- 링크 처리

---

#### CodeBlock
**위치:** `src/features/notion/components/blocks/CodeBlock.tsx`

**기능:**
- 코드 블록 렌더링
- 문법 강조 (react-syntax-highlighter)
- 언어 표시
- 복사 버튼

**의존성:**
- `react-syntax-highlighter`

---

#### ImageBlock
**위치:** `src/features/notion/components/blocks/ImageBlock.tsx`

**기능:**
- 이미지 블록 렌더링
- Next.js Image 컴포넌트 사용
- 캡션 표시

---

#### ImageWithModal
**위치:** `src/features/notion/components/blocks/ImageWithModal.tsx`

**기능:**
- 이미지 클릭 시 모달로 확대
- 이미지 미리보기

**의존성:**
- `Modal` 컴포넌트

---

#### VideoBlock
**위치:** `src/features/notion/components/blocks/VideoBlock.tsx`

**기능:**
- 비디오 블록 렌더링
- 비디오 플레이어

---

## 컴포넌트 재사용성

### 재사용 가능한 컴포넌트

- ✅ `Modal` - 범용 모달
- ✅ `Pagination` - 범용 페이지네이션
- ✅ `Header` - 레이아웃 헤더
- ✅ `Footer` - 레이아웃 푸터
- ✅ `ScrollProgress` - 범용 스크롤 진행률

### 도메인 특화 컴포넌트

- `PostCard` - 블로그 포스트 전용
- `PostList` - 블로그 포스트 목록 전용
- `NotionBlockRenderer` - Notion 콘텐츠 전용

## 컴포넌트 패턴

### 1. Server/Client 컴포넌트 분리

- **Server Components**: 데이터 페칭 (page.tsx)
- **Client Components**: 인터랙티브 UI ("use client" 지시어)

### 2. Props 기반 데이터 전달

- 서버 컴포넌트에서 클라이언트 컴포넌트로 Props 전달
- Props drilling 최소화

### 3. 컴포지션 패턴

- 작은 컴포넌트를 조합하여 큰 컴포넌트 구성
- 예: `PostContent` → `NotionBlockRenderer` → `CodeBlock`, `ImageBlock` 등

## 스타일링

### Tailwind CSS 사용

- 모든 컴포넌트는 Tailwind CSS 클래스 사용
- 다크 모드: `dark:` 접두사 사용
- 반응형: `sm:`, `md:`, `lg:` 브레이크포인트 사용

### 커스텀 테마

- Primary 색상: `#75A788` 기반 팔레트
- 다크 모드 배경: `#070b14` (매우 어두운 남색)

## 컴포넌트 통계

- **총 컴포넌트 수**: 약 20개
- **공유 컴포넌트**: 6개
- **엔티티 컴포넌트**: 7개
- **기능 컴포넌트**: 7개

## 향후 개선 가능성

1. **컴포넌트 문서화**: Storybook 도입 고려
2. **테스트 커버리지**: 컴포넌트 단위 테스트 추가
3. **접근성 개선**: ARIA 속성 보강
4. **성능 최적화**: React.memo, useMemo 활용

