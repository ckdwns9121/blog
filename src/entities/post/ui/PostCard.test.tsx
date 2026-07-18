import { render, screen } from "@testing-library/react";
import type { PostMetadata } from "../model/usePostsQuery";
import { PostCard } from "./PostCard";

const post: PostMetadata = {
  id: "post-1",
  title: "작고 단순한 포스트 카드",
  slug: "compact-post-card",
  excerpt: "목록에서는 글의 핵심만 짧게 보여줍니다.",
  publishedAt: new Date(2026, 6, 18),
  updatedAt: new Date(2026, 6, 18),
  tags: [{ name: "개발", slug: "development", postCount: 1 }],
};

describe("PostCard", () => {
  it("shows only a compact date, title, and summary", () => {
    render(<PostCard post={post} />);

    const date = screen.getByText("2026.07.18");
    const title = screen.getByRole("heading", { name: post.title });
    const summary = screen.getByText(post.excerpt!);

    expect(date.classList.contains("text-xs")).toBe(true);
    expect(title.classList.contains("text-lg")).toBe(true);
    expect(summary.classList.contains("text-sm")).toBe(true);
    expect(screen.queryByText("#개발")).toBeNull();
  });
});
