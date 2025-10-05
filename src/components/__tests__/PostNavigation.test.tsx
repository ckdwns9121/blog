import React from "react";
import { render, screen } from "@testing-library/react";
import PostNavigation from "../../entities/post/PostNavigation";
import type { BlogPost } from "../../types/notion";

// next/link 모킹
jest.mock("next/link", () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

// @heroicons/react 모킹
jest.mock("@heroicons/react/24/outline", () => ({
  ChevronLeftIcon: () => <div data-testid="chevron-left" />,
  ChevronRightIcon: () => <div data-testid="chevron-right" />,
}));

const mockPost: BlogPost = {
  id: "1",
  title: "테스트 포스트",
  slug: "test-post",
  content: [],
  excerpt: "테스트 요약",
  publishedAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
  category: { name: "테스트", slug: "test", postCount: 1 },
  tags: [{ name: "테스트", slug: "test", postCount: 1 }],
  readingTime: 5,
  toc: [],
};

describe("PostNavigation", () => {
  it("이전 포스트와 다음 포스트를 모두 렌더링한다", () => {
    render(<PostNavigation previousPost={mockPost} nextPost={mockPost} />);

    expect(screen.getByText("이전 글")).toBeInTheDocument();
    expect(screen.getByText("다음 글")).toBeInTheDocument();
    expect(screen.getAllByText("테스트 포스트")).toHaveLength(2);
  });

  it("이전 포스트만 렌더링한다", () => {
    render(<PostNavigation previousPost={mockPost} />);

    expect(screen.getByText("이전 글")).toBeInTheDocument();
    expect(screen.queryByText("다음 글")).not.toBeInTheDocument();
    expect(screen.getByText("테스트 포스트")).toBeInTheDocument();
  });

  it("다음 포스트만 렌더링한다", () => {
    render(<PostNavigation nextPost={mockPost} />);

    expect(screen.queryByText("이전 글")).not.toBeInTheDocument();
    expect(screen.getByText("다음 글")).toBeInTheDocument();
    expect(screen.getByText("테스트 포스트")).toBeInTheDocument();
  });

  it("포스트가 없을 때 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<PostNavigation />);

    expect(container.firstChild).toBeNull();
  });

  it("올바른 링크를 생성한다", () => {
    render(<PostNavigation previousPost={mockPost} nextPost={mockPost} />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/posts/test-post");
    expect(links[1]).toHaveAttribute("href", "/posts/test-post");
  });

  it("아이콘을 올바르게 렌더링한다", () => {
    render(<PostNavigation previousPost={mockPost} nextPost={mockPost} />);

    expect(screen.getByTestId("chevron-left")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-right")).toBeInTheDocument();
  });

  it("커스텀 클래스명을 적용한다", () => {
    const { container } = render(
      <PostNavigation previousPost={mockPost} nextPost={mockPost} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
