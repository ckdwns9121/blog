import { MetadataRoute } from "next";
import { BASE_URL } from "@/shared/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*", // 모든 검색 엔진 봇 허용
        allow: "/", // 모든 경로 크롤링 허용
        disallow: ["/api/"], // API 경로는 크롤링 차단
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`, // 사이트맵 위치 알려주기
  };
}
