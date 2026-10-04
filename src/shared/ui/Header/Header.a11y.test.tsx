import { fireEvent, render, screen } from "@testing-library/react";
import { Header } from "./Header";
import { createLogoPlugin } from "./plugins/logoPlugin";
import { createNavigationPlugin } from "./plugins/navigationPlugin";
import { createMobileSearchPlugin, createSearchPlugin } from "./plugins/searchPlugin";
import { createThemeTogglePlugin } from "./plugins/themeTogglePlugin";
import { expectNoA11yViolations } from "@/test/a11y";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));

/** ClientLayout 이 실제로 등록하는 플러그인 조합 그대로 검사한다. */
function renderHeader() {
  return render(
    <Header
      plugins={[createLogoPlugin(), createNavigationPlugin(), createSearchPlugin(), createThemeTogglePlugin()]}
      mobilePlugins={[createMobileSearchPlugin()]}
    />,
  );
}

describe("Header accessibility", () => {
  it("exposes a banner with named controls and no axe violations", async () => {
    const { container } = renderHeader();

    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "주요 네비게이션" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로 이동" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다크 모드로 전환" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "메뉴 열기" })).toHaveAttribute("aria-expanded", "false");
    await expectNoA11yViolations(container);
  });

  it("keeps the opened mobile menu accessible", async () => {
    const { container } = renderHeader();

    fireEvent.click(screen.getByRole("button", { name: "메뉴 열기" }));

    expect(screen.getByRole("button", { name: "메뉴 닫기" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "모바일 네비게이션" })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
