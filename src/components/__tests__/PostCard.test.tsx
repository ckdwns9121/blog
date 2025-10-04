// PostCard 컴포넌트 테스트
import { render, screen } from "@testing-library/react";
import { PostCard } from "../components/PostCard";
import type { BlogPost } from "../../types/notion";

// Mock Next.js Image 컴포넌트
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt="mock image" />;
  },
}));

// Mock Next.js Link 컴포넌트
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  },
}));

describe("PostCard", () => {
  const mockPost: BlogPost = {
    id: "1",
    title: "테스트 포스트",
    slug: "test-post",
    content: [],
    excerpt: "포스트 요약",
    publishedAt: new Date("2025-01-26"),
    updatedAt: new Date("2025-01-26"),
    category: {
      name: "JavaScript",
      slug: "javascript",
      postCount: 5,
    },
    tags: [
      { name: "React", slug: "react", postCount: 3 },
      { name: "Next.js", slug: "nextjs", postCount: 2 },
    ],
    coverImage: "https://example.com/image.jpg",
    readingTime: 5,
    toc: [],
  };

  it("포스트 제목을 렌더링해야 한다", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("테스트 포스트")).toBeInTheDocument();
  });

  it("포스트 요약을 렌더링해야 한다", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("포스트 요약")).toBeInTheDocument();
  });

  it("카테고리를 렌더링해야 한다", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });

  it("태그들을 렌더링해야 한다", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Next.js")).toBeInTheDocument();
  });

  it("읽는 시간을 렌더링해야 한다", () => {
    render(<PostCard post={mockPost} />);
    expect(screen.getByText("5분 읽기")).toBeInTheDocument();
  });

  it("썸네일 이미지가 있을 때 이를 렌더링해야 한다", () => {
    render(<PostCard post={mockPost} />);
    const image = screen.getByRole("img", { name: "테스트 포스트" });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "https://example.com/image.jpg");
  });

  it("포스트 링크가 올바른 URL로 설정되어야 한다", () => {
    render(<PostCard post={mockPost} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/posts/test-post");
  });
});
