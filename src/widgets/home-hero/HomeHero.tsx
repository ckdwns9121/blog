import Image from "next/image";
import Link from "next/link";

interface HeroLink {
  label: string;
  href: string;
  external: boolean;
}

const LINKS: HeroLink[] = [
  { label: "About", href: "/about", external: false },
  { label: "GitHub", href: "https://github.com/ckdwns9121", external: true },
  { label: "LinkedIn", href: "https://linkedin.com/in/devchangjun", external: true },
  { label: "RSS", href: "/feed.xml", external: false },
];

/**
 * 홈 최상단 소개 영역.
 * 처음 방문한 사람이 "누구의 블로그인지"를 목록보다 먼저 알 수 있게 한다.
 */
export function HomeHero() {
  return (
    <section className="border-line flex items-center gap-5 border-b py-10">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20">
        <Image
          src="/profile.jpeg"
          alt="박창준 프로필"
          fill
          sizes="(max-width: 640px) 64px, 80px"
          className="object-cover"
          priority
        />
      </div>

      <div className="min-w-0">
        <h1 className="text-fg text-xl font-semibold sm:text-2xl">박창준</h1>
        <p className="text-fg-muted mt-1 text-sm leading-6 sm:text-base">
          프론트엔드 개발자. 팀 생산성과 자동화에 관심이 많습니다.
        </p>

        <nav aria-label="프로필 링크" className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {LINKS.map(({ label, href, external }) => (
            <Link
              key={label}
              href={href}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-fg-subtle hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
            >
              {label}
              {external && <span className="sr-only">(새 탭에서 열림)</span>}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
