# Changjun.blog 프로젝트 문서 인덱스

**타입:** Monolith (단일 프로젝트)  
**주요 언어:** TypeScript  
**아키텍처:** Component-based + Feature-Sliced Design + SSG  
**최종 업데이트:** 2025-11-16

## 프로젝트 개요

Changjun.blog는 Next.js 15와 Notion API를 활용한 SSG(Static Site Generation) 기반 개발 블로그입니다. Notion을 Headless CMS로 사용하여 콘텐츠를 관리하며, 빌드 시점에 정적 페이지를 생성하여 빠른 로딩과 SEO 최적화를 제공합니다.

## 빠른 참조

- **기술 스택:** Next.js 15.5.4, React 19.1.0, TypeScript 5, Tailwind CSS 4
- **CMS:** Notion API 5.1.0
- **진입점:** `src/app/layout.tsx`, `src/app/page.tsx`
- **아키텍처 패턴:** Component-based + Feature-Sliced Design + SSG
- **데이터베이스:** 없음 (Notion 사용)

## 생성된 문서

### 핵심 문서

- [프로젝트 개요](./project-overview.md) - 프로젝트 전체 개요 및 빠른 시작
- [아키텍처](./architecture.md) - 상세한 시스템 아키텍처 문서
- [소스 트리 분석](./source-tree-analysis.md) - 디렉토리 구조 및 파일 조직

### 기술 문서

- [기술 스택](./technology-stack.md) - 사용된 기술 및 버전 정보
- [API 계약서](./api-contracts.md) - API 엔드포인트 및 통합 문서
- [데이터 모델](./data-models.md) - 데이터 구조 및 타입 정의
- [상태 관리 패턴](./state-management-patterns.md) - 상태 관리 전략 및 패턴
- [컴포넌트 인벤토리](./component-inventory.md) - UI 컴포넌트 카탈로그

### 개발 문서

- [개발 가이드](./development-guide.md) - 개발 환경 설정 및 워크플로우

## 기존 문서

프로젝트에 이미 존재하는 문서:

- [README.md](../README.md) - 프로젝트 기본 정보
- [IMAGE_OPTIMIZATION.md](../IMAGE_OPTIMIZATION.md) - 이미지 최적화 가이드
- [NOTION_SETUP.md](../NOTION_SETUP.md) - Notion API 설정 가이드

## 시작하기

### 새 개발자를 위한 가이드

1. **프로젝트 이해**: [프로젝트 개요](./project-overview.md) 읽기
2. **아키텍처 파악**: [아키텍처 문서](./architecture.md) 읽기
3. **개발 환경 설정**: [개발 가이드](./development-guide.md) 따라하기
4. **코드 구조 이해**: [소스 트리 분석](./source-tree-analysis.md) 참조

### AI 지원 개발을 위한 가이드

이 문서는 AI 지원 개발을 위해 생성되었습니다. Brownfield PRD 워크플로우에서 이 인덱스를 참조하여 기존 시스템을 이해하고 새로운 기능을 계획할 수 있습니다.

**주요 참조 문서:**
- **아키텍처 이해**: `architecture.md`
- **기존 컴포넌트 활용**: `component-inventory.md`
- **데이터 구조 파악**: `data-models.md`
- **API 통합**: `api-contracts.md`

## 프로젝트 구조 요약

```
blog/
├── src/
│   ├── app/          # Next.js App Router (페이지 및 라우트)
│   ├── entities/     # 비즈니스 엔티티 (Post, Comment)
│   ├── features/     # 기능 모듈 (Notion 통합)
│   └── shared/       # 공유 리소스 (컴포넌트, 유틸리티)
├── public/           # 정적 파일 (이미지, 파비콘)
└── scripts/          # 빌드 스크립트
```

## 기술 스택 요약

| 카테고리 | 기술 | 버전 |
|---------|------|------|
| 프레임워크 | Next.js | 15.5.4 |
| 언어 | TypeScript | 5 |
| UI 라이브러리 | React | 19.1.0 |
| 스타일링 | Tailwind CSS | 4 |
| CMS | Notion API | 5.1.0 |
| 패키지 관리자 | pnpm | - |
| 테스팅 | Jest | 30.2.0 |

## 주요 기능

1. **블로그 포스트 관리**: Notion에서 콘텐츠 작성 및 자동 발행
2. **이미지 최적화**: 빌드 시점 WebP 변환
3. **SEO 최적화**: 정적 페이지 생성, RSS/Atom/JSON Feed, Sitemap
4. **다크 모드**: 시스템 테마 지원

## 다음 단계

### 개발자

1. [개발 가이드](./development-guide.md)를 따라 개발 환경 설정
2. [소스 트리 분석](./source-tree-analysis.md)을 참조하여 코드 구조 이해
3. [컴포넌트 인벤토리](./component-inventory.md)를 확인하여 재사용 가능한 컴포넌트 파악

### 프로젝트 관리자

1. [프로젝트 개요](./project-overview.md)를 검토하여 프로젝트 상태 파악
2. [아키텍처 문서](./architecture.md)를 참조하여 시스템 구조 이해
3. 새로운 기능 계획 시 이 문서를 참조하여 기존 시스템과의 통합 고려

### AI 지원 개발

1. Brownfield PRD 워크플로우에서 이 인덱스를 참조
2. 기존 아키텍처와 컴포넌트를 활용하여 새로운 기능 계획
3. 데이터 모델과 API 계약서를 참조하여 통합 지점 파악

## 문서 업데이트

이 문서는 `document-project` 워크플로우에 의해 자동 생성되었습니다. 프로젝트 구조나 기술 스택이 변경되면 워크플로우를 다시 실행하여 문서를 업데이트할 수 있습니다.

**상태 파일:** `project-scan-report.json` - 워크플로우 진행 상태 추적

---

**생성일:** 2025-11-16  
**워크플로우 버전:** 1.2.0  
**스캔 레벨:** Exhaustive


