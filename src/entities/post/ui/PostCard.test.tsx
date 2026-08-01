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
  it("shows the date, the title, and a one-line excerpt", () => {
    render(<PostCard post={post} />);

    expect(screen.getByText("2026.07.18")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: post.title })).toBeInTheDocument();

    // truncate가 한 줄을 넘는 요약을 잘라낸다.
    expect(screen.getByText(post.excerpt!)).toHaveClass("truncate");
  });

  it("omits tags and thumbnail", () => {
    render(<PostCard post={post} />);

    expect(screen.queryByText("#개발")).toBeNull();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("renders nothing in place of a missing excerpt", () => {
    render(<PostCard post={{ ...post, excerpt: "" }} />);

    expect(screen.getByRole("heading", { name: post.title })).toBeInTheDocument();
    expect(screen.queryByText(post.excerpt!)).toBeNull();
  });

  it("links the whole row to the post, named by its title alone", () => {
    render(<PostCard post={post} />);

    const link = screen.getByRole("link", { name: post.title });
    expect(link).toHaveAttribute("href", `/posts/${post.slug}`);
  });
});
