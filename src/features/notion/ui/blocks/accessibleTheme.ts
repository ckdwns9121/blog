/**
 * react-syntax-highlighter 의 Prism 테마를 WCAG AA 명도 대비(4.5:1)에 맞게 보정한다.
 *
 * oneLight 는 함수(파랑 3.9:1), 문자열(초록 3.1:1), 주석(회색 2.5:1)이 모두 기준에
 * 못 미친다. 테마를 통째로 바꾸면 익숙한 색 구성이 사라지므로, 각 토큰의 색상(hue)과
 * 채도는 그대로 두고 명도만 배경과 충분히 벌어질 때까지 조정한다. 밝은 배경에서는
 * 어둡게, 어두운 배경에서는 밝게 간다. 보정은 모듈이 로드될 때 한 번만 일어난다.
 */

import type { CSSProperties } from "react";

/** react-syntax-highlighter 가 쓰는 테마 모양: 선택자 → 인라인 스타일 */
export type PrismTheme = Record<string, CSSProperties>;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

export const MIN_CONTRAST = 4.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
  const m = light - c / 2;
  return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((b1 + m) * 255) };
}

function rgbToHsl({ r, g, b }: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;
  return [h, s * 100, l * 100];
}

/** hsl()/rgb()/#hex 문자열을 RGB 로 푼다. 모르는 형식(inherit, 변수 등)은 null. */
export function parseColor(value: string): Rgb | null {
  const text = value.trim().toLowerCase();

  const hex = text.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const digits = hex[1].length === 3 ? hex[1].split("").map((d) => d + d).join("") : hex[1];
    return { r: parseInt(digits.slice(0, 2), 16), g: parseInt(digits.slice(2, 4), 16), b: parseInt(digits.slice(4, 6), 16) };
  }

  const hsl = text.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/);
  if (hsl) return hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));

  const rgb = text.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };

  return null;
}

function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

function luminance({ r, g, b }: Rgb): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** 배경과 4.5:1 이 될 때까지 명도만 1%씩 움직인다. 이미 충분하면 그대로 둔다. */
export function ensureContrast(foreground: Rgb, background: Rgb, minimum = MIN_CONTRAST): Rgb {
  if (contrastRatio(foreground, background) >= minimum) return foreground;

  const [h, s, l] = rgbToHsl(foreground);
  const darkBackground = luminance(background) < 0.5;
  const step = darkBackground ? 1 : -1;

  let lightness = l;
  let candidate = foreground;
  while (lightness > 0 && lightness < 100) {
    lightness += step;
    candidate = hslToRgb(h, s, lightness);
    if (contrastRatio(candidate, background) >= minimum) return candidate;
  }
  // 끝까지 가도 모자라면 흑백으로 떨어진다. 실제 테마에서는 여기 오지 않는다.
  return darkBackground ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
}

const PRE_SELECTOR = 'pre[class*="language-"]';

/** 테마의 코드 영역 배경색. 없으면 흰색으로 본다. */
export function themeBackground(theme: PrismTheme): Rgb {
  const raw = theme[PRE_SELECTOR]?.background ?? theme['code[class*="language-"]']?.background;
  return (typeof raw === "string" && parseColor(raw)) || { r: 255, g: 255, b: 255 };
}

/** 모든 토큰 색을 코드 배경 대비 4.5:1 이상으로 맞춘 새 테마를 돌려준다. 원본은 건드리지 않는다. */
export function withAccessibleContrast(theme: PrismTheme, minimum = MIN_CONTRAST): PrismTheme {
  const background = themeBackground(theme);
  const result: PrismTheme = {};

  for (const [selector, style] of Object.entries(theme)) {
    const color = style?.color;
    const parsed = typeof color === "string" ? parseColor(color) : null;
    // 토큰 자신이 배경을 바꾸는 경우(선택 영역 등)는 그 배경 기준으로 보정한다.
    const ownBackground = typeof style?.background === "string" ? parseColor(style.background) : null;
    if (!parsed || selector.includes("::")) {
      result[selector] = style;
      continue;
    }
    const fixed = ensureContrast(parsed, ownBackground ?? background, minimum);
    result[selector] = fixed === parsed ? style : { ...style, color: toHex(fixed) };
  }

  return result;
}
