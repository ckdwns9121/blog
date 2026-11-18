import { SITE_URL, normalizeSiteUrl } from ".";

describe("normalizeSiteUrl", () => {
  it("keeps the canonical www host", () => {
    expect(normalizeSiteUrl("https://www.changjun.dev")).toBe("https://www.changjun.dev");
  });

  it("upgrades the apex host to www, because production redirects apex there", () => {
    expect(normalizeSiteUrl("https://changjun.dev")).toBe("https://www.changjun.dev");
  });

  it("drops the trailing slash so callers can append paths", () => {
    expect(normalizeSiteUrl("https://changjun.dev/")).toBe("https://www.changjun.dev");
  });

  it("assumes https when the scheme is missing", () => {
    expect(normalizeSiteUrl("changjun.dev")).toBe("https://www.changjun.dev");
  });

  it("leaves another domain alone", () => {
    expect(normalizeSiteUrl("https://blog.example.com/")).toBe("https://blog.example.com");
  });

  it("keeps an explicit subpath", () => {
    expect(normalizeSiteUrl("https://example.com/blog/")).toBe("https://example.com/blog");
  });

  it("falls back to the site default for empty or unusable input", () => {
    expect(normalizeSiteUrl(undefined)).toBe(SITE_URL);
    expect(normalizeSiteUrl(null)).toBe(SITE_URL);
    expect(normalizeSiteUrl("   ")).toBe(SITE_URL);
    expect(normalizeSiteUrl("http://")).toBe(SITE_URL);
  });
});
