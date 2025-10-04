# 기능 요구사항

## 필수 기능 (MVP)

### 콘텐츠 관리

- **Notion Database 연동**
  - Notion Database를 블로그 포스트 저장소로 활용
  - 필수 속성: 제목(Title), 작성일(Date), 카테고리(Select), 태그(Multi-select), 공개여부(Checkbox), 슬러그(Text)
  - Notion API를 통한 데이터 페칭

### 페이지 구성

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

### SSG 구현

- `getStaticPaths`와 `getStaticProps` 활용 (Pages Router) 또는 `generateStaticParams` (App Router)
- 빌드 타임에 모든 포스트 페이지 사전 생성
- 404 페이지 커스터마이징

### SEO 최적화

- 메타 태그 자동 생성 (title, description, OG tags)
- sitemap.xml 자동 생성
- robots.txt 설정
- 구조화된 데이터 (JSON-LD)

## 자동 배포 시스템

### GitHub Actions 워크플로우

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

## 선택 기능 (Phase 2)

- **검색 기능**: 클라이언트 사이드 검색 (Fuse.js)
- **댓글 시스템**: Giscus 또는 Utterances 연동
- **조회수 카운터**: Vercel Analytics 또는 Google Analytics
- **RSS 피드**: RSS.xml 자동 생성
- **시리즈 기능**: 연재글 묶기
