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
  it("shows a compact date, title, summary, and tags", () => {
    render(<PostCard post={post} />);

    const date = screen.getByText("2026.07.18");
    const title = screen.getByRole("heading", { name: post.title });
    const summary = screen.getByText(post.excerpt!);

    expect(date.classList.contains("text-xs")).toBe(true);
    expect(title.classList.contains("text-lg")).toBe(true);
    expect(summary.classList.contains("text-sm")).toBe(true);
    expect(screen.getByText("#개발")).toBeInTheDocument();
  });

  it("wraps the whole card in a single link to the post", () => {
    render(<PostCard post={post} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", `/posts/${post.slug}`);
  });

  it("renders a monogram fallback when the post has no image", () => {
    render(<PostCard post={post} />);

    // 커버도 본문 이미지도 없으므로 제목 첫 글자가 폴백 썸네일로 표시된다.
    expect(screen.getByText("작")).toBeInTheDocument();
  });

  it("renders the cover image when one is available", () => {
    render(<PostCard post={{ ...post, coverImage: "/images/compact-post-card/cover.webp" }} />);

    expect(screen.queryByText("작")).toBeNull();
    expect(screen.getByRole("presentation", { hidden: true })).toBeInTheDocument();
  });

  it("shows at most three tags", () => {
    const manyTags = ["a", "b", "c", "d"].map((name) => ({ name, slug: name, postCount: 1 }));
    render(<PostCard post={{ ...post, tags: manyTags }} />);

    expect(screen.getByText("#a")).toBeInTheDocument();
    expect(screen.queryByText("#d")).toBeNull();
  });
});
