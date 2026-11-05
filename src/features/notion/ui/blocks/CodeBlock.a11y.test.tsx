import { act, fireEvent, render, screen } from "@testing-library/react";
import { expectNoA11yViolations } from "@/test/a11y";
import { contrastRatio, parseColor } from "./accessibleTheme";
import { CodeBlock, TOKEN_COLORS } from "./CodeBlock";

describe("CodeBlock accessibility", () => {
  it("keeps every syntax color above WCAG AA contrast in both themes", () => {
    for (const classes of Object.values(TOKEN_COLORS).filter(Boolean)) {
      const colors = classes.match(/#[0-9a-f]{6}/g)!;
      expect(colors).toHaveLength(2);
      expect(contrastRatio(parseColor(colors[0])!, parseColor("#f9fafb")!)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(parseColor(colors[1])!, parseColor("#030712")!)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("exposes a named keyboard-focusable code region and copy action", async () => {
    const { container } = render(<CodeBlock code="const value = 42;" language="typescript" />);

    expect(screen.getByRole("group", { name: "typescript 코드" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("button", { name: "코드 복사" })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it("preserves the code region, its focus and scroll position across updates", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    const { rerender } = render(<CodeBlock code="const value = 42;" language="typescript" />);
    const region = screen.getByRole("group", { name: "typescript 코드" });
    region.focus();
    region.scrollLeft = 120;

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "코드 복사" })); });
    rerender(<CodeBlock code="const value = 43;" language="typescript" />);

    expect(screen.getByRole("group", { name: "typescript 코드" })).toBe(region);
    expect(region).toHaveFocus();
    expect(region.scrollLeft).toBe(120);
    expect(region).toHaveTextContent("43");
  });
});
