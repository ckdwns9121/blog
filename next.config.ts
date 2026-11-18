import type { NextConfig } from "next";

/**
 * 모든 응답에 붙는 기본 보안 헤더.
 *
 * - `X-Content-Type-Options: nosniff` — Content-Type을 브라우저가 추측하지 않게 한다.
 *   피드 XML과 wasm 파일을 서빙하므로 타입 혼동을 막아 두는 편이 좋다.
 * - `X-Frame-Options: SAMEORIGIN` — 이 사이트를 다른 출처의 프레임에 넣지 못하게 한다.
 *   Utterances 댓글과 Sandpack은 반대로 이 페이지가 그쪽 iframe을 넣는 쪽이라
 *   이 헤더와 충돌하지 않는다(헤더는 "누가 우리를 프레임할 수 있는가"만 제한한다).
 * - `Referrer-Policy: strict-origin-when-cross-origin` — 외부로 나갈 때 경로·쿼리를
 *   빼고 출처만 보낸다.
 */
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const nextConfig: NextConfig = {
  // 이미지 최적화
  // `build:images`가 빌드 때 내려받아 WebP로 바꾼 이미지는 public/images에 있고,
  // 그 파일들을 다시 /_next/image로 넘기면 Vercel Image Optimization 변환 한도만
  // 축내고 결과물은 거의 같다. 그래서 Vercel의 변환을 쓰지 않고 정적 파일을 그대로
  // 서빙한다. 빌드가 매핑하지 못한 Notion 이미지는 원격 주소 그대로 나간다 — 그런
  // 이미지는 로컬에 없다는 뜻이므로, 깨져 보이면 `build:images` 로그를 먼저 보면 된다.
  // (원격 이미지 최적화를 다시 켜려면 unoptimized를 false로 바꾸고 remotePatterns를
  //  함께 되살려야 한다.)
  images: {
    unoptimized: true,
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

  // 정적 파일 캐싱 설정
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // 1년 캐싱
          },
        ],
      },
      {
        // 위 캐시 헤더와 별개로 모든 경로에 기본 보안 헤더를 붙인다.
        // Next.js는 매칭되는 source의 헤더를 모두 합쳐 적용한다.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
