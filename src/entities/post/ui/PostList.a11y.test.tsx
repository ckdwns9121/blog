import { render } from "@testing-library/react";
import type { PostMetadata } from "../model/usePostsQuery";
import { PostList } from "./PostList";
import { expectNoA11yViolations } from "@/test/a11y";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const posts: PostMetadata[] = Array.from({ length: 25 }, (_, index) => ({
  id: `post-${index + 1}`,
  title: `글 ${index + 1}`,
  slug: `post-${index + 1}`,
  excerpt: index % 2 === 0 ? `요약 ${index + 1}` : "",
  publishedAt: new Date("2026-10-01T00:00:00.000Z"),
  updatedAt: new Date("2026-10-01T00:00:00.000Z"),
  tags: index % 3 === 0 ? [{ name: "태그", slug: "tag", postCount: 1 }] : [],
  coverImage: index % 4 === 0 ? `/images/post-${index + 1}/cover.webp` : undefined,
}));

beforeAll(() => {
  // 무한 스크롤용 IntersectionObserver 가 jsdom 에 없다.
  class FakeIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, "IntersectionObserver", { writable: true, value: FakeIntersectionObserver });
});

describe("PostList accessibility", () => {
  it("renders the first page of cards without axe violations", async () => {
    const { container } = render(<PostList posts={posts} postsPerPage={20} />);
    await expectNoA11yViolations(container);
  });

  it("renders the empty state without axe violations", async () => {
    const { container } = render(<PostList posts={[]} postsPerPage={20} />);
    await expectNoA11yViolations(container);
  });
});
