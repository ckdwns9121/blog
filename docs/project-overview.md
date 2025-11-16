# 프로젝트 개요

**생성일:** 2025-11-16  
**프로젝트명:** Changjun.blog  
**타입:** 웹 애플리케이션 (Monolith)

## 프로젝트 설명

Changjun.blog는 Next.js 15와 Notion API를 활용한 SSG(Static Site Generation) 기반 개발 블로그입니다. Notion을 Headless CMS로 사용하여 콘텐츠를 관리하며, 빌드 시점에 정적 페이지를 생성하여 빠른 로딩과 SEO 최적화를 제공합니다.

## 기술 스택 요약

| 카테고리 | 기술 |
|---------|------|
| **프레임워크** | Next.js 15.5.4 |
| **언어** | TypeScript 5 |
| **UI 라이브러리** | React 19.1.0 |
| **스타일링** | Tailwind CSS 4 |
| **CMS** | Notion API 5.1.0 |
| **패키지 관리자** | pnpm |
| **테스팅** | Jest 30.2.0 |

## 아키텍처 타입

- **저장소 구조**: Monolith (단일 프로젝트)
- **아키텍처 패턴**: Component-based + Feature-Sliced Design + SSG
- **데이터 소스**: Notion (Headless CMS)
- **배포 방식**: 정적 사이트 생성 (SSG)

## 주요 기능

1. **블로그 포스트 관리**
   - Notion에서 콘텐츠 작성
   - 자동 발행 시스템
   - 태그 및 카테고리 지원

2. **이미지 최적화**
   - 빌드 시점 WebP 변환
   - 자동 이미지 매핑
   - CDN 친화적 구조

3. **SEO 최적화**
   - 정적 페이지 생성
   - RSS/Atom/JSON Feed 제공
   - Sitemap 자동 생성

4. **다크 모드**
   - 시스템 테마 지원
   - 사용자 선택 가능

## 프로젝트 구조

```
blog/
├── src/
│   ├── app/          # Next.js App Router
│   ├── entities/     # 비즈니스 엔티티
│   ├── features/     # 기능 모듈
│   └── shared/       # 공유 리소스
├── public/           # 정적 파일
└── scripts/          # 빌드 스크립트
```

## 빠른 시작

### 설치

```bash
pnpm install
```

### 환경 변수 설정

`.env.local` 파일 생성:
```bash
NOTION_API_KEY=your_api_key
NOTION_DATABASE_ID=your_database_id
```

### 개발 서버 실행

```bash
pnpm dev
```

### 빌드

```bash
pnpm build
```

자세한 내용은 `development-guide.md` 참조

## 생성된 문서

이 프로젝트의 문서화는 다음 파일들로 구성됩니다:

- **프로젝트 개요**: `project-overview.md` (현재 파일)
- **아키텍처**: `architecture.md`
- **기술 스택**: `technology-stack.md`
- **소스 트리**: `source-tree-analysis.md`
- **API 계약서**: `api-contracts.md`
- **데이터 모델**: `data-models.md`
- **컴포넌트 인벤토리**: `component-inventory.md`
- **상태 관리**: `state-management-patterns.md`
- **개발 가이드**: `development-guide.md`

## 다음 단계

1. **프로젝트 검토**: 생성된 문서를 검토하여 정확성 확인
2. **추가 문서화**: 필요시 추가 문서 작성
3. **Brownfield PRD**: 새로운 기능 계획 시 이 문서를 참조

## 참고 자료

- **Notion 설정**: `NOTION_SETUP.md`
- **이미지 최적화**: `IMAGE_OPTIMIZATION.md`
- **프로젝트 README**: `README.md`

