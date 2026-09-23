/**
 * 라우트 핸들러는 Web 표준 Request/Response 전역을 쓰므로 node 환경에서 돌린다.
 * (기본 jsdom 환경에는 Request 가 없다)
 *
 * @jest-environment node
 */
import { POST } from "./route";
import { revalidatePath } from "next/cache";
import { getAllPosts } from "@/entities/post/api";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/entities/post/api", () => ({ getAllPosts: jest.fn() }));
jest.mock("@/app/init-post-api", () => ({}));

const SECRET = "test-secret";

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

beforeEach(() => {
  jest.clearAllMocks();
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
});

describe("recent-change revalidation", () => {
  it("revalidates only articles edited inside the lookback window", async () => {
    const now = Date.now();
    jest.mocked(getAllPosts).mockResolvedValue([
      post("fresh", new Date(now - 60 * 60 * 1000)),
      post("stale", new Date(now - 72 * 60 * 60 * 1000)),
    ] as Awaited<ReturnType<typeof getAllPosts>>);

    const response = await POST(request({}));

    expect(await response.json()).toMatchObject({ posts: 1, lookbackHours: 24 });
    expect(revalidatedPaths()).toContain("/posts/fresh");
    expect(revalidatedPaths()).not.toContain("/posts/stale");
  });

  it("honours a wider lookback window", async () => {
    const now = Date.now();
    jest.mocked(getAllPosts).mockResolvedValue([
      post("stale", new Date(now - 72 * 60 * 60 * 1000)),
    ] as Awaited<ReturnType<typeof getAllPosts>>);

    await POST(request({ lookbackHours: 96 }));

    expect(revalidatedPaths()).toContain("/posts/stale");
  });

  it("refreshes the list pages even when no article changed", async () => {
    jest.mocked(getAllPosts).mockResolvedValue([] as Awaited<ReturnType<typeof getAllPosts>>);

    await POST(request({}));

    expect(revalidatedPaths()).toContain("/");
    expect(revalidatedPaths()).toContain("/sitemap.xml");
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
