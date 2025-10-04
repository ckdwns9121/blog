# Story 1.2: 포스트 상세 페이지 구현

## Story 정보

**Epic**: Epic 1 - 기본 블로그 기능 구현  
**Story ID**: 1.2  
**우선순위**: High  
**스토리 포인트**: 13

## 사용자 스토리

**As a** 블로그 방문자  
**I want to** 포스트의 전체 내용을 읽을 수 있도록  
**So that** 기술 지식을 습득할 수 있다

## Acceptance Criteria

- [ ] Notion 블록을 HTML/Markdown으로 변환하여 렌더링한다
- [ ] 코드 하이라이팅을 적용한다
- [ ] 목차(TOC)를 자동 생성한다
- [ ] 작성일, 수정일, 읽는 시간을 표시한다
- [ ] 이전/다음 글 네비게이션을 제공한다
- [ ] 소셜 공유 버튼을 제공한다
- [ ] 관련 포스트를 추천한다

## 기술적 요구사항

- Notion 블록 파싱 및 변환
- 코드 하이라이팅 (Prism.js 또는 Shiki)
- TOC 자동 생성
- SEO 메타 태그
- SSG를 통한 정적 생성

## 구현 세부사항

### 컴포넌트

- `PostContent.tsx` - 포스트 내용 렌더링
- `TableOfContents.tsx` - 목차 컴포넌트
- `PostNavigation.tsx` - 이전/다음 글 네비게이션
- `SocialShare.tsx` - 소셜 공유 버튼
- `RelatedPosts.tsx` - 관련 포스트 추천

### API 함수

- `getPostBySlug()` - 특정 포스트 조회
- `getPostContent()` - 포스트 내용 변환
- `getRelatedPosts()` - 관련 포스트 조회

### 데이터 타입

```typescript
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  publishedAt: Date;
  updatedAt: Date;
  category: Category;
  tags: Tag[];
  coverImage?: string;
  readingTime: number;
  toc: TableOfContentsItem[];
}
```

## 테스트 케이스

1. **포스트 내용 렌더링 테스트**

   - Notion 블록이 올바르게 변환되는지 확인
   - 코드 블록이 하이라이팅되는지 확인

2. **목차 생성 테스트**

   - 헤딩 태그로부터 목차가 생성되는지 확인
   - 목차 클릭 시 해당 섹션으로 이동하는지 확인

3. **네비게이션 테스트**

   - 이전/다음 글 링크가 올바른지 확인
   - 첫 번째/마지막 포스트에서 네비게이션 처리 확인

4. **SEO 테스트**
   - 메타 태그가 올바르게 생성되는지 확인
   - 구조화된 데이터가 포함되는지 확인

## 정의된 완료 기준 (Definition of Done)

- [ ] 모든 Acceptance Criteria가 충족되었다
- [ ] Notion 블록이 올바르게 변환된다
- [ ] 코드 하이라이팅이 적용되었다
- [ ] 목차가 자동 생성된다
- [ ] SEO 메타 태그가 생성된다
- [ ] 단위 테스트가 작성되었다
- [ ] 접근성 기준을 준수한다
- [ ] 성능 요구사항을 만족한다
