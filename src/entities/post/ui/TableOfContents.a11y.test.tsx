import { render, screen } from "@testing-library/react";
import TableOfContents from "./TableOfContents";
import { expectNoA11yViolations } from "@/test/a11y";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

beforeAll(() => {
  class FakeIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "IntersectionObserver", { writable: true, value: FakeIntersectionObserver });
});

describe("TableOfContents accessibility", () => {
  it("exposes a named navigation with nested heading links and no axe violations", async () => {
    const { container } = render(
      <TableOfContents
        items={[
          { id: "intro", title: "들어가며", level: 2 },
          { id: "why", title: "왜 느린가", level: 3 },
          { id: "fix", title: "고치기", level: 2 },
        ]}
      />,
    );

    expect(screen.getByRole("navigation", { name: "글 목차" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
    await expectNoA11yViolations(container);
  });
});
