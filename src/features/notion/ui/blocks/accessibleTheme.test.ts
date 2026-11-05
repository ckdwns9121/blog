import { contrastRatio, parseColor } from "./accessibleTheme";

describe("parseColor", () => {
  it("reads hex, hsl and rgb", () => {
    expect(parseColor("#fafafa")).toEqual({ r: 250, g: 250, b: 250 });
    expect(parseColor("#fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseColor("hsl(221, 87%, 60%)")).toEqual({ r: 64, g: 120, b: 242 });
    expect(parseColor("rgb(80, 161, 79)")).toEqual({ r: 80, g: 161, b: 79 });
    expect(parseColor("inherit")).toBeNull();
  });
});

describe("contrastRatio", () => {
  it("calculates the WCAG endpoints and is independent of color order", () => {
    const black = parseColor("#000")!;
    const white = parseColor("#fff")!;
    expect(contrastRatio(black, white)).toBe(21);
    expect(contrastRatio(white, black)).toBe(21);
    expect(contrastRatio(black, black)).toBe(1);
  });
});
