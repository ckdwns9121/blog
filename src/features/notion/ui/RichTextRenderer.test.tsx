import { render, screen } from "@testing-library/react";
import { RichTextRenderer } from "./RichTextRenderer";
import type { RichTextItem } from "../types";

function item(overrides: Partial<RichTextItem>): RichTextItem {
  return {
    plain_text: "강조된 문장",
    annotations: {
      bold: false,
      italic: false,
      strikethrough: false,
      underline: false,
      code: false,
      color: "default",
    },
    ...overrides,
  } as RichTextItem;
}

describe("RichTextRenderer", () => {
  it("renders bold text in the brand colour instead of inheriting body colour", () => {
    render(<RichTextRenderer items={[item({ annotations: { bold: true } as RichTextItem["annotations"] })]} />);

    const strong = screen.getByText("강조된 문장");
    expect(strong.tagName).toBe("STRONG");
    expect(strong).toHaveClass("text-primary-700", "dark:text-primary-300");
  });

  it("leaves plain text without a colour override", () => {
    render(<RichTextRenderer items={[item({})]} />);

    const span = screen.getByText("강조된 문장");
    expect(span.tagName).toBe("SPAN");
    expect(span.className).toBe("");
  });

  it("keeps bold styling when the text is also a link", () => {
    render(
      <RichTextRenderer
        items={[
          item({
            href: "https://example.com",
            annotations: { bold: true } as RichTextItem["annotations"],
          }),
        ]}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(screen.getByText("강조된 문장").tagName).toBe("STRONG");
  });
});
