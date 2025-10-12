import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/shared/providers/ThemeProvider";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { ScrollProgress } from "@/shared/components/ScrollProgress";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: {
    default: "프론트엔드 개발자 박창준",
    template: "%s | 박창준 블로그",
  },
  description:
    "프론트엔드 개발자 박창준의 블로그입니다. React, Next.js, TypeScript 등 웹 개발 경험과 지식을 공유합니다.",
  keywords: ["프론트엔드", "개발자", "박창준", "React", "Next.js", "TypeScript", "JavaScript", "웹 개발"],
  authors: [{ name: "박창준" }],
  creator: "박창준",
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
    siteName: "박창준 블로그",
  },
  verification: {
    google: "KkCn5ZoWWUotKW-IU9GakGgXxxoLeAzeeBSig3BvUIQ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-dark-bg`}
      >
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
