# 아키텍처 개요

## 시스템 비전

Notion을 CMS로 활용한 개인 기술 블로그 시스템으로, SSG(Static Site Generation) 기반의 고성능 웹사이트를 구축합니다. 개발자의 콘텐츠 작성 편의성과 사용자의 최적화된 읽기 경험을 동시에 제공하는 것이 핵심 목표입니다.

## 핵심 아키텍처 원칙

- **콘텐츠 중심 설계**: Notion Database를 단일 진실 소스(Single Source of Truth)로 활용
- **성능 우선**: SSG를 통한 정적 사이트 생성으로 최적의 로딩 속도 보장
- **자동화 중심**: GitHub Actions를 통한 무중단 배포 파이프라인
- **개발자 경험**: 친숙한 Notion UI를 통한 콘텐츠 작성
- **사용자 경험**: 다크모드, 반응형 디자인, SEO 최적화

## 기술 스택 요약

| 계층         | 기술 스택                            | 역할                       |
| ------------ | ------------------------------------ | -------------------------- |
| **Frontend** | Next.js 14+ (App Router), TypeScript | 정적 사이트 생성 및 렌더링 |
| **CMS**      | Notion API                           | 콘텐츠 관리 및 저장        |
| **스타일링** | Tailwind CSS + next-themes           | 반응형 디자인 및 다크모드  |
| **빌드**     | Next.js SSG                          | 정적 사이트 생성           |
| **배포**     | Vercel + GitHub Actions              | 자동 배포 및 호스팅        |
| **모니터링** | Vercel Analytics                     | 성능 및 사용량 추적        |
