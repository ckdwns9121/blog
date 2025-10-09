import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 이미지 최적화
  images: {
    unoptimized: true,
    // Notion 이미지 도메인 허용
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.notion.so",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazonaws.com",
      },
    ],
  },

  // 엄격 모드
  reactStrictMode: true,

  // SSG 최적화 설정
  // output: "export", // 완전한 정적 HTML로 빌드 (ISR 비활성화)
  // Vercel에서는 output: "export" 대신 페이지별 force-static 사용 권장

  // 압축 활성화
  compress: true,

  // PoweredBy 헤더 제거 (보안)
  poweredByHeader: false,

  // 정적 페이지 생성 최적화
  generateBuildId: async () => {
    // 빌드 ID를 커스텀하여 캐시 무효화 제어
    return `build-${Date.now()}`;
  },
};

export default nextConfig;
