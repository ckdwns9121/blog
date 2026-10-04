import { contrastRatio, ensureContrast, parseColor, themeBackground, withAccessibleContrast } from "./accessibleTheme";
// jest 는 ESM 번들을 못 읽으므로 CJS 빌드에서 가져온다. 내용은 같다.
import oneLight from "react-syntax-highlighter/dist/cjs/styles/prism/one-light";
import oneDark from "react-syntax-highlighter/dist/cjs/styles/prism/one-dark";

describe("parseColor", () => {
  it("reads hex, hsl and rgb", () => {
    expect(parseColor("#fafafa")).toEqual({ r: 250, g: 250, b: 250 });
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("hsl(221, 87%, 60%)")).toEqual({ r: 64, g: 120, b: 242 });
    expect(parseColor("rgb(80, 161, 79)")).toEqual({ r: 80, g: 161, b: 79 });
    expect(parseColor("inherit")).toBeNull();
  });
});

describe("ensureContrast", () => {
  const white = { r: 250, g: 250, b: 250 };

  it("leaves colors alone when they already pass", () => {
    const black = { r: 0, g: 0, b: 0 };
    expect(ensureContrast(black, white)).toBe(black);
  });

  it("darkens a light-background color just enough and keeps its hue", () => {
    const blue = parseColor("hsl(221, 87%, 60%)")!; // oneLight 함수 색, 3.9:1
    const fixed = ensureContrast(blue, white);
    expect(contrastRatio(fixed, white)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(fixed, white)).toBeLessThan(5.2); // 필요한 만큼만
    expect(fixed.b).toBeGreaterThan(fixed.r); // 여전히 파랑
  });

  it("lightens on a dark background", () => {
    const dark = { r: 40, g: 44, b: 52 };
    const dim = { r: 90, g: 90, b: 90 };
    const fixed = ensureContrast(dim, dark);
    expect(contrastRatio(fixed, dark)).toBeGreaterThanOrEqual(4.5);
    expect(fixed.r).toBeGreaterThan(dim.r);
  });
});

describe.each([
  ["oneLight", oneLight],
  ["oneDark", oneDark],
])("withAccessibleContrast(%s)", (_name, theme) => {
  const fixed = withAccessibleContrast(theme);
  const background = themeBackground(theme);

  it("makes every token color reach 4.5:1 against the code background", () => {
    const failing = Object.entries(fixed)
      .filter(([selector, style]) => !selector.includes("::") && typeof style.color === "string" && parseColor(style.color))
      .filter(([, style]) => {
        const own = typeof style.background === "string" ? parseColor(style.background) : null;
        return contrastRatio(parseColor(style.color as string)!, own ?? background) < 4.5;
      })
      .map(([selector]) => selector);
    expect(failing).toEqual([]);
  });

  it("keeps selectors, backgrounds and non-color properties intact", () => {
    expect(Object.keys(fixed)).toEqual(Object.keys(theme));
    const withoutColor = (style: object) =>
      Object.fromEntries(Object.entries(style).filter(([key]) => key !== "color"));
    for (const [selector, style] of Object.entries(theme)) {
      expect(withoutColor(fixed[selector])).toEqual(withoutColor(style));
    }
  });

  it("does not mutate the original theme", () => {
    expect(theme.comment?.color).toMatch(/^hsl/);
  });
});
