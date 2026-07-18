import { render, screen } from "@testing-library/react";
import type { ContentBlockWithChildren } from "@/shared/types/content";
import PostContent from "./PostContent";

jest.mock("../../../features/notion/ui/ContentBlockRenderer", () => ({
  ContentBlockRenderer: ({ block }: { block: ContentBlockWithChildren }) =>
    block.type === "list_item" ? (
      <li data-testid={`block-${block.id}`}>{block.fallbackText}</li>
    ) : (
      <div data-testid={`block-${block.id}`}>{block.fallbackText}</div>
    ),
}));

describe("PostContent reading width", () => {
  it("keeps prose narrow while allowing technical media to use the wide canvas", () => {
    const blocks: ContentBlockWithChildren[] = [
      { id: "paragraph", type: "text", fallbackText: "본문" },
      { id: "image", type: "image", url: "/diagram.png" },
      { id: "code", type: "code", code: "const value = 1;", language: "ts" },
      { id: "table", type: "table", rows: [], hasColumnHeader: false, hasRowHeader: false },
    ];

    render(<PostContent blocks={blocks} />);

    expect(screen.getByTestId("block-paragraph").parentElement?.classList.contains("max-w-3xl")).toBe(true);
    expect(screen.getByTestId("block-image").parentElement?.classList.contains("max-w-5xl")).toBe(true);
    expect(screen.getByTestId("block-code").parentElement?.classList.contains("max-w-5xl")).toBe(true);
    expect(screen.getByTestId("block-table").parentElement?.classList.contains("max-w-5xl")).toBe(true);
  });

  it("keeps grouped lists narrow without breaking list semantics", () => {
    const blocks: ContentBlockWithChildren[] = [
      { id: "first", type: "list_item", listType: "bulleted", fallbackText: "첫째" },
      { id: "second", type: "list_item", listType: "bulleted", fallbackText: "둘째" },
    ];

    render(<PostContent blocks={blocks} />);

    const list = screen.getByRole("list");
    expect(list.classList.contains("max-w-3xl")).toBe(true);
    expect(Array.from(list.children).map((child) => child.tagName)).toEqual(["LI", "LI"]);
  });
});
