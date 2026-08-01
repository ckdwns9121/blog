"use client";

import Link from "next/link";

interface FooterLink {
  label: string;
  href: string;
  external: boolean;
}

const LINKS: FooterLink[] = [
  { label: "About", href: "/about", external: false },
  { label: "GitHub", href: "https://github.com/ckdwns9121", external: true },
  { label: "LinkedIn", href: "https://linkedin.com/in/devchangjun", external: true },
  { label: "RSS", href: "/feed.xml", external: false },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-line mt-auto border-t">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4">
          <nav aria-label="사이트 및 프로필 링크">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {LINKS.map(({ label, href, external }) => (
                <li key={label}>
                  <Link
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-fg-muted hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                  >
                    {label}
                    {external && <span className="sr-only">(새 탭에서 열림)</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="text-fg-subtle text-sm">
            © {currentYear} <span className="font-semibold">changjun</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
