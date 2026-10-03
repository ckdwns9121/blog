/**
 * 라우트 핸들러는 Web 표준 Request/Response 전역을 쓰므로 node 환경에서 돌린다.
 * (기본 jsdom 환경에는 Request 가 없다)
 *
 * @jest-environment node
 */
import { POST } from "./route";
import { revalidatePath } from "next/cache";
import { getAllPosts } from "@/entities/post/api";
import { getRedisClient } from "@/shared/utils/redis";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/entities/post/api", () => ({ getAllPosts: jest.fn() }));
jest.mock("@/app/init-post-api", () => ({}));
jest.mock("@/shared/utils/redis", () => ({ getRedisClient: jest.fn() }));

const SECRET = "test-secret";

/** 글별 "마지막으로 지운 updatedAt" 장부를 흉내 내는 인메모리 Redis */
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

function post(slug: string, updatedAt: Date) {
  return { id: slug, slug, title: slug, excerpt: "", tags: [], publishedAt: updatedAt, updatedAt };
}

const revalidatedPaths = () => jest.mocked(revalidatePath).mock.calls.map(([path]) => path);

const HOUR = 60 * 60 * 1000;

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
  it("revalidates one article and the list pages without loading the post list", async () => {
    const response = await POST(request({ slug: "my-post" }));

    expect(response.status).toBe(200);
    expect(getAllPosts).not.toHaveBeenCalled();
    expect(revalidatedPaths()).toContain("/posts/my-post");
    expect(revalidatedPaths()).toContain("/");
  });

  it("ignores the ledger so a manual run always takes effect", async () => {
    await POST(request({ slug: "my-post" }));

    expect(getRedisClient).not.toHaveBeenCalled();
    expect(revalidatedPaths()).toContain("/posts/my-post");
  });
});

describe("home page revalidation", () => {
  it("revalidates the home page as a page, never as a bare path", async () => {
    // revalidatePath("/") 뒤에는 Vercel에서 글 페이지 전부가 캐시에서 지워지는 것이 관찰됐다.
    // "/page" 태그는 홈에만 붙으므로 다른 페이지를 건드리지 않는다.
    jest.mocked(getAllPosts).mockResolvedValue([post("fresh", new Date(Date.now() - HOUR))] as Awaited<
      ReturnType<typeof getAllPosts>
    >);

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
    jest.mocked(getAllPosts).mockResolvedValue([
      post("fresh", new Date(now - HOUR)),
      post("stale", new Date(now - 72 * HOUR)),
    ] as Awaited<ReturnType<typeof getAllPosts>>);

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ posts: 1, skipped: 0, lookbackHours: 24 });
    expect(revalidatedPaths()).toContain("/posts/fresh");
    expect(revalidatedPaths()).not.toContain("/posts/stale");
  });

  it("honours a wider lookback window", async () => {
    const now = Date.now();
    jest.mocked(getAllPosts).mockResolvedValue([
      post("stale", new Date(now - 72 * HOUR)),
    ] as Awaited<ReturnType<typeof getAllPosts>>);

    await POST(request({ lookbackHours: 96 }));

    expect(revalidatedPaths()).toContain("/posts/stale");
  });

  it("refreshes the list pages together with a changed article", async () => {
    jest.mocked(getAllPosts).mockResolvedValue([
      post("fresh", new Date(Date.now() - HOUR)),
    ] as Awaited<ReturnType<typeof getAllPosts>>);

    await POST(request({}));

    expect(revalidatedPaths()).toContain("/");
    expect(revalidatedPaths()).toContain("/sitemap.xml");
  });

  it("invalidates nothing when no article changed", async () => {
    // 목록까지 지우면 크론이 돌 때마다 다음 방문자가 목록 렌더를 기다린다.
    jest.mocked(getAllPosts).mockResolvedValue([
      post("stale", new Date(Date.now() - 72 * HOUR)),
    ] as Awaited<ReturnType<typeof getAllPosts>>);

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

describe("revalidation ledger", () => {
  const editedAt = new Date(Date.now() - HOUR);

  it("does not invalidate the same edit twice across cron runs", async () => {
    // 되돌아보는 기간(24h)이 크론 주기보다 길어서, 글 하나를 고치면 그 뒤 모든 회차가
    // 같은 글과 목록을 다시 지웠다. 장부에 적힌 수정 시각과 같으면 건너뛴다.
    jest.mocked(getAllPosts).mockResolvedValue([post("fresh", editedAt)] as Awaited<ReturnType<typeof getAllPosts>>);

    const first = await POST(request({}));
    expect(await first.json()).toMatchObject({ posts: 1, skipped: 0 });
    expect(revalidatedPaths()).toContain("/posts/fresh");

    jest.mocked(revalidatePath).mockClear();
    const second = await POST(request({}));

    expect(await second.json()).toMatchObject({ revalidated: [], posts: 0, skipped: 1 });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("invalidates again once the article is edited after the last run", async () => {
    jest.mocked(getAllPosts).mockResolvedValue([post("fresh", editedAt)] as Awaited<ReturnType<typeof getAllPosts>>);
    await POST(request({}));

    const editedAgain = new Date(editedAt.getTime() + 10 * 60 * 1000);
    jest.mocked(getAllPosts).mockResolvedValue([post("fresh", editedAgain)] as Awaited<ReturnType<typeof getAllPosts>>);
    jest.mocked(revalidatePath).mockClear();

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ posts: 1, skipped: 0 });
    expect(revalidatedPaths()).toContain("/posts/fresh");
    expect(ledger.get("revalidate:post:fresh")).toBe(editedAgain.toISOString());
  });

  it("falls back to revalidating every recent article when the ledger is unavailable", async () => {
    // 장부는 비용을 줄이는 장치이지 정확성의 조건이 아니다. 없다고 재검증을 멈추면 안 된다.
    jest.mocked(getRedisClient).mockRejectedValue(new Error("Redis down"));
    jest.mocked(getAllPosts).mockResolvedValue([post("fresh", editedAt)] as Awaited<ReturnType<typeof getAllPosts>>);
    const logged = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(request({}));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ posts: 1, skipped: 0 });
    expect(revalidatedPaths()).toContain("/posts/fresh");
    expect(fakeRedis.set).not.toHaveBeenCalled();
    logged.mockRestore();
  });
});
