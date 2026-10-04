import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * 실제 배포 페이지를 axe-core 로 검사한다.
 *
 * 컴포넌트 단위 jest-axe 는 조립 전 조각만 본다. 글 페이지에서 제목 h1 과 본문 h2 의
 * 순서, 헤더·푸터 랜드마크의 중복, 다크 모드 명도 대비처럼 조각을 합쳐야 드러나는
 * 문제는 여기서만 잡힌다. WCAG 2.1 A/AA 와 모범 사례 규칙을 켠다.
 */

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

async function scan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(TAGS)
    // 댓글은 utterances(GitHub) iframe 이라 우리가 고칠 수 없다.
    .exclude("iframe.utterances-frame")
    // Sandpack 내부 UI 의 업스트림 문제: 탭 div 안에 button 이 들어 있고(nested-interactive),
    // CodeMirror 스크롤 영역이 초점을 못 받는다(scrollable-region-focusable). 둘 다 우리 코드가
    // 아니다. 색 대비는 sandpackTheme.ts 로 우리가 맞추므로 검사에 남긴다.
    .exclude(".sp-tabs")
    .exclude(".cm-scroller")
    .analyze();

  // 실패 메시지에 어느 요소가 어떤 규칙을 어겼는지 그대로 남긴다.
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

async function firstLink(page: Page, selector: string): Promise<string> {
  const href = await page.locator(selector).first().getAttribute("href");
  if (!href) throw new Error(`No link matched ${selector}`);
  return href;
}

for (const path of ["/", "/notes", "/about", "/tags", "/search"]) {
  test(`${path} has no axe violations`, async ({ page }) => {
    await page.goto(path);
    await scan(page);
  });
}

for (const theme of ["light", "dark"] as const) {
  test(`the first post has no axe violations (${theme})`, async ({ page }) => {
    // next-themes 는 localStorage 의 theme 값을 읽어 <html class="dark"> 를 붙인다.
    // 클래스를 손으로 붙이면 CodeBlock 처럼 resolvedTheme 을 보는 컴포넌트가 따라오지 않으므로
    // 저장소에 값을 심고 페이지를 처음부터 그 테마로 연다.
    await page.addInitScript((value) => window.localStorage.setItem("theme", value), theme);
    await page.goto("/");
    const href = await firstLink(page, 'a[href^="/posts/"]');
    await page.goto(href);
    await page.locator("article h1").waitFor();
    await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*dark).*$/);
    await scan(page);
  });
}

test("the first note has no axe violations", async ({ page }) => {
  await page.goto("/notes");
  const links = page.locator('a[href^="/notes/"]');
  test.skip((await links.count()) === 0, "노트가 없다");
  await page.goto(await firstLink(page, 'a[href^="/notes/"]'));
  await scan(page);
});

test("the opened mobile menu and table of contents have no axe violations", async ({ page, isMobile }) => {
  test.skip(!isMobile, "모바일 전용 UI");
  await page.goto("/");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await scan(page);

  const href = await firstLink(page, 'a[href^="/posts/"]');
  await page.goto(href);
  const toc = page.getByRole("button", { name: "목차 열기" });
  test.skip((await toc.count()) === 0, "목차가 없는 글");
  await toc.click();
  await scan(page);
});

test("the search dialog has no axe violations", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByRole("dialog").waitFor();
  await scan(page);
});
