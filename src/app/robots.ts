import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://changjun.dev";

  return {
    rules: [
      {
        userAgent: "*", // 모든 검색 엔진 봇 허용
        allow: "/", // 모든 경로 크롤링 허용
        disallow: ["/api/"], // API 경로는 크롤링 차단
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`, // 사이트맵 위치 알려주기
  };
}
