import { render } from "@testing-library/react";
import { NoteList } from "./NoteList";
import { expectNoA11yViolations } from "@/test/a11y";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("NoteList accessibility", () => {
  it("has no axe violations with notes", async () => {
    const { container } = render(
      <NoteList
        notes={[
          { id: "n1", title: "오늘의 생각", slug: "오늘의-생각", excerpt: "짧은 메모", writtenAt: new Date(2026, 9, 3) },
          { id: "n2", title: "요약 없는 노트", slug: "요약-없는-노트", excerpt: "", writtenAt: new Date(2026, 9, 2) },
        ]}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it("has no axe violations when empty", async () => {
    const { container } = render(<NoteList notes={[]} />);
    await expectNoA11yViolations(container);
  });
});
