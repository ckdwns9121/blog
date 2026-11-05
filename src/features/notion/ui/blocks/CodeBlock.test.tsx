import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CodeBlock } from "./CodeBlock";
import { tokenizeCode, type CodeToken } from "../../wasm/tokenizeCode";

jest.mock("../../wasm/tokenizeCode", () => ({
  ...jest.requireActual("../../wasm/tokenizeCode"),
  tokenizeCode: jest.fn(),
}));
const mockTokenizeCode = jest.mocked(tokenizeCode);

describe("CodeBlock", () => {
  beforeEach(() => {
    mockTokenizeCode.mockReset().mockRejectedValue(new Error("Wasm unavailable"));
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders code as safe text before and after Wasm loads", async () => {
    const code = '\tconst html = "<img src=x onerror=alert(1)>";\n\n';
    mockTokenizeCode.mockResolvedValue([
      { type: "text", value: "\t" },
      { type: "keyword", value: "const" },
      { type: "text", value: code.slice(6) },
    ]);
    const { container } = render(<CodeBlock code={code} language="typescript" />);

    expect(container.querySelector("code")?.textContent).toBe(code);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByLabelText("typescript 코드")).toHaveAttribute("tabindex", "0");
    expect(await screen.findByText("const")).toHaveClass("text-[#7e22ce]", "dark:text-[#d8b4fe]");
    expect(container.querySelector("code")?.textContent).toBe(code);
  });

  it("displays unsupported languages without syntax colors", () => {
    const { container } = render(<CodeBlock code={"print('hello')\n"} language="python" />);

    expect(container.querySelector("code")?.textContent).toBe("print('hello')\n");
    expect(container.querySelector("code span")).not.toHaveAttribute("class");
    expect(mockTokenizeCode).not.toHaveBeenCalled();
  });

  it("ignores old results when props change while Wasm is loading", async () => {
    let resolveFirst!: (tokens: CodeToken[]) => void;
    let resolveSecond!: (tokens: CodeToken[]) => void;
    mockTokenizeCode
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));
    const { container, rerender, unmount } = render(<CodeBlock code="first" language="js" />);
    rerender(<CodeBlock code="second" language="js" />);
    await act(async () => { resolveFirst([{ type: "keyword", value: "first" }]); });
    expect(container.querySelector("code")?.textContent).toBe("second");
    expect(container.querySelector("code span")).not.toHaveAttribute("class");
    unmount();
    await act(async () => { resolveSecond([{ type: "keyword", value: "second" }]); });
  });

  it("copies the original source and resets the success message", async () => {
    jest.useFakeTimers();
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const code = '\tconst answer = 42;\n';
    render(<CodeBlock code={code} language="js" />);

    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "코드 복사" })); });

    expect(writeText).toHaveBeenCalledWith(code);
    expect(screen.getByRole("button", { name: "코드 복사 완료" })).toHaveTextContent("복사됨");
    act(() => { jest.advanceTimersByTime(2000); });
    expect(screen.getByRole("button", { name: "코드 복사" })).toHaveTextContent("복사");
  });

  it("keeps the copy button available when clipboard access fails", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("Clipboard denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<CodeBlock code="const value = 1;" language="js" />);

    fireEvent.click(screen.getByRole("button", { name: "코드 복사" }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "코드 복사" })).toHaveTextContent("복사");
  });
});
