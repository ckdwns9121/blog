import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { expectNoA11yViolations } from "@/test/a11y";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Footer accessibility", () => {
  it("names external links as opening in a new tab and has no axe violations", async () => {
    const { container } = render(<Footer />);

    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "사이트 및 프로필 링크" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAccessibleName(/새 탭에서 열림/);
    await expectNoA11yViolations(container);
  });
});
