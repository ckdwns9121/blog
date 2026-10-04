import { contrastRatio, parseColor } from "../accessibleTheme";
import { darkSandpackTheme, lightSandpackTheme } from "./sandpackTheme";

/** 글자로 쓰이는 토큰. surface 계열은 배경이라 제외한다. */
function textColors(theme: typeof lightSandpackTheme | typeof darkSandpackTheme): Array<[string, string]> {
  const text = Object.fromEntries(Object.entries(theme.colors).filter(([key]) => !key.startsWith("surface")));
  const syntax = Object.entries(theme.syntax).map(([key, value]) => [
    `syntax.${key}`,
    typeof value === "string" ? value : value.color,
  ]) as Array<[string, string]>;
  return [...(Object.entries(text) as Array<[string, string]>), ...syntax];
}

describe.each([
  ["light", lightSandpackTheme],
  ["dark", darkSandpackTheme],
])("%s Sandpack theme", (_name, theme) => {
  it("keeps every text token at 4.5:1 or better against the editor background", () => {
    const background = parseColor(theme.colors.surface1)!;
    const failing = textColors(theme)
      .map(([token, color]) => [token, contrastRatio(parseColor(color)!, background)] as const)
      .filter(([, ratio]) => ratio < 4.5)
      .map(([token, ratio]) => `${token} ${ratio.toFixed(2)}`);
    expect(failing).toEqual([]);
  });

  it("also clears the tab bar background (surface2)", () => {
    const background = parseColor(theme.colors.surface2)!;
    for (const token of ["clickable", "accent", "base"] as const) {
      expect(contrastRatio(parseColor(theme.colors[token])!, background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
