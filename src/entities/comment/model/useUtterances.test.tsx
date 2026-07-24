import { render } from "@testing-library/react";
import { useUtterances } from "./useUtterances";
import { isUtterancesLoaded, loadUtterancesScript, updateUtterancesTheme } from "../api";

let currentTheme: string | undefined = "light";

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: currentTheme, resolvedTheme: currentTheme }),
}));

jest.mock("../api", () => ({
  isUtterancesLoaded: jest.fn(),
  loadUtterancesScript: jest.fn(),
  updateUtterancesTheme: jest.fn(),
}));

function TestComment() {
  const ref = useUtterances({ repo: "ckdwns9121/blog-comment" });
  return <div ref={ref} />;
}

describe("useUtterances", () => {
  beforeEach(() => {
    currentTheme = "light";
    jest.mocked(isUtterancesLoaded).mockReturnValue(false);
    jest.mocked(loadUtterancesScript).mockClear();
    jest.mocked(updateUtterancesTheme).mockClear();
  });

  it("does not append another Utterances script when only the theme changes", () => {
    const { rerender } = render(<TestComment />);

    currentTheme = "dark";
    rerender(<TestComment />);

    expect(loadUtterancesScript).toHaveBeenCalledTimes(1);
    expect(updateUtterancesTheme).toHaveBeenCalledWith(expect.any(HTMLDivElement), "github-dark");
  });
});
