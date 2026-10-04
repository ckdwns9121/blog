import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import jsxA11y from "eslint-plugin-jsx-a11y";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * jsx-a11y 의 strict 프리셋을 전부 에러로 올린다.
 *
 * next/core-web-vitals 에도 jsx-a11y 일부 규칙이 들어 있지만 경고 수준이라 아무것도
 * 막지 못한다. 접근성 위반은 타입 오류처럼 빌드를 막아야 고쳐진다. 규칙을 끄고 싶은
 * 자리가 있으면 그 줄에 eslint-disable 주석과 이유를 함께 적는다.
 *
 * 플러그인 자체는 next 설정이 이미 등록하므로 다시 등록하지 않는다. 다시 등록하면
 * "Cannot redefine plugin" 으로 ESLint 가 멈춘다. 여기서는 규칙 수준만 올린다.
 */
const strictA11yRules = Object.fromEntries(
  Object.entries(jsxA11y.flatConfigs.strict.rules).map(([rule, setting]) => [
    rule,
    Array.isArray(setting) ? ["error", ...setting.slice(1)] : "error",
  ]),
);

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      ...strictA11yRules,
      // 스크롤되는 영역(코드 블록의 <pre>)은 키보드로 초점을 받아야 한다(axe: scrollable-region-focusable).
      // jsx-a11y 는 비상호작용 요소의 tabIndex 를 막으므로, 이름 있는 region 역할에 한해 허용한다.
      // region 은 랜드마크라 같은 글에 코드 블록이 둘이면 이름이 겹친다(axe: landmark-unique). group 을 쓴다.
      "jsx-a11y/no-noninteractive-tabindex": ["error", { roles: ["tabpanel", "group"], tags: [] }],
      // Next 의 <Link> 는 href 를 받아 <a> 로 그리므로 a 요소로 취급해 검사한다.
      "jsx-a11y/anchor-is-valid": [
        "error",
        { components: ["Link"], specialLink: ["hrefLeft", "hrefRight"], aspects: ["invalidHref", "preferButton"] },
      ],
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "playwright-report/**", "test-results/**"],
  },
];

export default eslintConfig;
