import React from "react";
import { render, screen } from "@testing-library/react";
import PostContent from "../../entities/post/PostContent";
import type { NotionBlock } from "../../types/notion";

// next-themes 모킹
jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light" }),
}));

// react-syntax-highlighter 모킹
jest.mock("react-syntax-highlighter", () => ({
  Prism: ({ children, language }: { children: string; language: string }) => (
    <pre data-testid="code-block" data-language={language}>
      {children}
    </pre>
  ),
}));

jest.mock("react-syntax-highlighter/dist/esm/styles/prism", () => ({
  oneLight: {},
  oneDark: {},
}));

describe("PostContent", () => {
  const mockBlocks: NotionBlock[] = [
    {
      id: "1",
      type: "heading_1",
      content: { text: "제목 1" },
    },
    {
      id: "2",
      type: "paragraph",
      content: { text: "이것은 문단입니다." },
    },
    {
      id: "3",
      type: "heading_2",
      content: { text: "제목 2" },
    },
    {
      id: "4",
      type: "code",
      content: { text: "console.log('Hello World');", language: "javascript" },
    },
    {
      id: "5",
      type: "bulleted_list_item",
      content: { text: "리스트 아이템 1" },
    },
    {
      id: "6",
      type: "quote",
      content: { text: "인용문입니다." },
    },
  ];

  it("제목 블록을 올바르게 렌더링한다", () => {
    render(<PostContent blocks={mockBlocks} />);

    expect(screen.getByText("제목 1")).toBeInTheDocument();
    expect(screen.getByText("제목 2")).toBeInTheDocument();
  });

  it("문단 블록을 올바르게 렌더링한다", () => {
    render(<PostContent blocks={mockBlocks} />);

    expect(screen.getByText("이것은 문단입니다.")).toBeInTheDocument();
  });

  it("코드 블록을 올바르게 렌더링한다", () => {
    render(<PostContent blocks={mockBlocks} />);

    const codeBlock = screen.getByTestId("code-block");
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveAttribute("data-language", "javascript");
    expect(codeBlock).toHaveTextContent("console.log('Hello World');");
  });

  it("리스트 아이템을 올바르게 렌더링한다", () => {
    render(<PostContent blocks={mockBlocks} />);

    expect(screen.getByText("리스트 아이템 1")).toBeInTheDocument();
  });

  it("인용문을 올바르게 렌더링한다", () => {
    render(<PostContent blocks={mockBlocks} />);

    expect(screen.getByText("인용문입니다.")).toBeInTheDocument();
  });

  it("빈 블록 배열을 처리한다", () => {
    render(<PostContent blocks={[]} />);

    // 에러가 발생하지 않아야 함
    expect(document.body).toBeInTheDocument();
  });

  it("알 수 없는 블록 타입을 처리한다", () => {
    const unknownBlocks: NotionBlock[] = [
      {
        id: "unknown",
        type: "unknown_type",
        content: { text: "알 수 없는 타입" },
      },
    ];

    render(<PostContent blocks={unknownBlocks} />);

    expect(screen.getByText("알 수 없는 타입")).toBeInTheDocument();
  });

  it("커스텀 클래스명을 적용한다", () => {
    const { container } = render(<PostContent blocks={mockBlocks} className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });
});
