import { render } from "@testing-library/react";
import type { PostMetadata } from "../model/usePostsQuery";
import { PostCard } from "./PostCard";
import { expectNoA11yViolations } from "@/test/a11y";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const post: PostMetadata = {
  id: "post-1",
  title: "접근성 검사를 받는 글",
  slug: "a11y-post",
  excerpt: "목록 카드 하나가 스크린리더에게 어떻게 들리는지 확인한다.",
  publishedAt: new Date(2026, 9, 1),
  updatedAt: new Date(2026, 9, 1),
  tags: [
    { name: "접근성", slug: "a11y", postCount: 1 },
    { name: "테스트", slug: "testing", postCount: 1 },
  ],
  coverImage: "/images/a11y-post/cover.webp",
};

describe("PostCard accessibility", () => {
  it("has no axe violations with a thumbnail and tags", async () => {
    const { container } = render(<PostCard post={post} />);
    await expectNoA11yViolations(container);
  });

  it("has no axe violations without optional parts", async () => {
    const { container } = render(<PostCard post={{ ...post, coverImage: undefined, excerpt: "", tags: [] }} />);
    await expectNoA11yViolations(container);
  });
});
