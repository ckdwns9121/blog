import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import BottomNavigation from "./BottomNavigation";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock("../../components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTrigger: ({ children }: { children: React.ReactNode }) => children,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <section role="dialog" aria-modal="true" aria-labelledby="toc-dialog-title" {...props}>{children}</section>
  ),
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id="toc-dialog-title" {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
}));

describe("BottomNavigation accessibility", () => {
  it("provides a named dialog, navigation landmark, and keyboard button", async () => {
    const { container } = render(
      <BottomNavigation tocItems={[{ id: "intro", title: "소개", level: 2 }]} />,
    );

    expect(screen.getByRole("button", { name: "목차 열기" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "목차" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "글 목차" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
