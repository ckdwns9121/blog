import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 이미지 최적화
  images: {
    unoptimized: true,
  },

  // 엄격 모드
  reactStrictMode: true,
};

export default nextConfig;
