import { fireEvent, render, screen } from "@testing-library/react";
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
  it("helps readers preview a post with its title, excerpt, date, and thumbnail", () => {
    const { container } = render(<PostCard post={post} />);

    expect(screen.getByText("2026.07.18")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: post.title })).toBeInTheDocument();
    expect(screen.getByText(post.excerpt)).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute("src", post.coverImage);
  });

  it("omits the thumbnail and empty excerpt when neither is available", () => {
    const { container } = render(<PostCard post={{ ...post, coverImage: undefined, excerpt: "" }} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("p")).toBeNull();
    expect(screen.getByRole("link", { name: post.title })).toHaveAttribute("href", `/posts/${post.slug}`);
  });

  it("lets readers open the post and notifies the containing navigation", () => {
    const onNavigate = jest.fn();
    render(<PostCard post={post} onNavigate={onNavigate} />);

    const link = screen.getByRole("link", { name: post.title });
    expect(link).toHaveAttribute("href", `/posts/${post.slug}`);
    fireEvent.click(link);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("offers up to two independent tag links for browsing related posts", () => {
    render(<PostCard post={{ ...post, tags: [
      ...post.tags,
      { name: "프론트엔드", slug: "프론트엔드", postCount: 1 },
      { name: "테스트", slug: "testing", postCount: 1 },
    ] }} />);

    expect(screen.getByRole("link", { name: "개발" })).toHaveAttribute("href", `/?tag=${encodeURIComponent("개발")}`);
    expect(screen.getByRole("link", { name: "프론트엔드" })).toHaveAttribute("href", `/?tag=${encodeURIComponent("프론트엔드")}`);
    expect(screen.queryByRole("link", { name: "테스트" })).toBeNull();
    expect(screen.getByRole("link", { name: post.title })).not.toContainElement(screen.getByRole("link", { name: "개발" }));
  });
});
