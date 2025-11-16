# 기술 스택

**생성일:** 2025-11-16

## 기술 스택 요약

| 카테고리 | 기술 | 버전 | 선택 이유 |
|---------|------|------|----------|
| **프레임워크** | Next.js | 15.5.4 | SSG(Static Site Generation) 기반 블로그, App Router 사용 |
| **언어** | TypeScript | 5 | 타입 안정성 및 개발자 경험 향상 |
| **UI 라이브러리** | React | 19.1.0 | 컴포넌트 기반 UI 개발 |
| **스타일링** | Tailwind CSS | 4 | 유틸리티 기반 CSS 프레임워크 |
| **CMS** | Notion API | 5.1.0 | Headless CMS로 콘텐츠 관리, 익숙한 작성 경험 |
| **이미지 처리** | Sharp | 0.34.4 | 빌드 시점 이미지 최적화 (WebP 변환) |
| **테스팅** | Jest | 30.2.0 | 단위 테스트 및 통합 테스트 |
| **테스팅 라이브러리** | Testing Library | 16.3.0 | React 컴포넌트 테스팅 |
| **패키지 관리자** | pnpm | - | 빠른 의존성 관리 |
| **빌드 도구** | Turbopack | - | Next.js 내장 빠른 번들러 |
| **아이콘** | Heroicons | 2.2.0 | React 아이콘 라이브러리 |
| **코드 하이라이팅** | react-syntax-highlighter | 15.6.6 | 코드 블록 문법 강조 |
| **피드 생성** | feed | 5.1.0 | RSS/Atom/JSON Feed 생성 |
| **다이어그램** | mermaid | 11.12.1 | 마크다운 다이어그램 렌더링 |
| **테마 관리** | next-themes | 0.4.6 | 다크 모드 지원 |

## 아키텍처 패턴

### 컴포넌트 기반 아키텍처
- React 컴포넌트를 기반으로 한 모듈화된 UI 구조
- 재사용 가능한 컴포넌트 설계

### Feature-Sliced Design (FSD)
프로젝트는 Feature-Sliced Design 패턴을 따릅니다:

- **entities/**: 비즈니스 엔티티 (Post, Comment)
- **features/**: 기능 모듈 (notion 통합)
- **shared/**: 공유 컴포넌트 및 유틸리티

### SSG (Static Site Generation)
- 빌드 시점에 모든 페이지를 정적 HTML로 생성
- Notion API에서 데이터를 가져와 빌드 시점에 렌더링
- `force-static` 및 `revalidate`를 통한 ISR (Incremental Static Regeneration) 지원

### Headless CMS 패턴
- Notion을 CMS로 사용하여 콘텐츠 관리
- API를 통한 콘텐츠 조회 및 렌더링
- 작성 경험과 개발 경험 분리

## 데이터 저장소

이 프로젝트는 전통적인 데이터베이스를 사용하지 않습니다:
- **CMS**: Notion (외부 서비스)
- **이미지 저장**: 빌드 시점에 `public/images/`에 WebP로 변환하여 저장
- **상태 관리**: React의 내장 상태 관리 (Context API, useState)

## 빌드 및 배포

- **빌드 명령**: `pnpm build` (이미지 변환 + Next.js 빌드)
- **개발 서버**: `pnpm dev` (Turbopack 사용)
- **배포 플랫폼**: Vercel (추정, Next.js 최적화)



