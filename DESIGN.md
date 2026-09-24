# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-08-30
- Primary product surfaces: 글 목록, 검색, 글 상세, About
- Evidence reviewed: `src/app`, `src/entities/post`, `src/features/search`, `src/shared/ui`, `src/app/globals.css`

## Brand
- Personality: 차분하고 실용적인 개인 개발 기술 블로그
- Trust signals: 원문 출처, 코드, 날짜, 조회수, 작성자의 실제 경험
- Avoid: 과도한 장식, 무거운 그림자, 읽기를 방해하는 애니메이션과 배너

## Product goals
- Goals: 긴 기술 글을 편하게 읽고 탐색하며 코드와 이미지를 쉽게 확인할 수 있게 한다.
- Non-goals: 미디어 포털형 홈, 복잡한 소셜 기능, 별도 디자인 시스템 도입
- Success signals: 목차 이동, 코드 복사, 이미지 확대, 다음 글 탐색의 마찰 감소

## Personas and jobs
- Primary personas: 프론트엔드 기술 글을 읽는 개발자와 채용 관계자
- User jobs: 필요한 섹션 찾기, 코드 복사, 도해 확인, 관련 글 탐색
- Key contexts of use: 데스크톱의 긴 글 정독, 모바일의 짧은 탐색

## Information architecture
- Primary navigation: Post, About, Search
- Core routes/screens: `/`, `/posts/[slug]`, `/search`, `/about`
- Content hierarchy: 제목 → 메타데이터 → 요약 → 본문 → 이전·다음 글 → 댓글

## Design principles
- 읽기 우선: 본문 폭과 대비를 유지하고 보조 UI는 본문을 침범하지 않는다.
- 재사용 우선: 기존 목차, 모달, 테마 토큰과 반응형 패턴을 확장한다.
- 점진적 노출: 데스크톱 목차는 오른쪽에, 모바일 목차는 기존 bottom sheet에 둔다.
- Tradeoffs: 목차는 본문 `max-w-3xl` 바깥 오른쪽 여백에 배치하며 본문 폭과 중앙 정렬에 영향을 주지 않는다.

## Visual language
- Color: 기존 primary green과 gray 계열, 다크 모드 토큰 유지
- Typography: Geist Sans 본문, Geist Mono 코드
- Spacing/layout rhythm: 본문 3xl 폭, 4/6/8 기반 간격
- Shape/radius/elevation: 작은 radius와 얕은 그림자, 테두리 중심
- Motion: 짧은 상태 전환만 사용, reduced-motion 존중
- Imagery/iconography: Heroicons와 실제 글 도해 중심

## Components
- Existing components to reuse: `TableOfContents`, `BottomNavigation`, `ImageWithModal`, `Dialog`, `ScrollProgress`
- New/changed components: 데스크톱 글 레이아웃, CodeBlock 도구막대, 읽기 시간 표시
- Variants and states: 복사 전·후, light·dark, 데스크톱·모바일
- Token/component ownership: Tailwind theme와 `globals.css`

## Accessibility
- Target standard: WCAG 2.1 AA 수준의 기존 접근성 관례 유지
- Keyboard/focus behavior: 목차 링크, 복사 버튼, 이미지 확대 버튼 모두 키보드 접근 가능
- Contrast/readability: 기존 gray/primary 대비 유지
- Screen-reader semantics: `nav`, `aside`, `aria-label`, 복사 상태 알림 제공
- Reduced motion and sensory considerations: 전역 reduced-motion 규칙 유지

## Responsive behavior
- Supported breakpoints/devices: 모바일부터 데스크톱까지 Tailwind breakpoints
- Layout adaptations: 본문은 항상 기존 단일 컬럼과 중앙 정렬 유지, `xl` 이상에서만 레이아웃 바깥 오른쪽에 sticky 목차 추가
- Touch/hover differences: 모바일 목차는 bottom sheet, 데스크톱은 hover·active 상태

## Interaction states
- Loading: 기존 검색·목록 로딩 유지
- Empty: 목차 항목이 없으면 목차 UI 미노출
- Error: 기존 Notion/검색 오류 흐름 유지
- Success: 코드 복사 후 짧은 `복사됨` 피드백
- Disabled: 해당 없음
- Offline/slow network: 정적 글 본문과 로컬 최적화 이미지 우선

## Content voice
- Tone: 간결한 한국어 기술 문체
- Terminology: React, DOM, Layout 등 익숙한 기술 용어 유지
- Microcopy rules: 짧고 직접적인 `복사`, `복사됨`, `목차`, `분 읽기`

## Implementation constraints
- Framework/styling system: Next.js 15, React 19, Tailwind CSS 4
- Design-token constraints: 기존 primary/dark 토큰 재사용
- Performance constraints: 글 본문의 불필요한 전역 상태와 무거운 클라이언트 의존성 금지
- Compatibility constraints: 현재 Next.js Image·Notion adapter 구조 유지
- Test/screenshot expectations: TypeScript, ESLint, Jest와 데스크톱·모바일 레이아웃 확인

## Open questions
- [ ] 태그 기반 관련 글과 시리즈 탐색은 별도 기능으로 검토

## About companion interaction (2026-09-24)
- About 페이지 오른쪽에서 사용자가 승인한 2등신 캐리커처에 피부색·세이지 티셔츠·남색 바지를 적용한 Rive를 표시한다. 머리·얼굴 윤곽·몸은 원화를 유지하고 눈동자와 눈꺼풀만 움직인다.
- 두 눈은 같은 방향으로 제한된 범위 안에서 부드럽게 움직이고, 포인터가 화면 밖으로 나가면 정면으로 돌아온다.
- 3.2–5.4초 간격의 짧은 눈깜빡임을 추가한다. 원래 프로필 파일은 유지한다. 로딩·오류·reduced-motion 시 정면 정지 렌더를 사용한다.
- Rive와 WASM은 로컬 제공. 화면 밖·백그라운드·움직임 종료 시 렌더링을 멈춰 읽기 경험과 자원 사용을 보호한다.
- 캐릭터 배경은 실제 알파 투명으로 처리한다. 클릭·터치·Enter/Space로 점프 → 8방향 그림을 이용한 3회전 → 주머니에서 노트북 꺼내기·펼치기 → 정면 복귀를 재생한다.
- 동작 중 연속 클릭은 막는다. reduced-motion에서는 투명한 정지 캐릭터를 표시하고 액션을 실행하지 않는다. 페이지 이탈·비가시 상태에서는 동작과 타이머를 정리한다.

- 점프 회전에는 민트·금빛·하늘색 빛줄기, 별빛과 착지 파동을 Rive 레이어로 추가한다. 얼굴을 읽을 수 있는 강도로 제한하고 노트북 동작 전 모두 사라진다.

- About은 기존 프로필 사진과 크기를 복원한다. 캐릭터는 About(`/about`)에만 표시하고 Post(`/`)에서는 제외한다. 1280px 이상에서는 본문 바깥 오른쪽 여백에 고정하고, 좁은 화면에서는 About 소개 아래의 오른쪽 별도 공간에 배치해 글을 가리지 않는다.

- 5초 동안 커서 움직임이 없으면 머리를 세 번 긁고 손을 내리는 약 2초 동작을 재생한다. 클릭 액션이 우선하며, 화면 밖·백그라운드·reduced-motion에서는 유휴 동작과 예약을 취소한다.
