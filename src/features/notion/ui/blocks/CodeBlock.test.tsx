import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders code as safe text and preserves whitespace", () => {
    const code = '\tconst html = "<img src=x onerror=alert(1)>";\n\n';
    const { container } = render(<CodeBlock code={code} language="typescript" />);

    expect(container.querySelector("code")?.textContent).toBe(code);
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByLabelText("typescript 코드")).toHaveAttribute("tabindex", "0");
    expect(screen.getByText("const")).toHaveClass("text-[#7e22ce]", "dark:text-[#d8b4fe]");
  });

  it("displays unsupported languages without syntax colors", () => {
    const { container } = render(<CodeBlock code={"print('hello')\n"} language="python" />);

    expect(container.querySelector("code")?.textContent).toBe("print('hello')\n");
    expect(container.querySelector("code span")).not.toHaveAttribute("class");
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
