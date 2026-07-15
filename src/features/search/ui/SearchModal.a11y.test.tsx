import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { SearchModal } from "./SearchModal";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../../../components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div role="dialog" aria-modal="true" aria-labelledby="search-dialog-title" {...props}>{children}</div>
  ),
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 id="search-dialog-title" {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
}));

describe("SearchModal accessibility", () => {
  it("has no detectable axe violations", async () => {
    const { container } = render(
      <SearchModal
        isOpen
        onClose={jest.fn()}
        onRetry={jest.fn()}
        state={{ status: "success", posts: [] }}
      />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });
});
