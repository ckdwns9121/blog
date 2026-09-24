import { getOptimizedImageUrl } from "./imageMapper";

describe("getOptimizedImageUrl", () => {
  it("keeps external image urls untouched", () => {
    const notion = "https://www.notion.so/image/https%3A%2F%2Fexample.com%2Fa.png?table=block";
    expect(getOptimizedImageUrl(notion)).toBe(notion);
  });

  it("turns an absolute url pointing at this site into a path", () => {
    // Notion은 외부 이미지 주소를 절대 URL로만 저장한다. 그 주소가 이 사이트를 가리키면
    // next/image가 원격 이미지로 보고 막아버리므로 경로로 낮춰야 한다.
    expect(getOptimizedImageUrl("https://www.changjun.dev/images/diagram.png")).toBe("/images/diagram.png");
  });

  it("treats the bare domain as the same site", () => {
    expect(getOptimizedImageUrl("https://changjun.dev/images/diagram.png")).toBe("/images/diagram.png");
  });

  it("keeps the query string when stripping the origin", () => {
    expect(getOptimizedImageUrl("https://www.changjun.dev/images/a.png?v=2")).toBe("/images/a.png?v=2");
  });

  it("leaves relative paths alone", () => {
    expect(getOptimizedImageUrl("/images/a.png")).toBe("/images/a.png");
  });
});
