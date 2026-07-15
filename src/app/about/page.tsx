import Image from "next/image";
import Link from "next/link";
import { CodeBracketIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import { BASE_URL } from "@/shared/constants";

export const metadata: Metadata = {
  title: "박창준 블로그 - 소개",
  description:
    "스타트업을 공동창업하며 제품을 만들어본 프론트엔드 개발자 박창준입니다. 팀 생산성과 자동화에 관심이 많으며, 현재 Colosseum에서 WMS 서비스를 개발하고 있습니다.",
  keywords: ["박창준", "프론트엔드", "개발자", "소개", "이력", "React", "Next.js", "TypeScript"],
  authors: [{ name: "박창준", url: BASE_URL }],
  creator: "박창준",
  publisher: "박창준",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "박창준 블로그 - 소개",
    description:
      "스타트업을 공동창업하며 제품을 만들어본 프론트엔드 개발자 박창준입니다. 팀 생산성과 자동화에 관심이 많으며, 현재 Colosseum에서 WMS 서비스를 개발하고 있습니다.",
    type: "profile",
    locale: "ko_KR",
    siteName: "박창준",
    url: `${BASE_URL}/about`,
    images: [
      {
        url: `${BASE_URL}/logo.png`,
        width: 1200,
        height: 630,
        alt: "박창준 블로그 - 소개",
      },
    ],
  },
  twitter: {
    title: "박창준 블로그 - 소개",
    description: "스타트업을 공동창업하며 제품을 만들어본 프론트엔드 개발자 박창준입니다.",
  },
};

// JSON-LD Person 스키마 (About 페이지용 상세 정보)
const aboutPersonSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "박창준",
  url: BASE_URL,
  jobTitle: "프론트엔드 개발자",
  description:
    "스타트업을 공동창업하며 제품을 만들어본 프론트엔드 개발자 박창준입니다. 팀 생산성과 자동화에 관심이 많으며, 현재 Colosseum에서 WMS 서비스를 개발하고 있습니다.",
  sameAs: ["https://github.com/ckdwns9121", "https://linkedin.com/in/devchangjun"],
  knowsAbout: ["프론트엔드 개발", "React", "Next.js", "TypeScript", "JavaScript", "웹 개발"],
  worksFor: {
    "@type": "Organization",
    name: "Colosseum",
    url: "https://colosseum.global/",
  },
};

export default function About() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPersonSchema) }} />
      <div className="text-gray-900 dark:text-white">
        <div className="py-16">
          {/* 프로필 헤더 */}
          <div className="flex flex-col md:flex-row gap-8 mb-16 items-center md:items-start">
            {/* 왼쪽: 프로필 이미지 */}
            <div className="flex-shrink-0 flex justify-center md:justify-start">
              <div className="relative w-40 h-40 md:w-48 md:h-48 overflow-hidden">
                <Image src="/logo.png" alt="박창준 프로필" fill className="object-cover" priority />
              </div>
            </div>

            {/* 오른쪽: 정보 */}
            <div className="flex-1 w-full md:w-auto">
              <h1 className="text-3xl font-medium text-gray-900 dark:text-white mb-2 text-left">박창준</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 text-left">프론트엔드 엔지니어</p>
              <div className="flex gap-4 mb-8 justify-start">
                <Link
                  href="https://github.com/ckdwns9121"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <CodeBracketIcon aria-hidden="true" className="h-5 w-5" />
                  <span className="text-sm font-medium">GitHub</span>
                  <span className="sr-only">(새 탭에서 열림)</span>
                </Link>
                <Link
                  href="https://linkedin.com/in/devchangjun"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="text-sm font-medium">LinkedIn</span>
                  <span className="sr-only">(새 탭에서 열림)</span>
                </Link>
              </div>

              {/* 소개 */}
              <div className="text-left">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  스타트업을 공동창업하며 제품을 Zero to One까지 만들어본 경험이 있습니다.
                  <br />
                  어떤 문제라도 함께 고민한다면 해결할 수 있다고 믿고 있어요.
                  <br />
                  요즘은 팀 생산성과 자동화에 관심이 많습니다.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  현재는{" "}
                  <Link
                    href="https://colosseum.global/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium underline underline-offset-2 transition-colors"
                  >
                    Colosseum
                  </Link>
                  <span className="sr-only">(새 탭에서 열림)</span>
                  에서 WMS 서비스를 개발하고 있습니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
