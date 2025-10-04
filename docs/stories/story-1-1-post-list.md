# Story 1.1: 포스트 목록 페이지 구현

## Story 정보

**Epic**: Epic 1 - 기본 블로그 기능 구현  
**Story ID**: 1.1  
**우선순위**: High  
**스토리 포인트**: 8

## 사용자 스토리

**As a** 블로그 방문자  
**I want to** 최신 포스트 목록을 볼 수 있도록  
**So that** 새로운 콘텐츠를 쉽게 발견할 수 있다

## Acceptance Criteria

- [ ] Notion API를 통해 포스트 데이터를 가져온다
- [ ] 포스트 카드 형태로 목록을 표시한다
- [ ] 페이지네이션 또는 무한 스크롤을 구현한다
- [ ] 포스트 제목, 작성일, 카테고리, 태그를 표시한다
- [ ] 포스트 썸네일 이미지를 표시한다
- [ ] 포스트 요약(excerpt)을 표시한다
- [ ] 읽는 시간을 표시한다

## 기술적 요구사항

- Next.js App Router 사용
- Notion API 연동
- TypeScript 타입 정의
- 반응형 디자인
- SSG를 통한 정적 생성

## 구현 세부사항

### 컴포넌트

- `PostCard.tsx` - 개별 포스트 카드 컴포넌트
- `PostList.tsx` - 포스트 목록 컴포넌트
- `Pagination.tsx` - 페이지네이션 컴포넌트

### API 함수

- `getAllPosts()` - 전체 포스트 조회
- `getPostsByPage()` - 페이지별 포스트 조회

### 데이터 타입

```typescript
interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: Date;
  category: string;
  tags: string[];
  coverImage?: string;
  readingTime: number;
}
```

## 테스트 케이스

1. **포스트 목록 로딩 테스트**

   - Notion API에서 데이터를 정상적으로 가져오는지 확인
   - 로딩 상태 표시 확인

2. **포스트 카드 표시 테스트**

   - 모든 필수 정보가 표시되는지 확인
   - 이미지가 없을 때 기본 이미지 표시 확인

3. **페이지네이션 테스트**

   - 페이지 이동이 정상 작동하는지 확인
   - 마지막 페이지에서 다음 버튼 비활성화 확인

4. **반응형 테스트**
   - 모바일, 태블릿, 데스크톱에서 정상 표시 확인

## 정의된 완료 기준 (Definition of Done)

- [ ] 모든 Acceptance Criteria가 충족되었다
- [ ] 단위 테스트가 작성되었다
- [ ] 컴포넌트 테스트가 작성되었다
- [ ] 반응형 디자인이 적용되었다
- [ ] 접근성 기준을 준수한다
- [ ] 코드 리뷰가 완료되었다
- [ ] 성능 요구사항을 만족한다 (로딩 시간 3초 이내)
