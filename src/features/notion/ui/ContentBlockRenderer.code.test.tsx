import { render, screen } from "@testing-library/react";
import { ContentBlockRenderer } from "./ContentBlockRenderer";

jest.mock("@/features/notion/ui/blocks/CodeBlock", () => ({
  CodeBlock: ({ language }: { language: string }) => <pre data-testid="code-block" data-language={language} />,
}));
jest.mock("@/features/notion/ui/blocks/sandbox/SandpackBlock", () => ({
  SandpackBlock: ({ caption }: { caption?: string }) => <div data-testid="sandpack-block" data-caption={caption} />,
}));

describe("ContentBlockRenderer code blocks", () => {
  it("renders an ordinary code block when there is no sandbox caption", () => {
    render(<ContentBlockRenderer block={{ id: "c", type: "code", code: "1", language: "typescript", caption: "설명" }} />);
    expect(screen.getByTestId("code-block")).toHaveAttribute("data-language", "typescript");
    expect(screen.queryByTestId("sandpack-block")).toBeNull();
  });

  it("hands a sandbox-captioned block to the playground", () => {
    render(<ContentBlockRenderer block={{ id: "c", type: "code", code: "1", language: "tsx", caption: "sandbox:react" }} />);
    expect(screen.getByTestId("sandpack-block")).toHaveAttribute("data-caption", "sandbox:react");
    expect(screen.queryByTestId("code-block")).toBeNull();
  });
});
