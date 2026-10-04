/** @type {import('jest').Config} */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  // e2e/ 는 Playwright 가 돌린다. jest 가 *.spec.ts 를 주워 가지 않게 뺀다.
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/", "<rootDir>/e2e/"],
  moduleDirectories: ["node_modules", "<rootDir>/"],
  // jest.mock()은 next/jest가 tsconfig paths를 적용하기 전에 경로를 풀기 때문에
  // "@/..." 별칭을 직접 매핑해준다. 이게 없으면 모듈 모킹이 해석에 실패한다.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
