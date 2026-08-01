import { render, screen } from "@testing-library/react";
import PostNavigation from "./PostNavigation";
import type { BlogPost } from "@/entities/post/model";

function makePost(slug: string, title: string): BlogPost {
  return {
    id: slug,
    title,
    slug,
    excerpt: "",
    publishedAt: new Date(2026, 0, 1),
    updatedAt: new Date(2026, 0, 1),
    tags: [],
    content: [],
  } as unknown as BlogPost;
}

const previousPost = makePost(
  "google-spread-sheets",
  "Google Spread Sheets로 모두가 관리할 수 있는 다국어 시스템 만들기",
);
const nextPost = makePost("ast-codemod", "추상구문트리(AST)와 Codemod로 기존 코드를 안전하게 마이그레이션하기");

describe("PostNavigation", () => {
  it("renders nothing when there is neither a previous nor a next post", () => {
    const { container } = render(<PostNavigation />);
    expect(container).toBeEmptyDOMElement();
  });

  it("stacks previous and next as separate list items", () => {
    render(<PostNavigation previousPost={previousPost} nextPost={nextPost} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(screen.getByText("이전 글")).toBeInTheDocument();
    expect(screen.getByText("다음 글")).toBeInTheDocument();
  });

  it("links each box to its post", () => {
    render(<PostNavigation previousPost={previousPost} nextPost={nextPost} />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", `/posts/${previousPost.slug}`);
    expect(links[1]).toHaveAttribute("href", `/posts/${nextPost.slug}`);
  });

  it("draws a border around each box so the two do not run together", () => {
    render(<PostNavigation previousPost={previousPost} nextPost={nextPost} />);

    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveClass("border", "border-line");
    }
  });

  it("clamps long titles to two lines instead of letting them overflow", () => {
    render(<PostNavigation previousPost={previousPost} />);

    expect(screen.getByText(previousPost.title)).toHaveClass("line-clamp-2");
  });

  it("renders only the side that exists", () => {
    render(<PostNavigation nextPost={nextPost} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByText("이전 글")).toBeNull();
    expect(screen.getByText("다음 글")).toBeInTheDocument();
  });
});
