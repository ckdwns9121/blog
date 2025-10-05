import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSG 최적화 설정
  output: "standalone", // 또는 "export"로 완전한 정적 사이트 생성

  // 이미지 최적화 (export 모드에서는 unoptimized: true 필요)
  images: {
    unoptimized: true, // Vercel, Netlify 등에서는 false로 설정 가능
  },

  // 엄격 모드
  reactStrictMode: true,
};

export default nextConfig;
