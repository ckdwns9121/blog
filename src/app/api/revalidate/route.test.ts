/**
 * 라우트 핸들러는 Web 표준 Request/Response 전역을 쓰므로 node 환경에서 돌린다.
 * (기본 jsdom 환경에는 Request 가 없다)
 *
 * @jest-environment node
 */
import { POST } from "./route";
import { revalidatePath } from "next/cache";
import { getAllPosts } from "@/features/notion/service/notion-client";
import type { NotionPost } from "@/features/notion/types";
import { getRedisClient } from "@/shared/utils/redis";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
// 노트를 걸러내지 않는 쪽(features/notion 서비스)을 써야 노트 변경이 잡힌다.
jest.mock("@/features/notion/service/notion-client", () => ({ getAllPosts: jest.fn() }));
// entities/note/api 가 배럴을 가져오는데, 배럴은 jest 가 못 읽는 ESM UI 의존성을 끌고 온다.
jest.mock("@/features/notion", () => ({}));
jest.mock("@/app/init-post-api", () => ({}));
jest.mock("@/shared/utils/redis", () => ({ getRedisClient: jest.fn() }));

const SECRET = "test-secret";
const HOUR = 60 * 60 * 1000;

/** 페이지별 "마지막으로 지운 updatedAt" 장부를 흉내 내는 인메모리 Redis */
const ledger = new Map<string, string>();
const fakeRedis = {
  mGet: jest.fn(async (keys: string[]) => keys.map((key) => ledger.get(key) ?? null)),
  set: jest.fn(async (key: string, value: string) => {
    ledger.set(key, value);
    return "OK";
  }),
};

function request(body: unknown, token: string | null = SECRET): Request {
  return new Request("https://example.com/api/revalidate", {
    method: "POST",
    headers: token === null ? {} : { authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function page(slug: string, updatedAt: Date, contentType: NotionPost["contentType"]): NotionPost {
  const iso = updatedAt.toISOString();
  return {
    id: `id-${slug}`,
    slug,
    title: slug,
    published: true,
    createdAt: iso,
    publishedAt: iso,
    updatedAt: iso,
    tags: [],
    excerpt: "",
    contentType,
  };
}

const post = (slug: string, updatedAt: Date) => page(slug, updatedAt, "post");
const note = (title: string, updatedAt: Date) => page(title, updatedAt, "note");
const pages = (...items: NotionPost[]) => jest.mocked(getAllPosts).mockResolvedValue(items);

const revalidatedPaths = () => jest.mocked(revalidatePath).mock.calls.map(([path]) => path);

beforeEach(() => {
  jest.clearAllMocks();
  ledger.clear();
  jest.mocked(getRedisClient).mockResolvedValue(fakeRedis as unknown as Awaited<ReturnType<typeof getRedisClient>>);
  process.env.REVALIDATE_SECRET = SECRET;
});

describe("authorization", () => {
  it("rejects a request without a token", async () => {
    expect((await POST(request({}, null))).status).toBe(401);
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a wrong token without consulting Notion", async () => {
    expect((await POST(request({}, "wrong-secret"))).status).toBe(401);
    expect(getAllPosts).not.toHaveBeenCalled();
  });

  it("rejects every request when the server has no secret configured", async () => {
    delete process.env.REVALIDATE_SECRET;
    expect((await POST(request({}, "anything"))).status).toBe(401);
  });
});

describe("targeted revalidation", () => {
  it("revalidates one article and the post list pages without loading the post list", async () => {
    const response = await POST(request({ slug: "my-post" }));

    expect(response.status).toBe(200);
    expect(getAllPosts).not.toHaveBeenCalled();
    expect(revalidatedPaths()).toContain("/posts/my-post");
    expect(revalidatedPaths()).toContain("/");
    expect(revalidatedPaths()).not.toContain("/notes");
  });

  it("ignores the ledger so a manual run always takes effect", async () => {
    await POST(request({ slug: "my-post" }));

    expect(getRedisClient).not.toHaveBeenCalled();
    expect(revalidatedPaths()).toContain("/posts/my-post");
  });

  it("revalidates one note by its url slug together with the notes list", async () => {
    const response = await POST(request({ note: "오늘의-생각" }));

    expect(await response.json()).toMatchObject({ reason: "note" });
    expect(getAllPosts).not.toHaveBeenCalled();
    expect(revalidatedPaths()).toEqual(["/notes/오늘의-생각", "/notes"]);
  });
});

describe("home page revalidation", () => {
  it("revalidates the home page as a page, never as a bare path", async () => {
    // revalidatePath("/") 뒤에는 Vercel에서 글 페이지 전부가 캐시에서 지워지는 것이 관찰됐다.
    // "/page" 태그는 홈에만 붙으므로 다른 페이지를 건드리지 않는다.
    pages(post("fresh", new Date(Date.now() - HOUR)));

    await POST(request({}));

    expect(revalidatePath).toHaveBeenCalledWith("/", "page");
    const bareRootCalls = jest.mocked(revalidatePath).mock.calls.filter(([path, type]) => path === "/" && !type);
    expect(bareRootCalls).toHaveLength(0);
  });

  it("applies the same rule to a manual run", async () => {
    await POST(request({ slug: "my-post" }));

    expect(revalidatePath).toHaveBeenCalledWith("/", "page");
  });
});

describe("recent-change revalidation", () => {
  it("revalidates only articles edited inside the lookback window", async () => {
    const now = Date.now();
    pages(post("fresh", new Date(now - HOUR)), post("stale", new Date(now - 72 * HOUR)));

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ posts: 1, skipped: 0, lookbackHours: 24 });
    expect(revalidatedPaths()).toContain("/posts/fresh");
    expect(revalidatedPaths()).not.toContain("/posts/stale");
  });

  it("honours a wider lookback window", async () => {
    pages(post("stale", new Date(Date.now() - 72 * HOUR)));

    await POST(request({ lookbackHours: 96 }));

    expect(revalidatedPaths()).toContain("/posts/stale");
  });

  it("refreshes the post list pages together with a changed article", async () => {
    pages(post("fresh", new Date(Date.now() - HOUR)));

    await POST(request({}));

    expect(revalidatedPaths()).toContain("/");
    expect(revalidatedPaths()).toContain("/sitemap.xml");
    // 노트 목록에는 글이 실리지 않으니 건드릴 이유가 없다.
    expect(revalidatedPaths()).not.toContain("/notes");
  });

  it("invalidates nothing when no article changed", async () => {
    // 목록까지 지우면 크론이 돌 때마다 다음 방문자가 목록 렌더를 기다린다.
    pages(post("stale", new Date(Date.now() - 72 * HOUR)));

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ revalidated: [], posts: 0 });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("invalidates nothing when the post list cannot be loaded", async () => {
    // 무효화만 해두면 다음 방문자가 실패하는 렌더링을 떠안는다. 그래서 건드리지 않고 알린다.
    jest.mocked(getAllPosts).mockRejectedValue(new Error("Notion unavailable"));
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request({}));

    expect(response.status).toBe(502);
    expect(revalidatePath).not.toHaveBeenCalled();
    logged.mockRestore();
  });
});

describe("note revalidation", () => {
  const editedAt = new Date(Date.now() - HOUR);

  it("revalidates a new note and the notes list", async () => {
    // 예전에는 entities/post 의 getAllPosts 로 변경을 봤는데, 그 함수는 노트를 걸러낸다.
    // 그래서 노트만 새로 쓰면 아무것도 지워지지 않아 /notes 가 갱신되지 않았다.
    pages(note("오늘의 생각", editedAt));

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ posts: 1, skipped: 0 });
    expect(revalidatedPaths()).toContain("/notes/오늘의-생각");
    expect(revalidatedPaths()).toContain("/notes");
  });

  it("leaves the post lists alone when only a note changed", async () => {
    pages(note("오늘의 생각", editedAt));

    await POST(request({}));

    expect(revalidatedPaths()).not.toContain("/");
    expect(revalidatedPaths()).not.toContain("/sitemap.xml");
    expect(revalidatedPaths()).not.toContain("/feed.xml");
  });

  it("revalidates both lists when a post and a note changed", async () => {
    pages(post("fresh", editedAt), note("오늘의 생각", editedAt));

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ posts: 2 });
    expect(revalidatedPaths()).toEqual(
      expect.arrayContaining(["/posts/fresh", "/notes/오늘의-생각", "/", "/notes", "/sitemap.xml"]),
    );
  });
});

describe("revalidation ledger", () => {
  const editedAt = new Date(Date.now() - HOUR);

  it("does not invalidate the same edit twice across cron runs", async () => {
    // 되돌아보는 기간(24h)이 크론 주기보다 길어서, 글 하나를 고치면 그 뒤 모든 회차가
    // 같은 글과 목록을 다시 지웠다. 장부에 적힌 수정 시각과 같으면 건너뛴다.
    pages(post("fresh", editedAt));

    const first = await POST(request({}));
    expect(await first.json()).toMatchObject({ posts: 1, skipped: 0 });
    expect(revalidatedPaths()).toContain("/posts/fresh");

    jest.mocked(revalidatePath).mockClear();
    const second = await POST(request({}));

    expect(await second.json()).toMatchObject({ revalidated: [], posts: 0, skipped: 1 });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("invalidates again once the article is edited after the last run", async () => {
    pages(post("fresh", editedAt));
    await POST(request({}));

    const editedAgain = new Date(editedAt.getTime() + 10 * 60 * 1000);
    pages(post("fresh", editedAgain));
    jest.mocked(revalidatePath).mockClear();

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ posts: 1, skipped: 0 });
    expect(revalidatedPaths()).toContain("/posts/fresh");
    expect(ledger.get("revalidate:page:id-fresh")).toBe(editedAgain.toISOString());
  });

  it("keeps notes in the same ledger", async () => {
    pages(note("오늘의 생각", editedAt));
    await POST(request({}));
    jest.mocked(revalidatePath).mockClear();

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ revalidated: [], skipped: 1 });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("falls back to revalidating every recent article when the ledger is unavailable", async () => {
    // 장부는 비용을 줄이는 장치이지 정확성의 조건이 아니다. 없다고 재검증을 멈추면 안 된다.
    jest.mocked(getRedisClient).mockRejectedValue(new Error("Redis down"));
    pages(post("fresh", editedAt));
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request({}));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ posts: 1, skipped: 0 });
    expect(revalidatedPaths()).toContain("/posts/fresh");
    expect(fakeRedis.set).not.toHaveBeenCalled();
    logged.mockRestore();
  });
});
