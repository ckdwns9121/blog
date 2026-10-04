import { render, screen } from "@testing-library/react";
import PostNavigation from "./PostNavigation";
import { expectNoA11yViolations } from "@/test/a11y";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("PostNavigation accessibility", () => {
  it("names the navigation and both links without axe violations", async () => {
    const { container } = render(
      <PostNavigation
        previousPost={{ slug: "prev", title: "이전에 쓴 글" }}
        nextPost={{ slug: "next", title: "다음에 쓴 글" }}
      />,
    );

    expect(screen.getByRole("navigation", { name: "글 이동" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /이전 글.*이전에 쓴 글/ })).toHaveAttribute("href", "/posts/prev");
    await expectNoA11yViolations(container);
  });
});
