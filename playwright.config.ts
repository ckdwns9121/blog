import { defineConfig, devices } from "@playwright/test";

/**
 * 배포된 사이트를 상대로 접근성(axe)만 검사하는 설정.
 *
 * 로컬 서버를 띄우지 않는다. 글 페이지는 Notion 데이터와 빌드가 있어야 나오므로,
 * Vercel 이 미리보기·운영 배포를 끝낸 뒤 그 주소(A11Y_BASE_URL)를 받아 검사한다.
 * 실행: A11Y_BASE_URL=https://... pnpm test:a11y
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.A11Y_BASE_URL ?? "https://www.changjun.dev",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // 모바일에서는 하단 네비게이션과 햄버거 메뉴처럼 데스크톱에 없는 UI 가 나온다.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
