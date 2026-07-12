import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { resetSearchPostsCache } from "@/features/search/api/searchPosts";
import { SearchButton } from "./SearchButton";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("../../../components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div {...props}>{children}</div>
  ),
  DialogTitle: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props}>{children}</h2>
  ),
  DialogDescription: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props}>{children}</p>
  ),
}));

const searchDocument = {
  id: "post-1",
  title: "검색 복구",
  slug: "search-recovery",
  excerpt: "정적 인덱스",
  publishedAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-02T00:00:00.000Z",
  tags: [{ name: "검색", slug: "검색", postCount: 0 }],
  searchText: "본문 검색",
};
const originalFetch = Object.getOwnPropertyDescriptor(globalThis, "fetch");

describe("SearchButton", () => {
  beforeEach(() => {
    resetSearchPostsCache();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    if (originalFetch) {
      Object.defineProperty(globalThis, "fetch", originalFetch);
    } else {
      Reflect.deleteProperty(globalThis, "fetch");
    }
  });

  it("wires a failed static fetch to the error state and retries successfully", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue([searchDocument]),
      } as unknown as Response);
    Object.defineProperty(globalThis, "fetch", {
      configurable: true,
      value: fetchMock,
      writable: true,
    });

    render(<SearchButton />);
    fireEvent.click(screen.getByRole("button", { name: "검색" }));

    expect(
      await screen.findByText("검색 데이터를 불러오지 못했습니다"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(await screen.findByText("1개의 포스트")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
