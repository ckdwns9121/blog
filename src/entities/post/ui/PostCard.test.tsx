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
  coverImage: "/images/compact-post-card/cover.webp",
};

describe("PostCard", () => {
  it("shows only the date and the title", () => {
    render(<PostCard post={post} />);

    expect(screen.getByText("2026.07.18")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: post.title })).toBeInTheDocument();
  });

  it("omits the excerpt, tags, and thumbnail", () => {
    render(<PostCard post={post} />);

    expect(screen.queryByText(post.excerpt!)).toBeNull();
    expect(screen.queryByText("#개발")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("links the whole row to the post, named by its title alone", () => {
    render(<PostCard post={post} />);

    const link = screen.getByRole("link", { name: post.title });
    expect(link).toHaveAttribute("href", `/posts/${post.slug}`);
  });
});
