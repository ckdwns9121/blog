import { tagSlug } from "./notion-client";

describe("tagSlug", () => {
  it.each([
    ["개발", "개발"],
    ["Frontend Fundamentals", "frontend-fundamentals"],
    [" React & 상태 관리 ", "react-상태-관리"],
  ])("preserves URL-safe Unicode characters in %s", (value, expected) => {
    expect(tagSlug(value)).toBe(expected);
  });
});
