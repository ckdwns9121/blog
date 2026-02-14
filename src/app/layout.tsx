import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/providers/ThemeProvider";
import { Footer } from "@/shared/ui/Footer";
import { ClientLayout } from "./ClientLayout";
import type { Metadata } from "next";

// Post API 어댑터 초기화
import "@/app/init-post-api";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://changjun.dev";

export const metadata: Metadata = {
  title: {
    default: "박창준 블로그",
    template: "%s | 박창준 블로그",
  },
  description:
    "박창준의 기술 블로그입니다. 프론트엔드 개발자 박창준이 React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
  keywords: [
    "박창준",
    "프론트엔드",
    "개발자",
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "웹 개발",
    "기술 블로그",
  ],
  authors: [{ name: "박창준", url: baseUrl }],
  creator: "박창준",
  publisher: "박창준",
  metadataBase: new URL(baseUrl),
  alternates: {
    types: {
      "application/rss+xml": `${baseUrl}/feed.xml`,
      "application/feed+json": `${baseUrl}/feed.json`,
      "application/atom+xml": `${baseUrl}/atom.xml`,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "박창준",
    title: "박창준 블로그",
    description:
      "박창준의 기술 블로그입니다. 프론트엔드 개발자 박창준이 React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
    url: baseUrl,
  },
  verification: {
    google: "KkCn5ZoWWUotKW-IU9GakGgXxxoLeAzeeBSig3BvUIQ",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/favicon/favicon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
};

// JSON-LD Person 스키마 (검색엔진이 "박창준"을 사람 엔티티로 인식)
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "박창준",
  url: baseUrl,
  jobTitle: "프론트엔드 개발자",
  description:
    "프론트엔드 개발자 박창준의 기술 블로그입니다. React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
  sameAs: ["https://github.com/ckdwns9121", "https://linkedin.com/in/devchangjun"],
  knowsAbout: ["프론트엔드 개발", "React", "Next.js", "TypeScript", "JavaScript", "웹 개발"],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-dark-bg`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900"
        >
          본문으로 바로가기
        </a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
