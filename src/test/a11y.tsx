import { axe, type JestAxeConfigureOptions } from "jest-axe";
import type { ReactNode } from "react";

/**
 * 컴포넌트 접근성 테스트의 공통 도우미.
 *
 * jest-axe 는 jsdom 에서 돌기 때문에 레이아웃이 필요한 규칙(명도 대비 등)은 평가하지
 * 못한다. 그 대신 이름 없는 버튼·링크, 레이블 없는 입력, 잘못된 ARIA, 랜드마크·헤딩
 * 구조처럼 마크업만으로 판정되는 문제를 잡는다. 레이아웃이 필요한 규칙은
 * e2e/a11y.spec.ts 가 실제 배포 페이지에서 본다.
 */
const options: JestAxeConfigureOptions = {
  rules: {
    // jsdom 에는 레이아웃이 없어 색 대비를 계산할 수 없다. 켜 두면 결과가 늘 "계산 불가"다.
    "color-contrast": { enabled: false },
    // 컴포넌트 조각은 페이지가 아니다. 페이지 단위 규칙은 e2e 에서 확인한다.
    region: { enabled: false },
    "landmark-one-main": { enabled: false },
    "page-has-heading-one": { enabled: false },
  },
};

export async function expectNoA11yViolations(container: Element) {
  expect(await axe(container, options)).toHaveNoViolations();
}

/** next/link 를 평범한 <a> 로 바꾼다. 라우터 없이 렌더하기 위해서다. */
export function mockNextLink() {
  jest.mock("next/link", () => ({
    __esModule: true,
    default: function MockLink({
      href,
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode }) {
      return (
        <a href={href} {...props}>
          {children}
        </a>
      );
    },
  }));
}
