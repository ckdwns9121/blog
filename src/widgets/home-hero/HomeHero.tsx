/**
 * 홈 최상단 소개 영역.
 * 처음 방문한 사람이 "누구의 블로그인지"를 목록보다 먼저 알 수 있게 한다.
 * 외부 링크(GitHub/LinkedIn 등)는 Footer가 담당한다.
 */
export function HomeHero() {
  return (
    <section className="border-line border-b py-8 sm:py-10">
      <h1 className="text-fg text-xl font-semibold sm:text-2xl">박창준</h1>
      <p className="text-fg-muted mt-1.5 text-sm leading-6 sm:text-base">
        프론트엔드 개발자. 팀 생산성과 자동화에 관심이 많습니다.
      </p>
    </section>
  );
}
